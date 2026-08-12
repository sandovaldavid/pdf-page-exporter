#!/usr/bin/env bash
# End-to-end test for the unpacked extension in a real Chromium.
#
#   ./test/run.sh
#
# Requires: playwright-cli (npm i -g @playwright/cli) and a display.
# Optional: poppler-utils + ImageMagick, used to verify the exported PDFs
# independently of the extension's own code. Without them the PDF assertions
# are reported as SKIPPED rather than silently passing.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK=/tmp/dpu-e2e
SESSION=dpu-e2e

if ! command -v playwright-cli >/dev/null 2>&1; then
  echo "error: playwright-cli not found. Install with: npm i -g @playwright/cli" >&2
  exit 1
fi

rm -rf "$WORK"
mkdir -p "$WORK"
cp "$REPO/test/fixture/viewer.html" "$WORK/viewer.html"

cat > "$WORK/cli.config.json" <<EOF
{
  "browser": {
    "browserName": "chromium",
    "isolated": false,
    "userDataDir": "$WORK/profile",
    "launchOptions": {
      "headless": false,
      "args": [
        "--disable-extensions-except=$REPO",
        "--load-extension=$REPO"
      ]
    }
  },
  "outputDir": "$WORK/out"
}
EOF

cleanup() { playwright-cli -s="$SESSION" close >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "== launching Chromium with the unpacked extension =="
playwright-cli -s="$SESSION" --config="$WORK/cli.config.json" open about:blank >/dev/null

echo "== running browser checks (this takes a couple of minutes) =="
playwright-cli -s="$SESSION" run-code --filename="$REPO/test/e2e.js" > "$WORK/raw.txt" 2>&1 || true

# The CLI prints "### Result" followed by the returned JSON.
RESULT="$(sed -n '/^### Result/{n;p;q;}' "$WORK/raw.txt" || true)"
if [ -z "$RESULT" ]; then
  echo "FAILED: the browser script did not return a result." >&2
  sed -n '/^### Error/,+6p' "$WORK/raw.txt" >&2
  exit 1
fi

FAILURES=0
printf '%s' "$RESULT" | node -e '
  let raw = ""; process.stdin.on("data", d => raw += d).on("end", () => {
    const { checks, failed } = JSON.parse(raw);
    for (const c of checks) {
      console.log(`${c.ok ? "  ok  " : "  FAIL"}  ${c.name}${c.ok || !c.detail ? "" : "\n        " + c.detail}`);
    }
    console.log(`\n  ${checks.length - failed}/${checks.length} browser checks passed`);
    process.exit(failed ? 1 : 0);
  });
' || FAILURES=1

echo
echo "== verifying the exported PDFs outside the extension =="
if ! command -v pdfinfo >/dev/null 2>&1 || ! command -v pdftoppm >/dev/null 2>&1 || ! command -v magick >/dev/null 2>&1; then
  echo "  SKIPPED  poppler-utils and/or ImageMagick not installed"
else
  pages() { pdfinfo "$1" | awk '/^Pages:/ {print $2}'; }

  if [ "$(pages "$WORK/main20.pdf")" = "20" ] &&
     pdfinfo "$WORK/main20.pdf" | grep -q "800 x 1035 pts"; then
    echo "  ok    main20.pdf has 20 pages at 800x1035 pt (1px -> 1pt)"
  else
    echo "  FAIL  main20.pdf: $(pdfinfo "$WORK/main20.pdf" | grep -E '^Pages|^Page size')"
    FAILURES=1
  fi

  if [ "$(pages "$WORK/wrongcount.pdf")" = "9" ]; then
    echo "  ok    wrongcount.pdf has all 9 pages despite the toolbar claiming 5"
  else
    echo "  FAIL  wrongcount.pdf has $(pages "$WORK/wrongcount.pdf") pages, expected 9"
    FAILURES=1
  fi

  # The fixture paints page i with red = i*8, so page order can be decoded from
  # the PDF itself — this is what catches blank, duplicated or reordered pages.
  # A blank page decodes far outside the expected range rather than matching.
  decode_order() {
    local pdf="$1" label="$2" prefix="$WORK/$2"
    pdftoppm -r 12 -png "$pdf" "$prefix"
    local ok=1
    for f in "$prefix"-*.png; do
      local n r d
      n=$(basename "$f" .png | sed "s/^$label-0*//")
      r=$(magick "$f" -format "%[fx:round(p{4,4}.r*255)]" info:)
      d=$(( (r + 4) / 8 ))
      if [ "$d" != "$n" ]; then
        echo "  FAIL  $label: PDF page $n carries the payload of page $d (red=$r)"
        ok=0; FAILURES=1
      fi
    done
    [ "$ok" = 1 ] && echo "  ok    $label pages decode in order: none blank, duplicated or swapped"
  }

  decode_order "$WORK/main20.pdf" main20

  if [ "$(pages "$WORK/evicted20.pdf")" = "20" ]; then
    echo "  ok    evicted20.pdf has 20 pages despite the viewer unmounting them"
  else
    echo "  FAIL  evicted20.pdf has $(pages "$WORK/evicted20.pdf") pages, expected 20"
    FAILURES=1
  fi
  decode_order "$WORK/evicted20.pdf" evicted20
fi

echo
if [ "$FAILURES" = 0 ]; then echo "ALL CHECKS PASSED"; else echo "THERE WERE FAILURES"; fi
exit "$FAILURES"
