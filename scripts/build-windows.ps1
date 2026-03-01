param(
    [switch]$NSIS,
    [string]$Platform = "windows/amd64"
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$bundleDir = Join-Path $projectRoot "bundle\windows\bin"
$outDir = Join-Path $projectRoot "build\bin"
$outBundleDir = Join-Path $outDir "bin"

$scrcpyPath = Join-Path $bundleDir "scrcpy.exe"
$adbPath = Join-Path $bundleDir "adb.exe"

if (-not (Test-Path $scrcpyPath)) {
    throw "Missing bundled binary: $scrcpyPath"
}

if (-not (Test-Path $adbPath)) {
    throw "Missing bundled binary: $adbPath"
}

Push-Location $projectRoot
try {
    $buildArgs = @("build", "--platform", $Platform)
    if ($NSIS) {
        $buildArgs += "--nsis"
    }

    & wails @buildArgs
    if ($LASTEXITCODE -ne 0) {
        throw "wails build failed"
    }

    New-Item -ItemType Directory -Force -Path $outBundleDir | Out-Null
    Copy-Item -Path (Join-Path $bundleDir "*") -Destination $outBundleDir -Recurse -Force

    Write-Host "Copied bundled binaries to: $outBundleDir"
    Write-Host "Build completed successfully."
}
finally {
    Pop-Location
}
