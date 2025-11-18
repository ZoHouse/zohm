# AR Scanning Data Capture - What Can You Store?

**Quest**: Home Node Activation  
**Topic**: Data captured during AR scanning session  
**Privacy**: User consent required  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [8th Wall Data Available](#8th-wall-data-available)
3. [What to Store](#what-to-store)
4. [Data Schema](#data-schema)
5. [Use Cases](#use-cases)
6. [Privacy & Security](#privacy--security)
7. [Storage Strategy](#storage-strategy)
8. [Analytics & Insights](#analytics--insights)

---

## Overview

During the AR scanning session, **8th Wall provides rich data** about:
- Device position and orientation (6DOF tracking)
- Detected surfaces (floors, walls, tables)
- Camera frames (optionally)
- Device sensors (accelerometer, gyroscope)
- Session quality metrics
- Light estimation

**You can store** this data for:
- ✅ Verification (prove user was there)
- ✅ Anti-cheat (detect spoofing/emulation)
- ✅ Analytics (improve UX)
- ✅ Replay (show scanning process)
- ✅ Quality control (flag bad scans)

---

## 8th Wall Data Available

### **1. Camera/Device Position (SLAM Tracking)**

```typescript
interface SLAMData {
  // Device position in world space
  position: {
    x: number;  // meters
    y: number;  // meters  
    z: number;  // meters
  };
  
  // Device orientation (quaternion)
  rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  
  // Alternative: Euler angles
  euler: {
    pitch: number;  // degrees
    yaw: number;    // degrees
    roll: number;   // degrees
  };
  
  // Tracking quality
  tracking_state: 'initializing' | 'tracking' | 'limited' | 'lost';
  tracking_confidence: number; // 0-1
  
  // Timestamp
  timestamp: number; // milliseconds since session start
}
```

**Example Data**:
```json
{
  "position": { "x": 0.5, "y": 1.2, "z": -2.3 },
  "rotation": { "x": 0.1, "y": 0.0, "z": 0.0, "w": 0.99 },
  "tracking_state": "tracking",
  "tracking_confidence": 0.95,
  "timestamp": 15230
}
```

**What This Tells You**:
- How user moved through space
- Walking speed
- Head movements
- Room size estimation
- Scan coverage quality

---

### **2. Detected Surfaces**

```typescript
interface DetectedSurface {
  // Surface ID
  id: string;
  
  // Surface type
  type: 'horizontal' | 'vertical';
  
  // Center position
  position: {
    x: number;
    y: number;
    z: number;
  };
  
  // Surface normal (direction it faces)
  normal: {
    x: number;
    y: number;
    z: number;
  };
  
  // Surface bounds (if available)
  bounds?: {
    width: number;   // meters
    height: number;  // meters
    area: number;    // square meters
  };
  
  // Confidence
  confidence: number; // 0-1
  
  // When detected
  first_detected_at: number; // timestamp
  last_updated_at: number;
}
```

**Example Data**:
```json
{
  "id": "surface_001",
  "type": "horizontal",
  "position": { "x": 0, "y": 0, "z": 0 },
  "normal": { "x": 0, "y": 1, "z": 0 },
  "bounds": { "width": 3.2, "height": 4.5, "area": 14.4 },
  "confidence": 0.88,
  "first_detected_at": 2340,
  "last_updated_at": 8920
}
```

**What This Tells You**:
- Floor detected (horizontal)
- Walls detected (vertical)
- Room dimensions
- Surface quality
- Scan completeness

---

### **3. AR Anchor Data**

```typescript
interface ARAnchor {
  // Unique anchor ID
  anchor_id: string;
  
  // Position where beacon placed
  position: {
    x: number;
    y: number;
    z: number;
  };
  
  // Rotation
  rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  
  // Scale
  scale: number;
  
  // What surface it's attached to
  attached_surface_id?: string;
  surface_type: 'horizontal' | 'vertical';
  
  // Quality metrics
  anchor_confidence: number; // 0-1
  tracking_quality: 'high' | 'medium' | 'low';
  
  // Timestamps
  created_at: number;
  last_tracked_at: number;
}
```

**Example Data**:
```json
{
  "anchor_id": "zo-anchor-1731884920-x8h3k",
  "position": { "x": 1.2, "y": 1.5, "z": -1.8 },
  "rotation": { "x": 0, "y": 0, "z": 0, "w": 1 },
  "scale": 1.0,
  "attached_surface_id": "surface_001",
  "surface_type": "horizontal",
  "anchor_confidence": 0.92,
  "tracking_quality": "high",
  "created_at": 24500,
  "last_tracked_at": 24500
}
```

**What This Tells You**:
- Where user placed beacon
- How stable the placement is
- Which surface was used
- Placement precision

---

### **4. Light Estimation**

```typescript
interface LightEstimation {
  // Ambient light intensity
  ambient_intensity: number; // 0-1 (0=dark, 1=bright)
  
  // Color temperature (Kelvin)
  color_temperature: number; // e.g., 6500 for daylight
  
  // Light direction (if available)
  direction?: {
    x: number;
    y: number;
    z: number;
  };
  
  // Timestamp
  timestamp: number;
}
```

**Example Data**:
```json
{
  "ambient_intensity": 0.75,
  "color_temperature": 5800,
  "direction": { "x": 0.2, "y": -0.8, "z": 0.1 },
  "timestamp": 5000
}
```

**What This Tells You**:
- Room lighting quality
- Time of day (bright = day, dim = evening)
- Lighting affects AR quality

---

### **5. Session Metrics**

```typescript
interface SessionMetrics {
  // Session identification
  session_id: string;
  user_id: string;
  
  // Timing
  start_time: number;        // Unix timestamp
  end_time: number;
  duration_seconds: number;
  
  // Scanning stats
  total_distance_traveled: number; // meters
  total_surfaces_detected: number;
  horizontal_surfaces: number;
  vertical_surfaces: number;
  
  // Quality metrics
  average_tracking_confidence: number; // 0-1
  tracking_lost_count: number;         // How many times tracking failed
  tracking_lost_duration: number;      // Total seconds of lost tracking
  
  // User actions
  placement_attempts: number;    // How many times user tried to place beacon
  placement_adjustments: number; // How many times they moved it
  
  // Performance
  average_fps: number;
  dropped_frames: number;
  
  // Device info
  device_model: string;
  os_version: string;
  browser: string;
  camera_resolution: string;
}
```

**Example Data**:
```json
{
  "session_id": "sess_1731884920_abc123",
  "user_id": "user_xyz",
  "start_time": 1731884920000,
  "end_time": 1731884965000,
  "duration_seconds": 45,
  "total_distance_traveled": 4.2,
  "total_surfaces_detected": 8,
  "horizontal_surfaces": 1,
  "vertical_surfaces": 7,
  "average_tracking_confidence": 0.87,
  "tracking_lost_count": 2,
  "tracking_lost_duration": 3,
  "placement_attempts": 1,
  "placement_adjustments": 2,
  "average_fps": 32,
  "dropped_frames": 18,
  "device_model": "iPhone 14 Pro",
  "os_version": "iOS 16.3",
  "browser": "Safari",
  "camera_resolution": "1920x1080"
}
```

**What This Tells You**:
- How long scanning took
- Quality of the scan
- Device performance
- User behavior patterns
- Technical issues

---

### **6. GPS & Location Data**

```typescript
interface LocationData {
  // GPS coordinates
  latitude: number;
  longitude: number;
  altitude?: number; // meters above sea level
  
  // Accuracy
  accuracy: number;           // meters (±)
  altitude_accuracy?: number; // meters (±)
  
  // Movement
  heading?: number;  // degrees (0-360, compass direction)
  speed?: number;    // meters/second
  
  // Timestamp
  timestamp: number;
}
```

**Example Data**:
```json
{
  "latitude": 12.9352,
  "longitude": 77.6245,
  "altitude": 920,
  "accuracy": 8.5,
  "altitude_accuracy": 15,
  "heading": 245,
  "speed": 0.1,
  "timestamp": 1731884920000
}
```

**What This Tells You**:
- User's real-world location
- GPS accuracy (indoor vs outdoor)
- Movement during scan
- Verify they're at the location they claim

---

### **7. Camera Frames (Optional)**

⚠️ **Large Data** - Only capture if absolutely needed

```typescript
interface CameraFrame {
  // Frame ID
  frame_id: string;
  
  // Image data (base64 encoded)
  image_data?: string; // JPEG or PNG, base64
  
  // Or just metadata
  width: number;
  height: number;
  format: string;
  
  // Timestamp
  timestamp: number;
  
  // Associated tracking data
  camera_position: { x: number; y: number; z: number };
  camera_rotation: { x: number; y: number; z: number; w: number };
}
```

**Storage Size**:
- Low quality (480p): ~50 KB per frame
- Medium quality (720p): ~150 KB per frame
- High quality (1080p): ~400 KB per frame

**At 30 FPS for 60 seconds**:
- Low: ~90 MB
- Medium: ~270 MB
- High: ~720 MB

**⚠️ Recommendation**: Don't store raw frames unless needed for specific verification. Instead, store:
- 1 frame per second (60 frames for 60s scan)
- Low quality only
- Or: Just store a few key frames (start, middle, end, placement moment)

---

## What to Store

### **Minimal Storage (Recommended)**

Store only what's needed for verification and analytics:

```typescript
interface MinimalScanData {
  // Session ID
  session_id: string;
  
  // Basic metrics
  scan_duration_seconds: number;
  surfaces_detected: number;
  scan_quality_score: number; // 0-1, calculated
  
  // Final anchor
  anchor: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    scale: number;
  };
  
  // Location
  gps: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  
  // Device
  device: {
    model: string;
    os: string;
    browser: string;
  };
  
  // Timestamps
  scanned_at: string; // ISO 8601
}
```

**Storage Size**: ~1 KB per scan

---

### **Standard Storage**

Include more details for analytics:

```typescript
interface StandardScanData {
  // All from minimal +
  
  // Tracking path (sampled at 1 Hz)
  tracking_path: Array<{
    position: { x: number; y: number; z: number };
    timestamp: number;
  }>;
  
  // Surfaces
  surfaces: Array<{
    type: 'horizontal' | 'vertical';
    position: { x: number; y: number; z: number };
    area: number;
    confidence: number;
  }>;
  
  // Quality metrics
  metrics: {
    average_fps: number;
    tracking_lost_count: number;
    placement_attempts: number;
  };
  
  // Light conditions
  ambient_light: number;
}
```

**Storage Size**: ~10-50 KB per scan

---

### **Full Storage (Advanced)**

Store everything for replay/verification:

```typescript
interface FullScanData {
  // All from standard +
  
  // High-frequency tracking (10 Hz)
  tracking_full: Array<{
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    tracking_confidence: number;
    timestamp: number;
  }>;
  
  // Key frames (4-6 images)
  keyframes: Array<{
    image_base64: string;
    timestamp: number;
    camera_pose: {
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
    };
  }>;
  
  // Complete surface mesh
  surface_mesh?: {
    vertices: number[][];
    faces: number[][];
  };
}
```

**Storage Size**: ~500 KB - 2 MB per scan

---

## Data Schema

### **Database Table: `ar_scan_sessions`**

```sql
CREATE TABLE ar_scan_sessions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id),
  node_id UUID REFERENCES user_nodes(id), -- Linked after node created
  
  -- Session metadata
  session_id TEXT UNIQUE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Scanning metrics
  scan_quality_score DECIMAL(3,2), -- 0.00-1.00
  total_surfaces_detected INTEGER DEFAULT 0,
  horizontal_surfaces INTEGER DEFAULT 0,
  vertical_surfaces INTEGER DEFAULT 0,
  total_distance_traveled DECIMAL(6,2), -- meters
  
  -- Tracking quality
  average_tracking_confidence DECIMAL(3,2),
  tracking_lost_count INTEGER DEFAULT 0,
  tracking_lost_duration INTEGER DEFAULT 0, -- seconds
  
  -- Performance
  average_fps INTEGER,
  dropped_frames INTEGER DEFAULT 0,
  
  -- User actions
  placement_attempts INTEGER DEFAULT 0,
  placement_adjustments INTEGER DEFAULT 0,
  
  -- Environment
  ambient_light_level DECIMAL(3,2), -- 0.00-1.00
  
  -- Device info
  device_model TEXT,
  os_version TEXT,
  browser TEXT,
  camera_resolution TEXT,
  
  -- Location
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  gps_accuracy DOUBLE PRECISION,
  
  -- Detailed data (JSONB for flexibility)
  tracking_path JSONB, -- Sampled position data
  surfaces_data JSONB, -- Detected surfaces
  anchor_data JSONB,   -- Final anchor placement
  metadata JSONB,      -- Additional data
  
  -- Status
  status TEXT DEFAULT 'completed',
  -- Status: completed, abandoned, failed, invalid
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ar_sessions_user_id ON ar_scan_sessions(user_id);
CREATE INDEX idx_ar_sessions_node_id ON ar_scan_sessions(node_id);
CREATE INDEX idx_ar_sessions_started_at ON ar_scan_sessions(started_at DESC);
CREATE INDEX idx_ar_sessions_quality ON ar_scan_sessions(scan_quality_score DESC);
CREATE INDEX idx_ar_sessions_status ON ar_scan_sessions(status);

-- Index on JSONB for queries
CREATE INDEX idx_ar_sessions_metadata ON ar_scan_sessions USING GIN (metadata);
```

---

## Use Cases

### **1. Anti-Cheat / Verification**

**Problem**: User might fake their location or use AR emulator

**Detection**:
```typescript
function detectSpoofing(scanData: ScanData): SpoofingFlags {
  const flags: SpoofingFlags = {
    is_suspicious: false,
    reasons: [],
  };
  
  // Check 1: Too perfect tracking
  if (scanData.average_tracking_confidence > 0.98) {
    flags.reasons.push('Tracking confidence too high (possible emulator)');
  }
  
  // Check 2: No tracking losses
  if (scanData.tracking_lost_count === 0 && scanData.duration_seconds > 30) {
    flags.reasons.push('No tracking losses (unusual for real AR)');
  }
  
  // Check 3: Straight line movement
  if (isPathTooStraight(scanData.tracking_path)) {
    flags.reasons.push('Movement too linear (not human-like)');
  }
  
  // Check 4: GPS mismatch
  if (scanData.gps_accuracy > 50) {
    flags.reasons.push('GPS accuracy too low (indoor spoofing?)');
  }
  
  // Check 5: Surfaces too perfect
  if (scanData.surfaces.every(s => s.confidence > 0.95)) {
    flags.reasons.push('All surfaces high confidence (unusual)');
  }
  
  // Check 6: Device/browser mismatch
  if (scanData.device.model === 'Unknown' || scanData.browser === 'Headless') {
    flags.reasons.push('Suspicious device/browser');
  }
  
  flags.is_suspicious = flags.reasons.length > 2;
  return flags;
}
```

---

### **2. Quality Control**

**Problem**: Bad scans lead to unstable AR anchors

**Solution**: Calculate quality score

```typescript
function calculateScanQuality(scanData: ScanData): number {
  let score = 0;
  
  // Factor 1: Surface detection (0-0.3)
  const surfaceScore = Math.min(scanData.total_surfaces_detected / 10, 1.0) * 0.3;
  score += surfaceScore;
  
  // Factor 2: Tracking stability (0-0.3)
  const trackingScore = scanData.average_tracking_confidence * 0.3;
  score += trackingScore;
  
  // Factor 3: Scan duration (0-0.2)
  // Ideal: 30-60 seconds
  const durationScore = scanData.duration_seconds >= 30 && scanData.duration_seconds <= 60
    ? 0.2
    : 0.1;
  score += durationScore;
  
  // Factor 4: Distance traveled (0-0.2)
  // Should move around, but not too much
  const distanceScore = scanData.total_distance_traveled >= 2 && scanData.total_distance_traveled <= 10
    ? 0.2
    : 0.1;
  score += distanceScore;
  
  // Penalties
  if (scanData.tracking_lost_count > 3) score -= 0.1;
  if (scanData.dropped_frames > 100) score -= 0.05;
  
  return Math.max(0, Math.min(1, score));
}
```

**Usage**:
```typescript
const quality = calculateScanQuality(scanData);

if (quality < 0.5) {
  // Reject scan, ask user to retry
  return { success: false, message: 'Scan quality too low, please try again' };
} else if (quality < 0.7) {
  // Accept but warn
  return { success: true, warning: 'Scan quality moderate, portal may be less stable' };
} else {
  // Good scan!
  return { success: true, quality: 'excellent' };
}
```

---

### **3. Analytics & Insights**

**Queries You Can Run**:

```sql
-- Average scan time by device
SELECT 
  device_model,
  AVG(duration_seconds) as avg_duration,
  AVG(scan_quality_score) as avg_quality,
  COUNT(*) as scan_count
FROM ar_scan_sessions
WHERE status = 'completed'
GROUP BY device_model
ORDER BY scan_count DESC;

-- Success rate by time of day
SELECT 
  EXTRACT(HOUR FROM started_at) as hour,
  COUNT(*) as total_scans,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM ar_scan_sessions
GROUP BY hour
ORDER BY hour;

-- Common failure points
SELECT 
  metadata->>'failure_reason' as reason,
  COUNT(*) as occurrences
FROM ar_scan_sessions
WHERE status = 'failed'
GROUP BY reason
ORDER BY occurrences DESC;

-- Performance by location
SELECT 
  city,
  country,
  AVG(scan_quality_score) as avg_quality,
  AVG(gps_accuracy) as avg_gps_accuracy,
  COUNT(*) as scan_count
FROM ar_scan_sessions
JOIN user_nodes ON ar_scan_sessions.node_id = user_nodes.id
GROUP BY city, country
ORDER BY scan_count DESC;
```

---

### **4. User Experience Optimization**

**Identify Pain Points**:

```typescript
// Find where users struggle
const struggles = await supabase
  .from('ar_scan_sessions')
  .select('*')
  .or('tracking_lost_count.gte.5,placement_attempts.gte.3,duration_seconds.gte.180');

// Common issues:
// - High tracking_lost_count → Lighting/movement instructions needed
// - Many placement_attempts → UI/guidance unclear
// - Long duration → Instructions too complex

// Improvement actions:
if (struggles.length > 100) {
  // A) Add better onboarding
  // B) Improve visual feedback
  // C) Add tips for better scanning
}
```

---

### **5. Replay / Visualization**

**Reconstruct Scan Session**:

```typescript
async function replayScan(sessionId: string) {
  const session = await getSessionData(sessionId);
  
  // Recreate the path user took
  const path = session.tracking_path;
  
  // Show detected surfaces
  const surfaces = session.surfaces_data;
  
  // Show where beacon was placed
  const anchor = session.anchor_data;
  
  // Render in 3D viewer (Three.js)
  return (
    <ScanReplayViewer
      path={path}
      surfaces={surfaces}
      anchor={anchor}
      duration={session.duration_seconds}
    />
  );
}
```

**Use Cases**:
- Customer support (help debug issues)
- Quality review (verify node placements)
- Showcase (show cool scans publicly)
- Training data (ML models)

---

## Privacy & Security

### **Privacy Considerations**

⚠️ **User Consent Required**

Before capturing data, inform users:

```tsx
<ConsentScreen>
  <h3>AR Scanning - Data Collection</h3>
  <p>
    We collect the following data during scanning:
  </p>
  <ul>
    <li>✓ Device position and movement (anonymous)</li>
    <li>✓ Detected surfaces (no personal info)</li>
    <li>✓ GPS location (to place node on map)</li>
    <li>✓ Device model and performance</li>
    <li>✗ Camera images (NOT stored)</li>
    <li>✗ Identifiable features (NOT stored)</li>
  </ul>
  <p>
    This data helps us verify authenticity and improve the experience.
  </p>
  <button onClick={acceptAndProceed}>Accept & Continue</button>
</ConsentScreen>
```

### **Data Minimization**

Only store what you need:

❌ **Don't Store**:
- Raw camera frames (too large, privacy risk)
- User's face/body (if detected)
- Text in the environment
- Personal objects

✅ **Do Store**:
- Anonymous tracking data
- Surface geometry (no textures)
- Performance metrics
- GPS coordinates

### **Anonymization**

```typescript
// Before storing, anonymize
function anonymizeScanData(raw: RawScanData): AnonymizedScanData {
  return {
    // Remove user ID from detailed logs
    session_id: hashSessionId(raw.session_id),
    
    // Fuzzy GPS (reduce precision)
    gps: {
      lat: Math.round(raw.gps.lat * 1000) / 1000, // ±111m accuracy
      lng: Math.round(raw.gps.lng * 1000) / 1000,
    },
    
    // Generic device model
    device: {
      model: generalizeDeviceModel(raw.device.model),
      os: generalizeOS(raw.device.os),
    },
    
    // Keep metrics
    metrics: raw.metrics,
  };
}
```

### **Retention Policy**

```sql
-- Delete old scan data after 90 days
DELETE FROM ar_scan_sessions
WHERE created_at < NOW() - INTERVAL '90 days'
AND status != 'flagged'; -- Keep flagged sessions longer for review
```

---

## Storage Strategy

### **Tiered Storage**

**Hot Storage** (Supabase PostgreSQL):
- Recent scans (<30 days)
- Active nodes
- Fast queries

**Cold Storage** (S3/Object Storage):
- Old scans (>30 days)
- Compressed JSONB
- Rarely accessed

**Archive** (Glacier/Deep Archive):
- Very old scans (>1 year)
- Compliance/legal hold
- Cheapest storage

### **Compression**

```typescript
// Before storing large JSONB
import { gzip } from 'zlib';

async function compressScanData(data: ScanData): Promise<Buffer> {
  const json = JSON.stringify(data);
  const compressed = await gzip(json);
  return compressed; // ~70% size reduction
}

// On retrieval
import { gunzip } from 'zlib';

async function decompressScanData(buffer: Buffer): Promise<ScanData> {
  const json = await gunzip(buffer);
  return JSON.parse(json.toString());
}
```

---

## Analytics & Insights

### **Key Metrics to Track**

```typescript
const scanMetrics = {
  // Success metrics
  completion_rate: 0.85,        // 85% complete their scan
  average_quality: 0.78,        // Average scan quality
  average_duration: 42,         // Seconds
  
  // Failure modes
  abandon_rate: 0.10,           // 10% abandon mid-scan
  retry_rate: 0.05,             // 5% need to retry
  
  // Technical
  average_fps: 31,              // Frame rate
  tracking_lost_rate: 0.08,     // 8% experience tracking loss
  
  // Device breakdown
  ios_success: 0.88,
  android_success: 0.82,
  
  // User behavior
  average_surfaces_scanned: 7,
  average_placement_attempts: 1.3,
};
```

### **Queries for Product Decisions**

```sql
-- Which device performs best?
SELECT 
  device_model,
  AVG(scan_quality_score) as avg_quality,
  AVG(average_fps) as avg_fps
FROM ar_scan_sessions
WHERE status = 'completed'
GROUP BY device_model
ORDER BY avg_quality DESC;

-- When do users scan (time of day)?
SELECT 
  EXTRACT(HOUR FROM started_at) as hour,
  COUNT(*) as scan_count
FROM ar_scan_sessions
GROUP BY hour
ORDER BY hour;

-- Indoor vs outdoor scanning success
SELECT 
  CASE 
    WHEN ambient_light_level < 0.3 THEN 'Dark'
    WHEN ambient_light_level < 0.7 THEN 'Medium'
    ELSE 'Bright'
  END as lighting,
  AVG(scan_quality_score) as avg_quality,
  COUNT(*) as count
FROM ar_scan_sessions
GROUP BY lighting;
```

---

## Summary

### **Recommended Approach**

**For Production**:
1. ✅ Store **Standard Data** (10-50 KB per scan)
2. ✅ Include session metrics for analytics
3. ✅ Store anchor data for verification
4. ✅ GPS for location proof
5. ❌ Don't store camera frames (privacy + size)
6. ❌ Don't store high-frequency tracking (unnecessary)

**Storage Size per User**:
- One scan: ~25 KB
- 1000 users: ~25 MB
- 100,000 users: ~2.5 GB

**Cost**: Negligible with Supabase/PostgreSQL

### **Benefits**

✅ **Verification**: Prove user was there  
✅ **Anti-Cheat**: Detect spoofing/emulation  
✅ **Quality**: Ensure good AR experiences  
✅ **Analytics**: Improve UX over time  
✅ **Support**: Help users debug issues  
✅ **Insights**: Data-driven product decisions  

---

**Questions?**  
See main spec: [QUEST_HOME_NODE_ACTIVATION.md](./QUEST_HOME_NODE_ACTIVATION.md)

---

*Last Updated: 2025-11-17*  
*Status: Reference Document*

