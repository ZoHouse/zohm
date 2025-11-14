#!/bin/bash
# Download all dashboard assets from Figma
# Assets will expire in 7 days from generation

ASSETS_DIR="/Users/samuraizan/zohm/apps/web/public/dashboard-assets"
mkdir -p "$ASSETS_DIR"

echo "📥 Downloading dashboard assets from Figma..."

# Culture icons
curl -o "$ASSETS_DIR/culture-design.png" "https://www.figma.com/api/mcp/asset/54db983d-1f95-4f08-9f66-a79e8e1aa3f1"
curl -o "$ASSETS_DIR/culture-science-tech.png" "https://www.figma.com/api/mcp/asset/7eb19cc5-c12f-4a50-83ca-1e028b9ac543"
curl -o "$ASSETS_DIR/culture-food.png" "https://www.figma.com/api/mcp/asset/7fdc78d5-0d78-433f-893c-29d00f4a8fa8"

# Background
curl -o "$ASSETS_DIR/dashboard-bg.jpg" "https://www.figma.com/api/mcp/asset/5d8ea878-e2b9-4031-86bf-77a977624bec"

# Zo logo
curl -o "$ASSETS_DIR/zo-world-icon.png" "https://www.figma.com/api/mcp/asset/38164602-3a49-4111-bf3c-c61740f1ca39"

# Avatar/Profile images
curl -o "$ASSETS_DIR/avatar.png" "https://www.figma.com/api/mcp/asset/b396f98f-fd42-4e3b-8501-92b6f310f27c"
curl -o "$ASSETS_DIR/profile-main.jpg" "https://www.figma.com/api/mcp/asset/9f200166-356c-43f2-8ac3-e3f4fc0f6304"

# Coin images
curl -o "$ASSETS_DIR/coin-gradient-1.png" "https://www.figma.com/api/mcp/asset/7574d78a-524d-44d9-9610-d8808729cb23"
curl -o "$ASSETS_DIR/coin-gradient-2.png" "https://www.figma.com/api/mcp/asset/38a0273b-b59a-4a2a-ab53-aa9ebdf49392"
curl -o "$ASSETS_DIR/coin-gradient-3.png" "https://www.figma.com/api/mcp/asset/05454f6a-1b80-4147-a325-fef490d9dcef"

# Main Quest image
curl -o "$ASSETS_DIR/main-quest-wallapp.jpg" "https://www.figma.com/api/mcp/asset/a5f07c01-8a68-4847-862f-0be1dffb9d1d"

# NFT images
curl -o "$ASSETS_DIR/nft-base.png" "https://www.figma.com/api/mcp/asset/3287ad85-183c-48de-b716-2ace224861db"
curl -o "$ASSETS_DIR/nft-overlay-red.png" "https://www.figma.com/api/mcp/asset/0adf80e3-b746-4e36-9456-bc81b866b2a3"
curl -o "$ASSETS_DIR/nft-overlay-green.png" "https://www.figma.com/api/mcp/asset/767a3ddd-d29f-46f5-8b5e-363c0d1694f1"
curl -o "$ASSETS_DIR/nft-overlay-blue.png" "https://www.figma.com/api/mcp/asset/c154cfad-7c75-4ed0-8c54-02f8365fb670"

# Zo House images
curl -o "$ASSETS_DIR/zo-house-sf.jpg" "https://www.figma.com/api/mcp/asset/f4df9d8e-ec35-4cdc-a207-c3ef7ced0f45"
curl -o "$ASSETS_DIR/zo-house-blr.jpg" "https://www.figma.com/api/mcp/asset/4d865d48-2987-40b0-9b15-694c13b509c9"
curl -o "$ASSETS_DIR/zo-house-blr-overlay.png" "https://www.figma.com/api/mcp/asset/5f121405-1150-4e5b-98a8-21c46ba01bbf"

# Map 3D view
curl -o "$ASSETS_DIR/map-3d-main.jpg" "https://www.figma.com/api/mcp/asset/3cec9b86-d2f2-4da4-9441-8cbd7b6f5cc6"
curl -o "$ASSETS_DIR/map-marker.png" "https://www.figma.com/api/mcp/asset/09980dc1-218f-4b08-ba81-3064d16931c2"
curl -o "$ASSETS_DIR/zo-logo-badge.png" "https://www.figma.com/api/mcp/asset/60bdbecf-6825-405f-ba2f-39dc22b47c6c"

# ZO NODE and CARD graphics
curl -o "$ASSETS_DIR/zo-node-graphic-1.png" "https://www.figma.com/api/mcp/asset/c50f91e5-ded3-4a7d-88ba-f404c982c76a"
curl -o "$ASSETS_DIR/zo-node-graphic-2.png" "https://www.figma.com/api/mcp/asset/17b3a0c4-ef43-4b1e-88d5-94c52b5d601c"

# Virtual Rooms
curl -o "$ASSETS_DIR/room-schelling-point.jpg" "https://www.figma.com/api/mcp/asset/69c03f6c-687e-48a9-8d07-8d8cf988074e"
curl -o "$ASSETS_DIR/room-degen-lounge.jpg" "https://www.figma.com/api/mcp/asset/f6b9f921-9c81-4a7c-98fb-f7eae98489cf"

# Communities
curl -o "$ASSETS_DIR/community-demo-day.jpg" "https://www.figma.com/api/mcp/asset/ed9c55ad-ed68-47e5-a9c4-d17f3d171238"
curl -o "$ASSETS_DIR/community-zo-collective-1.png" "https://www.figma.com/api/mcp/asset/62bf0437-06d4-471d-9f9b-e4928329d04a"
curl -o "$ASSETS_DIR/community-zo-collective-2.png" "https://www.figma.com/api/mcp/asset/0f229334-db3c-46c0-9266-a99320a49583"

# Event images
curl -o "$ASSETS_DIR/event-placeholder.jpg" "https://www.figma.com/api/mcp/asset/b66e3863-d56b-424d-a856-fde0ff898d2e"

# Icons and UI elements
curl -o "$ASSETS_DIR/icon-wallet.svg" "https://www.figma.com/api/mcp/asset/cc1c46fb-4909-4107-8c71-754696dc3f50"
curl -o "$ASSETS_DIR/icon-x-twitter.svg" "https://www.figma.com/api/mcp/asset/169d9a7a-deb2-4b97-87e4-287899cdfa48"
curl -o "$ASSETS_DIR/icon-discord.png" "https://www.figma.com/api/mcp/asset/22d7f655-a661-4028-8a74-333ebb3cf4f7"
curl -o "$ASSETS_DIR/dots-indicator.svg" "https://www.figma.com/api/mcp/asset/e0df5da8-ab55-4c51-9225-6ed81f92c88f"

# Profile avatars for chat
curl -o "$ASSETS_DIR/chat-avatar-1.jpg" "https://www.figma.com/api/mcp/asset/17c4ea02-4ea8-4ce0-b508-5d035c3606f2"
curl -o "$ASSETS_DIR/chat-avatar-2.jpg" "https://www.figma.com/api/mcp/asset/acd06cc6-b7ce-4d89-a2e5-e8f6feb8b459"
curl -o "$ASSETS_DIR/chat-avatar-3.jpg" "https://www.figma.com/api/mcp/asset/02a10646-2289-4f6c-a925-1d82e3e5d481"

echo "✅ All assets downloaded to $ASSETS_DIR"
echo "⚠️  Note: Assets expire in 7 days from Figma generation"

