#!/usr/bin/env bash
# Creates a clean ZIP for Chrome Web Store submission / manual distribution.
set -euo pipefail

cd "$(dirname "$0")/.."

EXTENSION_NAME="pdf-page-exporter"
VERSION=$(node -p "require('./manifest.json').version")
OUTPUT="${EXTENSION_NAME}-v${VERSION}.zip"

rm -f "$OUTPUT"

zip -r "$OUTPUT" . \
  -x ".git/*" \
  -x ".github/*" \
  -x ".agents/*" \
  -x ".claude/*" \
  -x "node_modules/*" \
  -x ".env" \
  -x "*.map" \
  -x "test/*" \
  -x "docs/*" \
  -x "store-assets/*" \
  -x "scripts/*" \
  -x "icons/icon.svg" \
  -x "PLAN.md" \
  -x "CHROMEWEBSTORE.md" \
  -x "README.md" \
  -x ".gitignore" \
  -x ".mcp.json" \
  -x "CLAUDE.md" \
  -x "skills-lock.json" \
  -x ".DS_Store" \
  -x "Thumbs.db"

echo "Packaged: $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
