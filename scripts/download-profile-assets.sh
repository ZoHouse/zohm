#!/bin/bash

# Download Profile Section Assets from Figma
echo "🎨 Downloading profile section assets..."

# Profile Frame (futuristic device frame)
curl -L "https://www.figma.com/api/mcp/asset/20e6fe26-c985-4050-9964-32196aa8b4e9" -o "apps/web/public/dashboard-assets/profile-frame.png"

# Profile Photo (avatar)
curl -L "https://www.figma.com/api/mcp/asset/3ce247ca-68a8-489f-8630-1a6bbfc242ab" -o "apps/web/public/dashboard-assets/profile-photo.png"

# Badge Icon (verified badge)
curl -L "https://www.figma.com/api/mcp/asset/86f1c91e-b10a-4263-b554-a2e6bf108fd1" -o "apps/web/public/dashboard-assets/badge-icon.svg"

# Wallet Icon
curl -L "https://www.figma.com/api/mcp/asset/1793fd0c-3da4-4771-9405-ab8a28d76603" -o "apps/web/public/dashboard-assets/wallet-icon.svg"

# Copy Arrow Icon
curl -L "https://www.figma.com/api/mcp/asset/723a3c25-ecaa-44d0-bded-29f6c1e1edf0" -o "apps/web/public/dashboard-assets/copy-arrow.svg"

# Stat Icons (3 gradient overlays for $Zo coin)
curl -L "https://www.figma.com/api/mcp/asset/d5310662-a66b-450f-ac21-432242b4cce1" -o "apps/web/public/dashboard-assets/stat-icon-1.png"
curl -L "https://www.figma.com/api/mcp/asset/923137c4-d903-4699-acec-b87779eb7ce9" -o "apps/web/public/dashboard-assets/stat-icon-2.png"
curl -L "https://www.figma.com/api/mcp/asset/eedd1c38-e566-4c24-ae92-4f51e5685fa8" -o "apps/web/public/dashboard-assets/stat-icon-3.png"

# X/Twitter Icon (updated)
curl -L "https://www.figma.com/api/mcp/asset/8b48ef6b-0365-4a91-afff-958e9325da35" -o "apps/web/public/dashboard-assets/x-twitter-icon.svg"

# Telegram Icon
curl -L "https://www.figma.com/api/mcp/asset/1c03a64f-46c6-421d-b66a-eaf07173595e" -o "apps/web/public/dashboard-assets/telegram-icon.svg"

echo "✅ Profile section assets downloaded!"
echo "📁 Location: apps/web/public/dashboard-assets/"
