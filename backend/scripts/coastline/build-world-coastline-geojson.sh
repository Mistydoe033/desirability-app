#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATA_DIR="$ROOT_DIR/data"
mkdir -p "$DATA_DIR"

INPUT_ZIP="${1:-$DATA_DIR/coastline-world-4326.zip}"
WORK_DIR="${2:-$DATA_DIR/coastline-world-src}"
OUTPUT_GEOJSON="${3:-$DATA_DIR/coastline.geojson}"
SIMPLIFY_DEGREES="${COASTLINE_SIMPLIFY_DEGREES:-0.08}"

if [[ ! -f "$INPUT_ZIP" ]]; then
  echo "Missing input ZIP: $INPUT_ZIP" >&2
  exit 1
fi

if ! command -v unzip >/dev/null 2>&1; then
  echo "unzip is required." >&2
  exit 1
fi

if ! command -v ogr2ogr >/dev/null 2>&1; then
  echo "ogr2ogr is required (GDAL)." >&2
  echo "Example (Ubuntu): sudo apt-get install gdal-bin" >&2
  exit 1
fi

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
unzip -q -o "$INPUT_ZIP" -d "$WORK_DIR"

# Find a coastline line shapefile; fallback to first .shp
SHP_PATH="$(find "$WORK_DIR" -type f \( -name '*coastline*.shp' -o -name '*lines*.shp' \) | head -n 1 || true)"
if [[ -z "$SHP_PATH" ]]; then
  SHP_PATH="$(find "$WORK_DIR" -type f -name '*.shp' | head -n 1 || true)"
fi

if [[ -z "$SHP_PATH" ]]; then
  echo "No .shp file found in archive: $INPUT_ZIP" >&2
  exit 1
fi

ogr2ogr \
  -f GeoJSON \
  -t_srs EPSG:4326 \
  -lco RFC7946=YES \
  -nlt LINESTRING \
  -simplify "$SIMPLIFY_DEGREES" \
  "$OUTPUT_GEOJSON" \
  "$SHP_PATH"

echo "Generated global coastline GeoJSON: $OUTPUT_GEOJSON"
echo "Simplification tolerance (degrees): $SIMPLIFY_DEGREES"
