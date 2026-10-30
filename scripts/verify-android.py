# /// script
# dependencies = []
# ///
"""Verify compiled Android containers locally; this does not install or upload them."""

import argparse
import hashlib
import json
import os
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
ANDROID = "{http://schemas.android.com/apk/res/android}"
BUNDLETOOL_SHA256 = "a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29"
MODEL_SHA256 = "b6e02f048568ac5d01a2042556c658061e699acbc0aa2a1439f52f3d461dffeb"


def sha256(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sdk", default=os.environ.get(
        "ANDROID_HOME", str(ROOT / "node_modules/.cache/android-sdk")))
    parser.add_argument("--java-home", default=os.environ.get(
        "JAVA_HOME", str(ROOT / "node_modules/.cache/mobile-tools/jdk")))
    parser.add_argument("--bundletool", default=os.environ.get(
        "BUNDLETOOL_PATH", str(ROOT / "node_modules/.cache/mobile-tools/bundletool-all-1.18.3.jar")))
    args = parser.parse_args()
    sdk, java_home, bundletool = map(Path, (args.sdk, args.java_home, args.bundletool))
    require(sha256(bundletool) == BUNDLETOOL_SHA256,
            "Expected the official bundletool 1.18.3 release asset (SHA-256 mismatch)")
    logs = ROOT / "artifacts/mobile/logs"
    logs.mkdir(parents=True, exist_ok=True)
    env = {**os.environ, "JAVA_HOME": str(java_home), "ANDROID_HOME": str(sdk)}

    def run(name, command):
        result = subprocess.run([str(arg) for arg in command], cwd=ROOT, env=env,
                                capture_output=True, text=True, check=False)
        (logs / name).write_text(result.stdout + result.stderr)
        result.check_returncode()
        return result.stdout

    java = java_home / "bin/java"
    apk = ROOT / "android/app/build/outputs/apk/debug/app-debug.apk"
    aab = ROOT / "android/app/build/outputs/bundle/release/app-release.aab"
    version = json.loads((ROOT / "package.json").read_text())["version"]
    gradle = (ROOT / "android/app/build.gradle").read_text()
    build = int(re.search(r"versionCode (\d+)", gradle)[1])
    app_id = json.loads((ROOT / "capacitor.config.json").read_text())["appId"]
    allowed = {"android.permission.INTERNET", "android.permission.RECORD_AUDIO",
               "android.permission.MODIFY_AUDIO_SETTINGS",
               f"{app_id}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"}

    signature = run("apk-signature.log", [sdk / "build-tools/35.0.0/apksigner",
                    "verify", "--verbose", "--print-certs", apk])
    require("CN=Android Debug" in signature, "APK must use a debug certificate")
    require("Verified using v2 scheme (APK Signature Scheme v2): true" in signature,
            "APK signature v2 verification failed")
    run("aab-validation.log", [java, "-jar", bundletool, "validate", f"--bundle={aab}"])
    aab_signature = run("aab-signature.log", [java_home / "bin/jarsigner", "-verify", aab])
    require("jar is unsigned" in aab_signature, "Release signing changed; review it explicitly")

    manifests = {
        "apk": run("apk-manifest.xml", [sdk / "cmdline-tools/latest/bin/apkanalyzer",
                                        "manifest", "print", apk]),
        "aab": run("aab-manifest.xml", [java, "-jar", bundletool, "dump", "manifest",
                                        f"--bundle={aab}", "--module=base"]),
    }
    report = {"schemaVersion": 1, "bundletoolVersion": "1.18.3",
              "bundletoolSha256": BUNDLETOOL_SHA256,
              "installedOnDevice": False, "nativeRuntimeTested": False, "artifacts": {}}
    for kind, path, prefix, signing in [
        ("apk", apk, "assets/public/", "debug certificate; apksigner v2 verified"),
        ("aab", aab, "base/assets/public/", "unsigned release; upload signing still required"),
    ]:
        manifest = ET.fromstring(manifests[kind])
        require(manifest.get("package") == app_id, f"{kind}: unexpected application ID")
        require(manifest.get(ANDROID + "versionName") == version, f"{kind}: version mismatch")
        require(manifest.get(ANDROID + "versionCode") == str(build), f"{kind}: version code mismatch")
        sdk_element = manifest.find("uses-sdk")
        require(sdk_element.get(ANDROID + "minSdkVersion") == "24", f"{kind}: min SDK mismatch")
        require(sdk_element.get(ANDROID + "targetSdkVersion") == "36", f"{kind}: target mismatch")
        permissions = {element.get(ANDROID + "name") for element in manifest
                       if element.tag.startswith("uses-permission")}
        require(permissions == allowed, f"{kind}: unexpected merged permissions: {permissions}")
        application = manifest.find("application")
        require(application.get(ANDROID + "allowBackup") == "false", f"{kind}: backup enabled")
        require(application.get(ANDROID + "usesCleartextTraffic") == "false",
                f"{kind}: cleartext enabled")
        debuggable = application.get(ANDROID + "debuggable", "false") == "true"
        require(debuggable == (kind == "apk"), f"{kind}: unexpected debuggable status")
        microphone = next(element for element in manifest.findall("uses-feature")
                          if element.get(ANDROID + "name") == "android.hardware.microphone")
        require(microphone.get(ANDROID + "required") == "false", f"{kind}: mandatory microphone")
        providers = application.findall("provider")
        require(all(item.get(ANDROID + "exported", "false") == "false" for item in providers),
                f"{kind}: exported provider")

        with ZipFile(path) as archive:
            require(archive.testzip() is None, f"{kind}: corrupt ZIP entry")
            names = archive.namelist()
            models = [name for name in names if name.endswith(".cact")]
            require(models == [prefix + "models/whistle.cact"], f"{kind}: duplicate/unused model")
            model = archive.read(models[0])
            require(len(model) == 16919407 and hashlib.sha256(model).hexdigest() == MODEL_SHA256,
                    f"{kind}: invalid Whistle weights")
            require(not any(name.endswith((".keystore", ".jks", ".p12")) for name in names),
                    f"{kind}: private signing material in container")
            require(not any(re.search(r"META-INF/[^/]+\.(SF|RSA|DSA|EC)$", name, re.I)
                            for name in names) or kind == "apk", f"{kind}: signed release")
            assets = [name for name in names if name.startswith(prefix) and not name.endswith("/")]
            expected_assets = sorted(str(item.relative_to(ROOT / "dist-native"))
                                     for item in (ROOT / "dist-native").rglob("*") if item.is_file())
            # Capacitor sync adds these two empty compatibility stubs; no Cordova plugins are used.
            generated_stubs = {"cordova.js", "cordova_plugins.js"}
            require({name.removeprefix(prefix) for name in assets} == set(expected_assets) | generated_stubs,
                    f"{kind}: packaged assets differ from dist-native")
            for name in assets:
                relative = name.removeprefix(prefix)
                if relative in generated_stubs:
                    require(archive.getinfo(name).file_size == 0, f"{kind}: nonempty Cordova stub")
                    continue
                expected = ROOT / "dist-native" / relative
                require(hashlib.sha256(archive.read(name)).hexdigest() == sha256(expected),
                        f"{kind}: stale/changed asset {name}")
            config_path = prefix.removesuffix("public/") + "capacitor.config.json"
            config = json.loads(archive.read(config_path))
            require(config["appId"] == app_id and not config["server"].get("url"),
                    f"{kind}: remote or unexpected app configuration")
            require(config["server"]["androidScheme"] == "https", f"{kind}: unexpected origin")
            native_libraries = [name for name in names if name.endswith(".so")]
            require(not native_libraries, f"{kind}: new native libraries need page-size audit")
        report["artifacts"][kind] = {
            "source": str(path.relative_to(ROOT)), "sha256": sha256(path),
            "bytes": path.stat().st_size, "variant": "debug" if kind == "apk" else "release",
            "signing": signing, "appId": app_id, "versionName": version, "versionCode": build,
            "minSdk": 24, "targetSdk": 36, "permissions": sorted(permissions),
            "debuggable": debuggable, "whistleBytes": len(model), "whistleSha256": MODEL_SHA256,
            "packagedAssetsMatchBuild": True, "nativeLibraries": native_libraries,
        }
    (logs / "android-verification.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
