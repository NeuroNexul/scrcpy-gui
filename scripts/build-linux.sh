#!/usr/bin/env bash

set -euo pipefail

PLATFORM="linux/amd64"
BUILD_TAGS=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --platform)
            if [[ $# -lt 2 ]]; then
                echo "Missing value for --platform" >&2
                exit 1
            fi
            PLATFORM="$2"
            shift 2
            ;;
        --tags)
            if [[ $# -lt 2 ]]; then
                echo "Missing value for --tags" >&2
                exit 1
            fi
            BUILD_TAGS="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1" >&2
            echo "Usage: ./scripts/build-linux.sh [--platform linux/amd64] [--tags webkit2_41]" >&2
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_DIR="$PROJECT_ROOT/bundle/linux/bin"
OUT_DIR="$PROJECT_ROOT/build/bin"
OUT_BUNDLE_DIR="$OUT_DIR/bin"

SCRCPY_PATH="$BUNDLE_DIR/scrcpy"
ADB_PATH="$BUNDLE_DIR/adb"

if [[ ! -f "$SCRCPY_PATH" ]]; then
    echo "Missing bundled binary: $SCRCPY_PATH" >&2
    exit 1
fi

if [[ ! -f "$ADB_PATH" ]]; then
    echo "Missing bundled binary: $ADB_PATH" >&2
    exit 1
fi

pushd "$PROJECT_ROOT" > /dev/null
trap 'popd > /dev/null' EXIT

buildArgs=(build --platform "$PLATFORM")
if [[ -n "$BUILD_TAGS" ]]; then
    buildArgs+=(-tags "$BUILD_TAGS")
fi

wails "${buildArgs[@]}"

mkdir -p "$OUT_BUNDLE_DIR"
cp -a "$BUNDLE_DIR/." "$OUT_BUNDLE_DIR/"

echo "Copied bundled binaries to: $OUT_BUNDLE_DIR"
echo "Build completed successfully."
