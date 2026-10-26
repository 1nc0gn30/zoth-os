plugins {
    id("com.android.application")
}

android {
    namespace = "com.nealfrazier.zothbot"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.nealfrazier.zothbot"
        minSdk = 30
        targetSdk = 34
        versionCode = 10
        versionName = "0.9.1"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
