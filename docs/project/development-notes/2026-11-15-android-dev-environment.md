# Session note - Android development environment (15/11/2026)

**Date:** 15/11/2026  
**Status:** ✅ Done (local Windows machine)  
**Related:** [`2026-11-07-google-native-signin.md`](2026-11-07-google-native-signin.md) (why a development build is mandatory and the superseded MAX_PATH recipe)

## Summary

The Android emulator was showing a very old version of the app and
`npm run android` (`expo run:android`) failed. Both symptoms came from the local
toolchain, not from the repository: Gradle was running on a JRE 8 and the ninja
shipped with the Android SDK CMake cannot create paths longer than 260
characters. The JVM was pointed at the Android Studio JBR, ninja was replaced
with a `longPathAware` build, and the emulator now runs a debug development
build served by Metro.

No application source, test, rule or configuration file changed. The project
stays at `E:\DocumentosYMas\Proyectos\Programacion\MisGastos` (user decision); a
shorter path remains the documented fallback.

## Environment

| Component | Version | Path |
|---|---|---|
| Project | — | `E:\DocumentosYMas\Proyectos\Programacion\MisGastos` |
| JDK (`JAVA_HOME`) | OpenJDK 21.0.6 (JBR bundled with Android Studio) | `C:\Program Files\Android\Android Studio\jbr` |
| Gradle wrapper | 9.4.1 (`android/gradle/wrapper/gradle-wrapper.properties`) | — |
| Android SDK CMake | 3.22.1 | `C:\Users\Sakro\AppData\Local\Android\Sdk\cmake\3.22.1` |
| ninja | 1.13.2 (replaces 1.10.2) | `C:\Users\Sakro\AppData\Local\Android\Sdk\cmake\3.22.1\bin\ninja.exe` |
| Emulator | `emulator-5554` | — |
| Native graph | `react-native-worklets` 0.13.0, `react-native-reanimated` 4.7.1, new architecture | `node_modules` |

## Problem 1 - Gradle runs on JVM 8

**Symptom.** `npm run android` aborted with:

```text
Gradle requires JVM 17 or later to run. Your build is currently configured to use JVM 8.
```

**Cause.** `JAVA_HOME` was not defined, so `java` resolved through the `PATH` to
the Oracle JRE 1.8.0_401 shim
(`C:\Program Files (x86)\Common Files\Oracle\Java\javapath\java.exe`). The
wrapper uses Gradle 9.4.1, which requires JVM 17 or later.

**Fix.** Point the user variable at the JBR that ships with Android Studio; no
new JDK was installed:

```powershell
[Environment]::SetEnvironmentVariable('JAVA_HOME','C:\Program Files\Android\Android Studio\jbr','User')
```

`JAVA_HOME` is inherited only by terminals opened after the change. Verify in a
new terminal:

```powershell
$env:JAVA_HOME                       # C:\Program Files\Android\Android Studio\jbr
java -version                        # openjdk version "21.0.6"
```

## Problem 2 - Windows long paths in the C++ build

**Symptom.** After the JDK fix the native build failed with:

```text
ninja: error: mkdir(CMakeFiles/worklets.dir/E_/DocumentosYMas/Proyectos/Programacion/MisGastos/node_modules/react-native-worklets/Common/cpp/worklets/Networking): No such file or directory
```

**Cause.** `react-native-worklets` generates absolute object paths for CMake that
reach 275 characters with this workspace. Registry
`LongPathsEnabled=1` is not enough: the ninja 1.10.2 bundled with CMake 3.22.1
is not compiled with the `longPathAware` manifest (checked by reading the
binary), so it still stops at `MAX_PATH` (260).

**Fix.** Replace that `ninja.exe` with ninja **1.13.2** (official `ninja-win.zip`
release from GitHub), which is `longPathAware`:

```powershell
$bin  = 'C:\Users\Sakro\AppData\Local\Android\Sdk\cmake\3.22.1\bin'
Copy-Item "$bin\ninja.exe" "$bin\ninja-1.10.2.bak.exe"
Copy-Item .\ninja.exe "$bin\ninja.exe"      # extracted from ninja-win.zip 1.13.2
& "$bin\ninja.exe" --version                # 1.13.2
```

**Revert.** Rename the backup back over the replaced binary.

## Problem 3 - The emulator showed an old build

**Symptom.** Metro served the current code but the app on `emulator-5554` looked
"years behind" the repository, with no hot reload.

**Cause.** The installed app was a **release/standalone build from 07/11** with
the JS bundle embedded in the APK. Evidence from `adb shell dumpsys package
com.misgastos.app`: no `DEBUGGABLE` flag, `installerPackageName=null` and no
`adb reverse` mapping. Metro could not be consumed by that build, so the APK
kept rendering its old bundled JavaScript.

**Fix.** Build and install the debug development build (mandatory here because
`@react-native-google-signin/google-signin` is a native module, so Expo Go does
not work):

```powershell
cd android
.\gradlew.bat app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=x86_64
cd ..
adb install -r android\app\build\outputs\apk\debug\app-debug.apk   # install over the old build keeps data and the Firebase session
adb reverse tcp:8081 tcp:8081
npm start                                                          # Metro on 8081, then open the app
```

## Discarded alternatives

| Alternative | Why it was rejected |
|---|---|
| Directory junction `C:\Users\Sakro\mg` → project | Gradle and Node resolve the real path (`realpath`) back to `E:\...`, so the long paths stay. It also produced mixed-drive paths (`C:\Users\Sakro\mg\E:\...`) and Kotlin warnings about not being able to close incremental caches |
| `subst X:` to the project root | `expo-modules-autolinking` fails with `Couldn't find "package.json" up from path "X:\android"` because its upward search does not check the drive root; it also saved only 9 characters |
| `LongPathsEnabled=1` alone | The manifest of ninja 1.10.2 decides, not the registry |
| Gradle `buildStagingDirectory` recipe (07/11 note) | Superseded: it needed a short project root, which the project no longer uses |

## Daily workflow

| Change | Action |
|---|---|
| JS/TS, styles, copy | With Metro running: reload with `r` or rely on hot reload |
| Metro stopped | `npm start`, then press `a` |
| Native changes (native dependency, `app.json`/plugins, `android/`) | `npm run android` |
| Metro serving a suspicious cache | `npx expo start -c` |

Only one Metro session can own port 8081 at a time.

## Risks and maintenance

- Updating or repairing the SDK (`sdkmanager`, Android Studio) can overwrite
  `ninja.exe` and reintroduce the `mkdir` error. Repeat the replacement, or move
  the project to a shorter path.
- Terminals opened before the `JAVA_HOME` change keep the old JRE 8; reopen them.
- `JAVA_HOME` is a user-wide variable: every JVM started by the user now defaults
  to JDK 21, which is fine for Android Studio and Gradle.
- `android/` is local and gitignored, so both workarounds stay on this machine;
  CI/EAS Build and macOS/Linux need neither.

## Verification

- `npm run android` no longer fails: the debug APK compiles and installs on the
  emulator.
- The installed app reports the `DEBUGGABLE` flag, `lastUpdateTime = 2026-11-15 22:42`
  and is served by Metro: `Android Bundled 48372ms ... (2290 modules)`.
- The app shows the current Home, the **Amigos** tab and Settings.
- Observed on this machine: the first Metro start took ~3 minutes and the first
  bundle ~48 s.

## Known pre-existing warnings

Metro logs `SafeAreaView` and `ImageBackground` deprecation warnings. They
predate this note and were not touched.
