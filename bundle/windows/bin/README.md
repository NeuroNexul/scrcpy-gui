# Bundled Windows binaries

Place the runtime dependencies here before packaging:

- `scrcpy.exe`
- `adb.exe`
- Any additional DLL files required by your scrcpy distribution

The installer script copies this entire folder to:

- `$INSTDIR\\bin` in installed app

The app runtime resolves binaries from:

- `<app-executable-dir>\\bin`
- `<workspace>\\bin`
- system `PATH`

For reproducible local builds, use `scripts/build-windows.ps1`.
