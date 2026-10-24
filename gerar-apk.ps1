# Automated Script to Build the Android APK for PvZ: Evolution
$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   PvZ: Evolution - Android APK Builder             " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Building TypeScript/Vite bundle and syncing Capacitor Android..." -ForegroundColor Yellow
npm run build
try {
    npx cap sync android
} catch {
    Write-Host "Retry sync..." -ForegroundColor Yellow
    npx cap sync android
}

$DefaultSdk = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_HOME = $DefaultSdk
$SdkEscaped = $DefaultSdk.Replace('\', '\\')
Set-Content -Path (Join-Path $PSScriptRoot "android\local.properties") -Value "sdk.dir=$SdkEscaped"

# Build in LocalAppData temp folder to bypass Windows OneDrive reparse-point IOException in Gradle
$TempBuildDir = "$env:LOCALAPPDATA\Temp\pvz-android-build"
Write-Host "`n[2/3] Staging Android project in local fast workspace ($TempBuildDir)..." -ForegroundColor Yellow
if (Test-Path $TempBuildDir) {
    Remove-Item $TempBuildDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $TempBuildDir | Out-Null

# Copy package.json, node_modules/@capacitor, and android folder cleanly without OneDrive reparse tags
robocopy (Join-Path $PSScriptRoot "node_modules\@capacitor") "$TempBuildDir\node_modules\@capacitor" /E /NFL /NDL /NJH /NJS | Out-Null
robocopy (Join-Path $PSScriptRoot "android") "$TempBuildDir\android" /E /XD build .gradle /NFL /NDL /NJH /NJS | Out-Null

Write-Host "`n[3/3] Compiling APK via Gradle (assembleDebug --no-daemon)..." -ForegroundColor Yellow
Push-Location "$TempBuildDir\android"
.\gradlew.bat assembleDebug --no-daemon
Pop-Location

$ApkSource = "$TempBuildDir\android\app\build\outputs\apk\debug\app-debug.apk"
$ApkDest = Join-Path $PSScriptRoot "PvZ-Evolution-Android.apk"

if (Test-Path $ApkSource) {
    Copy-Item $ApkSource $ApkDest -Force
    Write-Host "`n[SUCCESS] APK generated and ready to install on your phone:" -ForegroundColor Green
    Write-Host $ApkDest -ForegroundColor Cyan
}
