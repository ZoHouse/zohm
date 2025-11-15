#!/bin/bash

# Mobile Dashboard Asset Downloader
# Downloads Figma assets for mobile dashboard implementation
# Run from project root: bash scripts/download-mobile-dashboard-assets.sh

# Create directory if it doesn't exist
mkdir -p apps/web/public/mobile-dashboard

echo "📥 Downloading Mobile Dashboard Assets from Figma..."

# Podium shapes
echo "Downloading podium shapes..."
curl -o apps/web/public/mobile-dashboard/podium-1st.png "https://www.figma.com/api/mcp/asset/00febd37-01e0-4fcc-b00e-0dc5597a6250"
curl -o apps/web/public/mobile-dashboard/podium-2nd.png "https://www.figma.com/api/mcp/asset/c123e762-805c-4495-9efa-fc90a9cc81e7"
curl -o apps/web/public/mobile-dashboard/podium-3rd.png "https://www.figma.com/api/mcp/asset/c79575f6-34cf-4303-af74-f0dc5c018d2f"

# Profile frame decoration
echo "Downloading profile frame..."
curl -o apps/web/public/mobile-dashboard/profile-frame-decoration.png "https://www.figma.com/api/mcp/asset/7bbd75ff-c9df-4de1-a50c-61f2091872a4"
curl -o apps/web/public/mobile-dashboard/profile-photo-frame.png "https://www.figma.com/api/mcp/asset/6f546b33-b954-4f10-9889-791ff30fc815"

# Coin gradient layers
echo "Downloading coin gradients..."
curl -o apps/web/public/mobile-dashboard/coin-gradient-2.png "https://www.figma.com/api/mcp/asset/34cfd6f9-e8b3-4ae6-a857-78e95cd446f0"
curl -o apps/web/public/mobile-dashboard/coin-gradient-3.png "https://www.figma.com/api/mcp/asset/c1aaefaa-ae93-417d-aff2-888913816756"
curl -o apps/web/public/mobile-dashboard/coin-gradient-4.png "https://www.figma.com/api/mcp/asset/3b67a1d3-620d-4cce-84af-df11131e898f"
curl -o apps/web/public/mobile-dashboard/coin-gradient-5.png "https://www.figma.com/api/mcp/asset/e8a3a73a-8925-457d-ad29-418eb8ffa6de"
curl -o apps/web/public/mobile-dashboard/coin-gradient-6.png "https://www.figma.com/api/mcp/asset/07ef9401-0753-4870-94c3-38da6e69cc78"

# Status bar icons
echo "Downloading status bar icons..."
curl -o apps/web/public/mobile-dashboard/icon-wifi.png "https://www.figma.com/api/mcp/asset/5f77b919-3244-4c10-8528-6eb7793b2ac4"
curl -o apps/web/public/mobile-dashboard/icon-signal.png "https://www.figma.com/api/mcp/asset/d14893a0-5c7b-40cb-a4a3-22b408989734"
curl -o apps/web/public/mobile-dashboard/icon-battery.png "https://www.figma.com/api/mcp/asset/703ff6ea-8143-4522-94e2-bf6e9d658580"

# Zo logo (header)
echo "Downloading Zo logo..."
curl -o apps/web/public/mobile-dashboard/zo-logo.png "https://www.figma.com/api/mcp/asset/d982392d-d051-4ede-b7b4-4f140ef8499a"

echo "✅ Download complete!"
echo "Assets saved to: apps/web/public/mobile-dashboard/"
echo ""
echo "Files downloaded:"
ls -lh apps/web/public/mobile-dashboard/

