import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';

const microphones = {
  es: 'Mantén pulsado Voz para registrar una jugada. El audio se procesa en este dispositivo y no se guarda. Puedes usar la entrada manual sin micrófono.',
  en: 'Hold Voice to record a play. Audio is processed on this device and is not saved. Manual entry works without microphone access.',
  de: 'Halte Sprache gedrückt, um eine Aktion zu erfassen. Audio wird auf diesem Gerät verarbeitet und nicht gespeichert. Manuelle Eingabe funktioniert ohne Mikrofon.',
  fr: 'Maintenez Voix pour saisir une action. Le son est traité sur cet appareil et n’est pas enregistré. La saisie manuelle fonctionne sans microphone.',
  it: 'Tieni premuto Voce per registrare un’azione. L’audio viene elaborato sul dispositivo e non viene salvato. Puoi inserire manualmente senza microfono.',
  nl: 'Houd Spraak ingedrukt om een actie vast te leggen. Audio wordt op dit apparaat verwerkt en niet opgeslagen. Handmatige invoer werkt zonder microfoon.',
  pl: 'Przytrzymaj Głos, aby zapisać akcję. Dźwięk jest przetwarzany na urządzeniu i nie jest zapisywany. Wpisywanie ręczne nie wymaga mikrofonu.',
};
await mkdir('docs/stores/assets', { recursive: true });
await writeFile('docs/stores/microphone-usage.json', JSON.stringify(microphones, null, 2) + '\n');
for (const [language, text] of Object.entries(microphones)) {
  const folder = `ios/App/App/${language}.lproj`;
  await mkdir(folder, { recursive: true });
  await writeFile(
    `${folder}/InfoPlist.strings`,
    `"NSMicrophoneUsageDescription" = ${JSON.stringify(text)};\n`,
  );
}
let plist = await readFile('ios/App/App/Info.plist', 'utf8');
if (!plist.includes('NSMicrophoneUsageDescription'))
  plist = plist.replace(
    '<key>LSRequiresIPhoneOS</key>',
    `<key>NSMicrophoneUsageDescription</key><string>${microphones.en}</string>\n<key>ITSAppUsesNonExemptEncryption</key><false/>\n<key>LSRequiresIPhoneOS</key>`,
  );
plist = plist.replace('<string>armv7</string>', '<string>arm64</string>');
plist = plist.replaceAll(/\s*<string>UIInterfaceOrientationLandscape(?:Left|Right)<\/string>/g, '');
await writeFile('ios/App/App/Info.plist', plist);
await writeFile(
  'ios/App/App/PrivacyInfo.xcprivacy',
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>NSPrivacyTracking</key><false/>
<key>NSPrivacyTrackingDomains</key><array/>
<key>NSPrivacyCollectedDataTypes</key><array/>
<key>NSPrivacyAccessedAPITypes</key><array><dict>
<key>NSPrivacyAccessedAPIType</key><string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
<key>NSPrivacyAccessedAPITypeReasons</key><array><string>C617.1</string></array>
</dict></array></dict></plist>\n`,
);

// Stable resource IDs, confined to this new project. Reruns do not duplicate references.
const id = (n) => `ABCD2026102800000000${String(n).padStart(4, '0')}`;
let project = await readFile('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
if (!project.includes(id(1))) {
  const languages = Object.keys(microphones);
  project = project.replace(
    '/* End PBXBuildFile section */',
    `${id(1)} = {isa = PBXBuildFile; fileRef = ${id(2)}; };\n${id(3)} = {isa = PBXBuildFile; fileRef = ${id(4)}; };\n/* End PBXBuildFile section */`,
  );
  const files = languages
    .map(
      (language, index) =>
        `${id(10 + index)} = {isa = PBXFileReference; lastKnownFileType = text.plist.strings; name = ${language}; path = ${language}.lproj/InfoPlist.strings; sourceTree = "<group>"; };`,
    )
    .join('\n');
  project = project.replace(
    '/* End PBXFileReference section */',
    `${files}\n${id(4)} = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };\n/* End PBXFileReference section */`,
  );
  project = project.replace(
    '/* End PBXVariantGroup section */',
    `${id(2)} = {isa = PBXVariantGroup; children = (${languages.map((_, index) => id(10 + index)).join(',')},); name = InfoPlist.strings; sourceTree = "<group>"; };\n/* End PBXVariantGroup section */`,
  );
  project = project.replace(
    '9582B6822FE993A50072D4E8 /* SceneDelegate.swift */,',
    `${id(2)}, ${id(4)},\n9582B6822FE993A50072D4E8 /* SceneDelegate.swift */,`,
  );
  project = project.replace(
    'files = (\n\t\t\t\t504EC312',
    `files = (\n${id(1)}, ${id(3)},\n\t\t\t\t504EC312`,
  );
  project = project.replace(
    /knownRegions = \([\s\S]*?\);/,
    `knownRegions = (Base, ${languages.join(',')},);`,
  );
}
project = project
  .replaceAll('MARKETING_VERSION = 1.0;', 'MARKETING_VERSION = 0.1.0;')
  .replaceAll('TARGETED_DEVICE_FAMILY = "1,2";', 'TARGETED_DEVICE_FAMILY = 1;');
await writeFile('ios/App/App.xcodeproj/project.pbxproj', project);

const svg = (await readFile('handball-stats-icon.svg')).toString('base64');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
async function png(path, width, height = width, iconSize = width) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(
    `<body style="margin:0;background:#000;display:grid;place-items:center;height:100vh"><img width="${iconSize}" height="${iconSize}" src="data:image/svg+xml;base64,${svg}"></body>`,
  );
  await page.locator('img').evaluate((element) => element.decode());
  await page.screenshot({ path, omitBackground: false });
  await page.close();
}
try {
  for (const [density, size, foreground] of [
    ['mdpi', 48, 108],
    ['hdpi', 72, 162],
    ['xhdpi', 96, 216],
    ['xxhdpi', 144, 324],
    ['xxxhdpi', 192, 432],
  ]) {
    const dir = `android/app/src/main/res/mipmap-${density}`;
    await mkdir(dir, { recursive: true });
    await png(`${dir}/ic_launcher.png`, size);
    await png(`${dir}/ic_launcher_round.png`, size);
    await png(
      `${dir}/ic_launcher_foreground.png`,
      foreground,
      foreground,
      Math.round(foreground * 0.72),
    );
  }
  await png('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024);
  const splash = 'ios/App/App/Assets.xcassets/Splash.imageset';
  for (const name of await readdir(splash))
    if (name.endsWith('.png')) await rm(`${splash}/${name}`);
  await png(`${splash}/splash.png`, 2732, 2732, 640);
  await writeFile(
    `${splash}/Contents.json`,
    JSON.stringify(
      {
        images: [{ filename: 'splash.png', idiom: 'universal' }],
        info: { author: 'xcode', version: 1 },
      },
      null,
      2,
    ),
  );
  await png('docs/stores/assets/icon-google-play-512.png', 512);
  await png('docs/stores/assets/icon-app-store-1024.png', 1024);
  await png('docs/stores/assets/feature-google-play-1024x500.png', 1024, 500, 400);
} finally {
  await browser.close();
}
// Replace stock Capacitor splash bitmaps with one small, density-independent layer list.
for (const dir of await readdir('android/app/src/main/res')) {
  if (dir.startsWith('drawable'))
    await rm(`android/app/src/main/res/${dir}/splash.png`, { force: true });
}
await writeFile(
  'android/app/src/main/res/drawable/splash.xml',
  '<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@android:color/black"/><item><bitmap android:src="@mipmap/ic_launcher" android:gravity="center"/></item></layer-list>',
);
console.log('Native icons, launch assets and seven microphone purpose strings generated.');
