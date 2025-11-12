# AR Integration Example - Quick Start Guide

## 🚀 **How to Add AR to Your Mobile Map View**

This guide shows you how to integrate the new AR Scanner into your existing Zo World mobile app.

---

## 📦 **Step 1: Install Dependencies**

```bash
npm install aframe ar.js
```

✅ **Already added to `package.json`!**

---

## 🎯 **Step 2: Add AR Button to Mobile Map**

Update `/src/components/MobileView.tsx` to include an AR scan button:

```tsx
// Add to imports
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const ARScanner = dynamic(() => import('./ARScanner'), { ssr: false });

export default function MobileView({ ...props }) {
  const [showAR, setShowAR] = useState(false);
  
  return (
    <>
      {/* Your existing map content */}
      
      {/* AR Scan Button - Add next to Unicorn Button */}
      <motion.button
        onClick={() => setShowAR(true)}
        className="absolute bottom-32 right-6 z-20 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#FF6B9D] shadow-lg flex items-center justify-center"
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-3xl">🎯</span>
      </motion.button>
      
      {/* AR Scanner Modal */}
      {showAR && (
        <ARScanner
          userId={userId}
          onScanSuccess={(reward) => {
            console.log('Earned:', reward);
            // Show success toast or animation
          }}
          onClose={() => setShowAR(false)}
        />
      )}
    </>
  );
}
```

---

## 🎨 **Step 3: Style the AR Button**

Match the existing button styles:

```tsx
<motion.button
  onClick={() => setShowAR(true)}
  className="absolute bottom-32 right-6 z-20"
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ delay: 0.5, type: 'spring' }}
  whileTap={{ scale: 0.9 }}
  style={{
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF4D6D 0%, #FF6B9D 100%)',
    boxShadow: '0 8px 32px rgba(255, 77, 109, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <span className="text-4xl">🎯</span>
</motion.button>
```

---

## 📱 **Step 4: Test AR Scanning**

### **Option A: Use Demo Marker (Quick Test)**

1. Download the Hiro marker: https://jeromeetienne.github.io/AR.js/data/images/hiro.png
2. Print it or display on another device
3. Click the AR button in the app
4. Point your phone camera at the marker
5. See the 3D Zo logo and "Zo Zo Zo!" text appear! ✨

### **Option B: Create Custom Zo Marker**

1. Go to: https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html
2. Upload a Zo logo or custom image
3. Download the marker pattern (.patt file)
4. Update the ARScanner component to use your custom marker

---

## 🎮 **Step 5: Add to Quests**

### **Make AR a Quest:**

```tsx
// In QuestsContainer or wherever you show quests
const arQuest = {
  id: 'ar_scan_quest',
  title: 'Scan Your First Node',
  description: 'Use AR to scan a Zo House marker',
  reward: 50,
  xp: 10,
  action: () => setShowAR(true), // Opens AR scanner
};
```

### **Track AR Quest Completion:**

```tsx
<ARScanner
  userId={userId}
  nodeId={currentNodeId} // Pass the node they're at
  onScanSuccess={(reward) => {
    // Mark quest as complete
    completeQuest('ar_scan_quest');
    
    // Show reward animation
    showRewardToast({
      tokens: reward.tokens,
      xp: reward.xp,
    });
    
    // Update leaderboard
    refreshLeaderboard();
  }}
  onClose={() => setShowAR(false)}
/>
```

---

## 🌍 **Step 6: Location-Based AR**

### **Unlock AR at Specific Nodes:**

```tsx
// Check if user is near a node
const isNearNode = checkProximity(userLocation, nodeLocation);

// Only show AR button if near a node
{isNearNode && (
  <motion.button
    onClick={() => setShowAR(true)}
    className="ar-scan-button"
  >
    🎯 Scan Node
  </motion.button>
)}
```

### **Different AR Content Per Location:**

```tsx
<ARScanner
  userId={userId}
  nodeId={currentNode.id}
  markerImage={currentNode.arMarker} // Custom marker per node
  content3D={currentNode.ar3DModel} // Different 3D model per location
  onScanSuccess={(reward) => {
    console.log(`Scanned ${currentNode.name}!`, reward);
  }}
  onClose={() => setShowAR(false)}
/>
```

---

## 🎁 **Step 7: Rewards & Gamification**

### **AR Scan Rewards:**

- **Base Reward**: 50 $Zo + 10 XP
- **Node Bonus**: +20 $Zo (if at specific node)
- **Streak Bonus**: +10 $Zo per consecutive day
- **First Scan**: +100 $Zo (one-time bonus)

### **Track in Database:**

The API route `/api/ar/scan` automatically:
- Records the scan in `completed_quests` table
- Awards tokens to user's balance
- Calculates bonuses
- Returns scan history

---

## 🐛 **Troubleshooting**

### **Camera Not Working:**
- Make sure you're on HTTPS (required for camera access)
- Check browser permissions
- iOS Safari may need specific settings

### **Marker Not Detected:**
- Ensure good lighting
- Keep marker flat and in view
- Try different distances (1-2 feet works best)
- Marker should be high contrast

### **Performance Issues:**
- Limit 3D model complexity (<50k triangles)
- Compress textures (<2MB)
- Test on actual mobile devices, not just desktop

### **SSR Errors:**
- Always use `dynamic(() => import(...), { ssr: false })` for AR components
- A-Frame doesn't support server-side rendering

---

## 📊 **Analytics & Tracking**

### **Track AR Engagement:**

```tsx
// Track AR opens
analytics.track('ar_scanner_opened', {
  userId,
  location: userLocation,
  timestamp: Date.now(),
});

// Track successful scans
analytics.track('ar_scan_complete', {
  userId,
  nodeId,
  reward: scanResult.tokens,
  duration: scanDuration,
});
```

### **Monitor via API:**

```bash
# Get user's AR scan history
GET /api/ar/scan?userId={userId}

# Response:
{
  "scans": [...],
  "stats": {
    "totalScans": 15,
    "totalTokensEarned": 850,
    "lastScan": "2025-11-12T11:49:00Z"
  }
}
```

---

## 🎉 **Advanced Features (Future)**

### **1. Social AR**
- See other users' AR avatars at locations
- Leave AR messages/graffiti
- Collaborative AR experiences

### **2. AR Treasure Hunts**
- Hide virtual collectibles
- Clues lead to physical locations
- Limited-time AR events

### **3. AR Portals**
- Match the "space to location" animation
- Walk through AR portal to enter Zo World
- Different portals for different cities

### **4. AR Battles/Games**
- Mini-games triggered by AR markers
- Compete with other users in AR
- Earn tokens based on performance

---

## 📚 **Resources**

- **AR.js Docs**: https://ar-js-org.github.io/AR.js-Docs/
- **A-Frame Docs**: https://aframe.io/docs/
- **Marker Generator**: https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html
- **3D Models**: https://sketchfab.com/ (find free GLB/GLTF models)
- **Reference App**: `/public/reference ar work/` (React Native AR implementation)

---

## 🎯 **Quick Wins**

1. ✅ Add AR button to map (5 min)
2. ✅ Test with Hiro marker (10 min)
3. ✅ Connect to quest system (15 min)
4. ✅ Add location-based triggers (20 min)
5. ✅ Create custom Zo markers (30 min)

**Total Setup Time: ~1-2 hours for basic AR integration!**

---

## 🚦 **Deployment Checklist**

- [ ] Install dependencies (`npm install`)
- [ ] Add ARScanner component
- [ ] Add AR button to mobile view
- [ ] Test camera permissions
- [ ] Test with demo marker
- [ ] Create custom Zo markers
- [ ] Set up API route (already done!)
- [ ] Test rewards system
- [ ] Add analytics tracking
- [ ] Deploy to production
- [ ] Test on real devices (iOS & Android)

---

**Ready to bring AR to Zo World! 🦄✨**

*Built by the community, for the community. Zo Zo Zo!*

