#!/bin/bash

# Download profile frame video from Figma
# The profile frame is actually a video file that needs to be properly extracted

set -e

ASSETS_DIR="apps/web/public/dashboard-assets"
mkdir -p "$ASSETS_DIR"

echo "🎬 Downloading profile frame video..."

# The ComfyUI frame is a video - we need to download it as MP4 or WebM
# Figma file: I8P5ECz7pOA4aBa4sxOBEM, Node: 188-7281

# Try downloading as video format
VIDEO_URL="https://www.figma.com/api/mcp/asset/91a3c9bc-8beb-4391-8015-88a5ddd51fb9"

echo "Attempting to download from: $VIDEO_URL"

# Try different extensions
for ext in mp4 webm mov; do
  echo "Trying .$ext..."
  curl -Lk "$VIDEO_URL" \
    -H "User-Agent: Mozilla/5.0" \
    --output "$ASSETS_DIR/profile-frame.$ext" 2>/dev/null || true
  
  # Check if it's actually a video
  file_type=$(file "$ASSETS_DIR/profile-frame.$ext" | grep -i video || echo "not video")
  if [[ "$file_type" != "not video" ]]; then
    echo "✅ Successfully downloaded as .$ext"
    ls -lh "$ASSETS_DIR/profile-frame.$ext"
    exit 0
  else
    echo "❌ Not a video file, trying next format..."
    rm -f "$ASSETS_DIR/profile-frame.$ext"
  fi
done

# If video download failed, download as PNG and note that we need the actual video
echo "⚠️  Figma API exported as PNG, not video. Downloading PNG for now..."
curl -Lk "$VIDEO_URL" \
  -H "User-Agent: Mozilla/5.0" \
  --output "$ASSETS_DIR/profile-frame.png"

echo "✅ Downloaded profile frame as PNG"
echo "📝 NOTE: The original is a video in Figma. You may need to export it manually:"
echo "   1. Open Figma file: https://www.figma.com/design/I8P5ECz7pOA4aBa4sxOBEM/"
echo "   2. Select the ComfyUI_0055 2 layer (node 188-7281)"
echo "   3. Export as MP4 or WebM"
echo "   4. Save to apps/web/public/dashboard-assets/profile-frame.mp4"

ls -lh "$ASSETS_DIR/profile-frame.png"

