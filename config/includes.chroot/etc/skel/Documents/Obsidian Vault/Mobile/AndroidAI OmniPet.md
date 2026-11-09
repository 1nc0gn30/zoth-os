---
title: "AndroidAI / OmniPet"
package_id: "com.aistudio.omnipet.qrvwxz"
prod_package_id: "tech.nullai.androidai"
version_code: 1
version_name: "1.0"
min_sdk: 24
target_sdk: 36
compile_sdk: 36
build_system: "Gradle + Jetpack Compose + KSP"
fdroid_official: "CUSTOM"
fdroid_sovereign: "READY"
play_store: "DECLARATION"
github: "https://github.com/1nc0gn30/AndroidAI"
apk_path: "https://github.com/1nc0gn30/AndroidAI"
tags: [android-apk, mobile, androidai, omnipet, fdroid, play-store]
---

# 📱 AndroidAI / OmniPet (`tech.nullai.androidai`)

- **Source**: `https://github.com/1nc0gn30/AndroidAI`
- **Release Checklist**:
  1. Rename `applicationId` from `com.aistudio.omnipet.qrvwxz` to `tech.nullai.androidai`.
  2. For **Official F-Droid**, replace `firebase-ai` / `firebase-appcheck` with direct OkHttp/Retrofit calls to local Ollama / OpenAI-compatible endpoints.
  3. For **Google Play Store**, submit `FOREGROUND_SERVICE_SPECIAL_USE` (`OverlayPetService`) walkthrough video.

See [[06-Wiki/Zoth Mobile Arsenal — Android APKs, F-Droid & Play Store Roadmap]] and [[Zoth Android APKs & Mobile Store Roadmap.base]].
