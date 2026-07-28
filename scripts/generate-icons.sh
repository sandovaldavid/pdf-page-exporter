#!/usr/bin/env bash
# Rasterizes icons/icon.svg into the exact PNG sizes Chrome requires.
# Requires ImageMagick (magick or convert) on PATH.
set -euo pipefail

cd "$(dirname "$0")/.."

SRC="icons/icon.svg"
SIZES=(16 48 128)

if command -v magick >/dev/null 2>&1; then
  RASTERIZE="magick"
elif command -v convert >/dev/null 2>&1; then
  RASTERIZE="convert"
else
  echo "error: ImageMagick (magick/convert) not found on PATH" >&2
  exit 1
fi

for SIZE in "${SIZES[@]}"; do
  OUT="icons/icon-${SIZE}.png"
  "$RASTERIZE" -background none "$SRC" -resize "${SIZE}x${SIZE}" "$OUT"
  echo "Created ${OUT} (${SIZE}x${SIZE})"
done
