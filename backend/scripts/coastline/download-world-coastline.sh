#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATA_DIR="$ROOT_DIR/data"
mkdir -p "$DATA_DIR"

# Global OSM coastline split in EPSG:4326
DEFAULT_URL="https://osmdata.openstreetmap.de/download/coastlines-split-4326.zip"
SOURCE_URL="${WORLD_COASTLINE_URL:-$DEFAULT_URL}"
OUTPUT_PATH="${1:-$DATA_DIR/coastline-world-4326.zip}"

if command -v curl >/dev/null 2>&1; then
  curl -fL "$SOURCE_URL" -o "$OUTPUT_PATH"
elif command -v wget >/dev/null 2>&1; then
  wget -O "$OUTPUT_PATH" "$SOURCE_URL"
else
  echo "Neither curl nor wget is installed." >&2
  exit 1
fi

echo "Downloaded global coastline archive to: $OUTPUT_PATH"
