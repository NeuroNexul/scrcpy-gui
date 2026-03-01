# scrcpy-gui

Windows-first Wails desktop GUI for scrcpy.

## Bundled dependencies (required)

This app is configured to ship scrcpy and adb with the installer/app output.

Place these files in [bundle/windows/bin/README.md](bundle/windows/bin/README.md):

- `scrcpy.exe`
- `adb.exe`
- required DLLs from your scrcpy distribution

At runtime, the backend resolves executables from `bin` near the app executable first, then from PATH.

## Live development

Run `wails dev`.

## Build (with bundled binaries)

Use the PowerShell build script so bundled binaries are always copied to the output:

- Standard build: `./scripts/build-windows.ps1`
- NSIS installer build: `./scripts/build-windows.ps1 -NSIS`

The NSIS installer also copies `bundle/windows/bin/*` into `$INSTDIR\\bin` during installation.
