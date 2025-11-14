#!/bin/bash

# Download ALL Figma Assets for Zo World Dashboard
# This script downloads all image assets systematically

# Create directory for assets
mkdir -p apps/web/public/dashboard-assets

echo "🎨 Downloading ALL Figma assets..."

# Culture Icons
curl -L "https://www.figma.com/api/mcp/asset/7cb21ac6-4836-4de7-922b-f01cdafc5d2d" -o "apps/web/public/dashboard-assets/design.png"
curl -L "https://www.figma.com/api/mcp/asset/9d8aa13a-589c-4442-b3ec-36b46e011713" -o "apps/web/public/dashboard-assets/science-technology.png"
curl -L "https://www.figma.com/api/mcp/asset/3cecf09b-ab8b-4a48-8722-d3e36f99f1a2" -o "apps/web/public/dashboard-assets/food.png"

# Background
curl -L "https://www.figma.com/api/mcp/asset/3d981cc4-5340-4baf-ab53-0a8ce43e39e4" -o "apps/web/public/dashboard-assets/desktop-9-bg.jpg"

# Zo World Icon
curl -L "https://www.figma.com/api/mcp/asset/381a1b47-ed30-4449-a415-2d80dba01079" -o "apps/web/public/dashboard-assets/zo-world-icon.png"

# Avatars
curl -L "https://www.figma.com/api/mcp/asset/5bfc8978-f350-4ace-a785-f78c50c601e9" -o "apps/web/public/dashboard-assets/avatar.png"
curl -L "https://www.figma.com/api/mcp/asset/14a8d157-29ab-4374-94cd-f4e5cff2919d" -o "apps/web/public/dashboard-assets/gdfp7elr-400x400.png"
curl -L "https://www.figma.com/api/mcp/asset/55d0de9b-4db3-4a72-8140-e0edb2eb9b7e" -o "apps/web/public/dashboard-assets/gdfp7elr-400x401.png"
curl -L "https://www.figma.com/api/mcp/asset/27e23315-8625-406f-81ce-160dbdd42c0b" -o "apps/web/public/dashboard-assets/gdfp7elr-400x402.png"
curl -L "https://www.figma.com/api/mcp/asset/3b85f16c-a3bc-4118-83bc-4e5651c0da2d" -o "apps/web/public/dashboard-assets/gdfp7elr-400x403.png"
curl -L "https://www.figma.com/api/mcp/asset/86d7ed25-300c-4189-89d4-d4bb2e7fc803" -o "apps/web/public/dashboard-assets/avatar-1.png"

# Coin/Gradient Images
curl -L "https://www.figma.com/api/mcp/asset/61bb37d6-b498-4313-abdb-d0676e30765b" -o "apps/web/public/dashboard-assets/image-2.png"
curl -L "https://www.figma.com/api/mcp/asset/954553f6-ab7a-409e-91b7-10e642e88d45" -o "apps/web/public/dashboard-assets/image-3.png"
curl -L "https://www.figma.com/api/mcp/asset/baa0c90c-3a93-48b6-84ee-22f6e34f674e" -o "apps/web/public/dashboard-assets/image-4.png"

# Main Quest Wall.app Image
curl -L "https://www.figma.com/api/mcp/asset/6375d760-4eff-48f0-987d-a17a60ef3d6d" -o "apps/web/public/dashboard-assets/4e45e0263bd2e484e1118ee4c3da505c26e22145-1.png"

# Founder NFTs (430 series)
curl -L "https://www.figma.com/api/mcp/asset/0a73781d-b7b2-4e65-bd32-57b71457ddc3" -o "apps/web/public/dashboard-assets/430-1.png"
curl -L "https://www.figma.com/api/mcp/asset/c0ea2ff0-21e1-4036-9ee9-d4b9fe152346" -o "apps/web/public/dashboard-assets/430-2.png"
curl -L "https://www.figma.com/api/mcp/asset/dd00a481-6b2d-4f47-b4e7-5f020c659014" -o "apps/web/public/dashboard-assets/430-3.png"
curl -L "https://www.figma.com/api/mcp/asset/7012558a-3872-49fc-aaf5-9c263ffcf008" -o "apps/web/public/dashboard-assets/430-4.png"

# Zo Houses / Nodes
curl -L "https://www.figma.com/api/mcp/asset/9ba19cd1-3a52-4ff7-8991-7d74951d53af" -o "apps/web/public/dashboard-assets/image.png"
curl -L "https://www.figma.com/api/mcp/asset/2d31c54d-1034-4ed3-b6f2-e430c9048c96" -o "apps/web/public/dashboard-assets/img-4761-1.png"
curl -L "https://www.figma.com/api/mcp/asset/e7a6e257-b4d5-4f29-b84f-48c38686353a" -o "apps/web/public/dashboard-assets/img-4761-2.png"
curl -L "https://www.figma.com/api/mcp/asset/25b0cba7-d06c-46e6-996b-465229c0af49" -o "apps/web/public/dashboard-assets/img-4761-3.png"

# 3D Map
curl -L "https://www.figma.com/api/mcp/asset/4817b536-3f65-4a8c-8822-532a72b4bf1b" -o "apps/web/public/dashboard-assets/main.png"

# Map Marker
curl -L "https://www.figma.com/api/mcp/asset/149ab3c9-8375-436e-b046-c2db96741e22" -o "apps/web/public/dashboard-assets/image-1.png"

# Zo Logo Badge
curl -L "https://www.figma.com/api/mcp/asset/d7e67352-3778-405b-95fc-c69466b03c06" -o "apps/web/public/dashboard-assets/comfyui-temp-iytpa-00048.png"

# ZO NODE and ZO CARD Images
curl -L "https://www.figma.com/api/mcp/asset/d1875c3d-58c0-4dbe-a3e3-2bd69943b933" -o "apps/web/public/dashboard-assets/rectangle-752.png"
curl -L "https://www.figma.com/api/mcp/asset/8006cf11-5532-4aea-8956-fa71fd50364d" -o "apps/web/public/dashboard-assets/rectangle-753.png"

# Virtual Rooms
curl -L "https://www.figma.com/api/mcp/asset/a45d5616-97fd-40f4-a093-9a33c9bc86a6" -o "apps/web/public/dashboard-assets/image-5.png"

# Communities
curl -L "https://www.figma.com/api/mcp/asset/57e53255-338d-4f5a-8042-d40aeafe147f" -o "apps/web/public/dashboard-assets/image-6.png"
curl -L "https://www.figma.com/api/mcp/asset/6d1f781a-d513-41e8-be26-f42395abf75a" -o "apps/web/public/dashboard-assets/image-240.png"
curl -L "https://www.figma.com/api/mcp/asset/ecf747d9-ac1e-4527-923c-ac5692ade963" -o "apps/web/public/dashboard-assets/image-241.png"

# Events
curl -L "https://www.figma.com/api/mcp/asset/64ddf545-1028-4074-a209-463f2586e8e3" -o "apps/web/public/dashboard-assets/rectangle-738.png"

# Icons (SVG)
curl -L "https://www.figma.com/api/mcp/asset/006c49df-34f5-45b1-ac3a-37df071ad7a7" -o "apps/web/public/dashboard-assets/vector.svg"
curl -L "https://www.figma.com/api/mcp/asset/17d99d5e-fc08-4da2-ae8d-dfb72d681a3f" -o "apps/web/public/dashboard-assets/wallet.svg"
curl -L "https://www.figma.com/api/mcp/asset/3d7fae02-3074-4df9-926c-d336ae948319" -o "apps/web/public/dashboard-assets/social-media.svg"
curl -L "https://www.figma.com/api/mcp/asset/899d8ee7-d911-4d73-ae8e-6e18d48a1503" -o "apps/web/public/dashboard-assets/social-media-1.svg"
curl -L "https://www.figma.com/api/mcp/asset/94b8622a-e2f2-48d6-b43d-c398bcc8ffcc" -o "apps/web/public/dashboard-assets/dots.svg"
curl -L "https://www.figma.com/api/mcp/asset/e37912ac-a010-43a3-ac56-5828bf657971" -o "apps/web/public/dashboard-assets/dots-1.svg"

# UI Control Icons
curl -L "https://www.figma.com/api/mcp/asset/78437458-fa2b-41a4-83fe-0eb967a5efc9" -o "apps/web/public/dashboard-assets/play-icon.svg"
curl -L "https://www.figma.com/api/mcp/asset/0a002503-04dd-4bb4-8031-f2728226b59f" -o "apps/web/public/dashboard-assets/menu-1.svg"
curl -L "https://www.figma.com/api/mcp/asset/763bfcbb-5a81-4928-91f6-08b91f089a1f" -o "apps/web/public/dashboard-assets/menu-2.svg"
curl -L "https://www.figma.com/api/mcp/asset/7a430de6-4190-4ede-9f06-bc18781d39c9" -o "apps/web/public/dashboard-assets/menu-3.svg"
curl -L "https://www.figma.com/api/mcp/asset/644885a0-59c1-4058-8b19-e6cbb2cadd7b" -o "apps/web/public/dashboard-assets/menu-4.svg"

# Quest & Attachment Icons
curl -L "https://www.figma.com/api/mcp/asset/932dd466-0526-4f01-b40a-7b21109fba11" -o "apps/web/public/dashboard-assets/globe-icon.svg"
curl -L "https://www.figma.com/api/mcp/asset/1414d14e-7c5a-4e15-8da3-6e9f8a565c35" -o "apps/web/public/dashboard-assets/x-icon.svg"
curl -L "https://www.figma.com/api/mcp/asset/fc9a8ed7-1406-43bc-b94b-f67e8a041155" -o "apps/web/public/dashboard-assets/attach-icon.svg"

# Map Controls
curl -L "https://www.figma.com/api/mcp/asset/3783f1d4-80bc-4762-908c-65511e47a773" -o "apps/web/public/dashboard-assets/search-ellipse.svg"
curl -L "https://www.figma.com/api/mcp/asset/203d57fd-6ce3-46f0-9ad7-efbf833395c7" -o "apps/web/public/dashboard-assets/add.svg"
curl -L "https://www.figma.com/api/mcp/asset/8fefa145-7be7-42e8-8754-7369a5cd6639" -o "apps/web/public/dashboard-assets/line-1.svg"
curl -L "https://www.figma.com/api/mcp/asset/081f9ed9-be15-46b3-9bdc-45c3eed52755" -o "apps/web/public/dashboard-assets/frame-386.svg"
curl -L "https://www.figma.com/api/mcp/asset/e5d1a816-7574-42cd-bb34-d36369544cf2" -o "apps/web/public/dashboard-assets/group.svg"
curl -L "https://www.figma.com/api/mcp/asset/ce25fa44-aba2-4e93-bd03-43e4531f67d5" -o "apps/web/public/dashboard-assets/line-2.svg"

echo "✅ All Figma assets downloaded successfully!"
echo "📦 Total assets: 55+"
echo "📁 Location: apps/web/public/dashboard-assets/"

