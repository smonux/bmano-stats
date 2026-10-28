# /// script
# dependencies = ["openstep-parser"]
# ///
"""Check Xcode resource references in Linux; this does not replace an Xcode build."""
import json
import plistlib
from pathlib import Path
from openstep_parser import OpenStepDecoder

root = Path(__file__).resolve().parents[1]
with (root / "ios/App/App.xcodeproj/project.pbxproj").open() as source:
    project = OpenStepDecoder.ParseFromFile(source)
objects = project["objects"]
resources = [objects[item] for obj in objects.values()
             if obj.get("isa") == "PBXResourcesBuildPhase" for item in obj["files"]]
references = [objects[item["fileRef"]] for item in resources]
assert any(item.get("path") == "PrivacyInfo.xcprivacy" for item in references)
strings = next(item for item in references if item.get("name") == "InfoPlist.strings")
assert len(strings["children"]) == 7
for item in strings["children"]:
    assert (root / "ios/App/App" / objects[item]["path"]).is_file()
with (root / "ios/App/App/PrivacyInfo.xcprivacy").open("rb") as source:
    privacy = plistlib.load(source)
assert privacy["NSPrivacyAccessedAPITypes"][0]["NSPrivacyAccessedAPITypeReasons"] == ["C617.1"]
with (root / "ios/App/App/Info.plist").open("rb") as source:
    info = plistlib.load(source)
assert "NSMicrophoneUsageDescription" in info
assert not any(key in info for key in ["NSSpeechRecognitionUsageDescription", "NSCameraUsageDescription", "UIBackgroundModes"])
print(json.dumps({"projectSyntax": "valid OpenStep plist", "microphoneLocalizations": 7,
                  "privacyResourceInBuildPhase": True, "xcodeBuildExecuted": False}, indent=2))
