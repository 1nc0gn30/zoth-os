---
title: "ZothNet Sovereign Mesh (Android)"
package_id: "tech.nullai.zothnet"
prod_package_id: "tech.nullai.zothnet"
version_code: 12
version_name: "1.2.0"
min_sdk: 26
target_sdk: 34
compile_sdk: 34
build_system: "Go PIE .so + AAPT2/D8"
fdroid_official: "READY"
fdroid_sovereign: "READY"
play_store: "DECLARATION"
github: "https://github.com/1nc0gn30/zothnet"
apk_path: "~/NullAITech/zothnet/bin/zothnet-arm64.apk"
tags: [android-apk, mobile, zothnet, fdroid, play-store]
---

# 📱 ZothNet Sovereign Mesh (`tech.nullai.zothnet`)

- **Source**: `~/NullAITech/zothnet-android` & `~/NullAITech/zothnet`
- **APK Binary**: `~/NullAITech/zothnet/bin/zothnet-arm64.apk` (`9.1 MB`, SHA-256: `8c40ec11d54f096c233313b139362117e4cd1715084d75d6279c3bb1452e5818`)
- **Live Download**: `https://zothnet.nullai.tech/downloads/zothnet-arm64.apk`
- **Release Checklist**:
  1. Add `android:versionCode="12" android:versionName="1.2.0"` to `AndroidManifest.xml`.
  2. Remove duplicate `assets/zothnet-arm64` copy in `package_apk.sh` (keeps `lib/arm64-v8a/libzothnet.so`, reducing APK to `4.5 MB`).
  3. Sign with `~/.zoth-signing/zothnet-release.jks`.
  4. Submit `tech.nullai.zothnet.yml` to Official F-Droid (`fdroiddata`) and record 30s `FOREGROUND_SERVICE_SPECIAL_USE` walkthrough video for Google Play.

See [[06-Wiki/Zoth Mobile Arsenal — Android APKs, F-Droid & Play Store Roadmap]] and [[Zoth Android APKs & Mobile Store Roadmap.base]].
