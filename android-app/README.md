# Sudoku APP Android

WebView wrapper nativo en Kotlin para Android 8 o superior.

## Configuracion

- Package: `com.tiendapc.app`
- Nombre visible: `Sudoku APP`
- URL inicial: `https://www.sudokumerlo.com/admin`
- minSdk: `26`
- targetSdk: `35`

## Toolchain

El proyecto espera herramientas portables en:

- `../.tools/jdk17`
- `../.tools/gradle`
- `../.tools/android-sdk`

`local.properties` apunta a `../.tools/android-sdk`.

## Compilar APK debug

Desde `android-app/`:

```powershell
$env:JAVA_HOME = (Resolve-Path ..\.tools\jdk17).Path
$env:Path = "$env:JAVA_HOME\bin;$((Resolve-Path ..\.tools\gradle\bin).Path);$env:Path"
gradle clean assembleDebug
```

APK generado:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Validar metadata

```powershell
..\.tools\android-sdk\build-tools\35.0.0\aapt.exe dump badging app\build\outputs\apk\debug\app-debug.apk
```
