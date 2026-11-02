#!/bin/sh
# Restores Next's native compiler if macOS Gatekeeper moved it to the Trash, then clears the
# quarantine flag so it loads. Same version as the lockfile (16.4.3).
set -e
DEST="$(cd "$(dirname "$0")/../../.." && pwd)/node_modules/.pnpm/@next+swc-darwin-arm64@16.4.3/node_modules/@next/swc-darwin-arm64"
if [ ! -s "$DEST/next-swc.darwin-arm64.node" ]; then
  TMP="$(mktemp -d)"
  echo "Downloading @next/swc-darwin-arm64@16.4.3…"
  curl -fL --retry 3 https://registry.npmjs.org/@next/swc-darwin-arm64/-/swc-darwin-arm64-16.4.3.tgz | tar xz -C "$TMP"
  cp "$TMP/package/next-swc.darwin-arm64.node" "$DEST/"
  rm -rf "$TMP"
fi
xattr -d com.apple.quarantine "$DEST/next-swc.darwin-arm64.node" 2>/dev/null || true
echo "SWC binary ready: $(ls -lh "$DEST/next-swc.darwin-arm64.node" | awk '{print $5}')"
