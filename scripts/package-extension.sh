#!/usr/bin/env bash
# Creates a clean ZIP for Chrome Web Store submission / manual distribution.
set -euo pipefail

cd "$(dirname "$0")/.."

EXTENSION_NAME="pdf-page-exporter"
VERSION=$(node -p "require('./manifest.json').version")
OUTPUT="${EXTENSION_NAME}-v${VERSION}.zip"

rm -f "$OUTPUT"

# Allowlist: only runtime files can ever reach the store package. A denylist
# let tool scratch directories (e.g. .playwright-mcp/) ship to users.
zip -r "$OUTPUT" \
  manifest.json \
  icons/icon-16.png icons/icon-48.png icons/icon-128.png \
  assets \
  src

echo "Packaged: $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
