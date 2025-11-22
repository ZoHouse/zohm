# Voice Transcription System

**Component**: QuestAudio (Game1111 Voice Quest)  
**Last Updated**: November 22, 2025  
**Status**: ✅ Production

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Recording Flow](#recording-flow)
4. [Transcription Methods](#transcription-methods)
5. [Game Logic Integration](#game-logic-integration)
6. [Code Reference](#code-reference)
7. [Setup & Configuration](#setup--configuration)

---

## Overview

The voice transcription system powers the **Game1111 voice quest** where users say "Zo" to start a counter and try to stop it at exactly 1111. The system uses a **dual transcription approach**:

1. **Primary**: AssemblyAI API (high accuracy, server-side)
2. **Fallback**: Web Speech API (real-time, browser-based)

### Key Features

- 🎙️ **5-second voice recording** with visual feedback
- 🎯 **Dual transcription** for maximum reliability
- ⏱️ **Quest cooldown system** (12 hours)
- 🎮 **Real-time game trigger** ("Zo" detection)
- 💾 **Audio file preservation** for debugging
- 🔄 **Offline queue support** for poor connectivity

---

## Architecture

```
User says "Zo"
      ↓
┌─────────────────────────────────────────────┐
│  1. RECORDING (3 seconds)                   │
│                                             │
│  ┌────────────────┐   ┌──────────────────┐│
│  │ Web Speech API │   │ MediaRecorder    ││
│  │ (Real-time)    │   │ (Audio capture)  ││
│  └────────┬───────┘   └────────┬─────────┘│
│           │                    │          │
│           ├─> Interim Results  │          │
│           └─> Final Results    │          │
│                                │          │
└────────────────────────────────┼──────────┘
                                 ↓
┌─────────────────────────────────────────────┐
│  2. TRANSCRIPTION (Dual approach)           │
│                                             │
│  ┌────────────────────────────────────────┐│
│  │ PRIMARY: AssemblyAI API                ││
│  │ - Upload audio file                    ││
│  │ - POST /api/transcribe                 ││
│  │ - Poll for completion                  ││
│  │ - High accuracy (95%+)                 ││
│  └────────────────┬───────────────────────┘│
│                   │                        │
│  ┌────────────────▼───────────────────────┐│
│  │ FALLBACK: Web Speech API transcript   ││
│  │ - Use if AssemblyAI unavailable       ││
│  │ - Already captured during recording   ││
│  └────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  3. VALIDATION                              │
│                                             │
│  Check if transcript contains:             │
│  - "zo" or "zone" or "go" → ✅            │
│  - Nothing detected → ❌                   │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│  4. GAME TRIGGER                            │
│                                             │
│  If validated:                             │
│  - Start counter (0-9999)                  │
│  - User taps to stop at 1111              │
│  - Calculate reward (proximity-based)      │
│  - Submit to /api/quests/complete          │
└─────────────────────────────────────────────┘
```

---

## Recording Flow

### 1. **Start Recording** (`startRecording()`)

**Location**: `apps/web/src/components/QuestAudio.tsx:497`

```typescript
const startRecording = async () => {
  // Check cooldown
  if (!canPlay) {
    alert(`⏳ Quest on Cooldown\n\nNext available in: ${timeRemaining}`);
    return;
  }
  
  // Initialize refs
  setAudioStatus('recording');
  isRecordingRef.current = true;
  transcriptRef.current = { final: '', interim: '' };
  
  // Step 1: Start Web Speech API (real-time transcription)
  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = true;      // Keep listening
  recognition.interimResults = true;  // Get partial results
  recognition.lang = 'en-US';         // English only
  
  // Capture interim results
  recognition.onresult = (event) => {
    const results = Array.from(event.results);
    
    // Separate final and interim transcripts
    const interimTranscript = results
      .filter(r => !r.isFinal)
      .map(r => r[0].transcript)
      .join('');
    
    const finalTranscript = results
      .filter(r => r.isFinal)
      .map(r => r[0].transcript)
      .join('');
    
    transcriptRef.current = {
      interim: interimTranscript,
      final: finalTranscript,
    };
  };
  
  recognition.start();
  speechRecognitionRef.current = recognition;
  
  // Step 2: Start MediaRecorder (audio file capture)
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks: Blob[] = [];
  
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    recordedAudioRef.current = audioBlob;
    
    // Create downloadable URL
    const audioUrl = URL.createObjectURL(audioBlob);
    audioUrlRef.current = audioUrl;
    
    console.log('🎤 💾 Audio file saved!');
    console.log('   - Size:', audioBlob.size, 'bytes');
    console.log('   - Format: WebM audio');
    console.log('   - Duration: ~3 seconds');
  };
  
  mediaRecorder.start();
  mediaRecorderRef.current = mediaRecorder;
  
  // Step 3: Auto-stop after 3 seconds
  timerRef.current = setTimeout(() => {
    stopRecording();
  }, 5000);
};
```

---

### 2. **Stop Recording** (`stopRecording()`)

After 3 seconds, recording stops and transcription begins:

```typescript
const stopRecording = async () => {
  isStoppingRecognitionRef.current = true;
  
  // Stop speech recognition
  if (speechRecognitionRef.current) {
    speechRecognitionRef.current.stop();
  }
  
  // Stop media recorder
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop();
  }
  
  // Clean up timer
  if (timerRef.current) {
    clearInterval(timerRef.current);
  }
  
  setAudioStatus('processing');
  
  // Wait for mediaRecorder.onstop to save the audio blob
  // Then transcription begins...
};
```

---

## Transcription Methods

### Method 1: AssemblyAI API (Primary)

**Location**: `apps/web/src/app/api/transcribe/route.ts`

**Flow**:

```
1. Upload Audio
   POST https://api.assemblyai.com/v2/upload
   Headers: { authorization: ASSEMBLYAI_API_KEY }
   Body: <audio file blob>
   
   Response: { upload_url: "https://cdn.assemblyai.com/..." }

2. Start Transcription
   POST https://api.assemblyai.com/v2/transcript
   Headers: { authorization: ASSEMBLYAI_API_KEY }
   Body: { audio_url: upload_url, language_code: 'en_us' }
   
   Response: { id: "abc123..." }

3. Poll for Results (every 1 second, max 30 attempts)
   GET https://api.assemblyai.com/v2/transcript/{id}
   Headers: { authorization: ASSEMBLYAI_API_KEY }
   
   Response (completed):
   {
     status: "completed",
     text: "zo",
     confidence: 0.95,
     words: [{ text: "zo", start: 0, end: 500, confidence: 0.95 }]
   }
```

**Client-side usage**:

```typescript
const transcribeAudioFile = async (audioBlob: Blob, filename: string) => {
  // Create FormData
  const formData = new FormData();
  formData.append('audio', audioBlob, filename);
  
  // Call Next.js API route
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  
  if (result.success && result.text) {
    return {
      text: result.text,
      confidence: result.confidence || null,
    };
  }
  
  return null;
};
```

**Advantages**:
- ✅ High accuracy (95%+)
- ✅ Works across all browsers
- ✅ Handles noisy environments better
- ✅ Returns confidence scores

**Disadvantages**:
- ❌ Requires API key setup
- ❌ Network latency (1-3 seconds)
- ❌ Costs money (free tier: 5 hours/month)

---

### Method 2: Web Speech API (Fallback)

**Location**: `apps/web/src/components/QuestAudio.tsx` (inline)

**Flow**:

```javascript
const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join('')
    .toLowerCase();
  
  console.log('🗣️ Heard:', transcript);
  
  // Real-time detection
  if (transcript.includes('zo')) {
    startGameLoop();
  }
};

recognition.start();
```

**Advantages**:
- ✅ Real-time (instant feedback)
- ✅ No API key needed
- ✅ No network required
- ✅ Free

**Disadvantages**:
- ❌ Chrome/Safari only (not Firefox)
- ❌ Lower accuracy (~85%)
- ❌ Noisy environment issues
- ❌ No confidence scores

---

## Game Logic Integration

### Validation & Game Trigger

After transcription completes, the system validates and triggers the game:

```typescript
// In mediaRecorder.onstop callback (after 3 seconds):

mediaRecorder.onstop = () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  recordedAudioRef.current = audioBlob;
  
  // PRIMARY: Transcribe with AssemblyAI
  transcribeAudioFile(audioBlob, filename).then((result) => {
    if (result && result.text) {
      const transcriptionText = result.text.toLowerCase();
      transcriptionTextRef.current = transcriptionText;
      
      console.log('✅ AssemblyAI transcription:', transcriptionText);
      console.log('   Confidence:', result.confidence);
      
      // Validate: Check if transcript contains trigger words
      if (
        transcriptionText.includes('zo') || 
        transcriptionText.includes('zone') || 
        transcriptionText.includes('go')
      ) {
        console.log('✅ "Zo" detected! Starting game...');
        transcriptionValidatedRef.current = true;
        
        // Change UI state
        setAudioStatus('game1111');
        
        // Game will auto-start via Game1111 component
      } else {
        console.log('❌ "Zo" not detected in transcription');
        alert('❌ No "Zo" detected. Please try again!');
        setAudioStatus('idle');
      }
    } else {
      console.log('⚠️ No AssemblyAI transcription, trying fallback...');
      
      // FALLBACK: Use Web Speech API transcript
      const fallbackTranscript = transcriptRef.current.final.trim().toLowerCase();
      
      if (
        fallbackTranscript.includes('zo') || 
        fallbackTranscript.includes('zone') || 
        fallbackTranscript.includes('go')
      ) {
        console.log('✅ Fallback: "Zo" detected in Web Speech API!');
        transcriptionValidatedRef.current = true;
        setAudioStatus('game1111');
      } else {
        console.log('❌ No "Zo" detected in fallback either');
        alert('❌ Transcription failed. Please try again!');
        setAudioStatus('idle');
      }
    }
  }).catch((error) => {
    console.error('❌ AssemblyAI transcription error:', error);
    
    // FALLBACK on error
    const fallbackTranscript = transcriptRef.current.final.trim().toLowerCase();
    
    if (
      fallbackTranscript.includes('zo') || 
      fallbackTranscript.includes('zone') || 
      fallbackTranscript.includes('go')
    ) {
      console.log('✅ Fallback: "Zo" detected!');
      transcriptionValidatedRef.current = true;
      setAudioStatus('game1111');
    } else {
      console.log('❌ No "Zo" detected in fallback');
      alert('❌ Transcription failed. Please try again!');
      setAudioStatus('idle');
    }
  });
};
```

### Game1111 Component

Once validation passes, the Game1111 component takes over:

**Location**: `apps/web/src/hooks/useGame1111Engine.ts`

```typescript
export function useGame1111Engine({ onComplete, onExit }) {
  const [phase, setPhase] = useState<GamePhase>('LOADING');
  const [counter, setCounter] = useState(0);
  
  // Start game loop when validation passes
  const startGameLoop = useCallback(() => {
    setPhase('PLAYING');
    startTimeRef.current = performance.now();
    isPlayingRef.current = true;
    
    const gameLoop = (currentTime: number) => {
      if (!isPlayingRef.current) return;
      
      const elapsed = currentTime - startTimeRef.current;
      const progress = (elapsed / GAME_DURATION_MS) % 1; // Loop 0-1
      const newCounter = Math.floor(progress * MAX_COUNTER_VALUE); // 0-9999
      
      setCounter(newCounter);
      
      requestRef.current = requestAnimationFrame(gameLoop);
    };
    
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);
  
  // User taps to stop
  const handleTap = useCallback(() => {
    if (phase !== 'PLAYING') return;
    
    stopGameLoop();
    
    const finalScore = counter;
    const proximity = Math.abs(TARGET_VALUE - finalScore); // Distance from 1111
    
    // Calculate reward (closer = more tokens)
    const tokensEarned = calculateReward(proximity);
    
    setScore(finalScore);
    setTokensEarned(tokensEarned);
    setPhase('RESULT');
    
    // Submit to backend
    onComplete?.({ score: finalScore, tokens: tokensEarned });
  }, [counter, phase]);
  
  return {
    phase,
    counter,
    handleTap,
    startGameLoop,
  };
}
```

---

## Code Reference

### Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/components/QuestAudio.tsx` | Main component (recording UI & logic) |
| `apps/web/src/hooks/useGame1111Engine.ts` | Game engine (counter logic) |
| `apps/web/src/app/api/transcribe/route.ts` | Transcription API (AssemblyAI) |

### Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `startRecording()` | QuestAudio.tsx:497 | Start 5-second voice recording |
| `stopRecording()` | QuestAudio.tsx:~ | Stop recording and begin transcription |
| `transcribeAudioFile()` | QuestAudio.tsx:450 | Call /api/transcribe with audio blob |
| `POST /api/transcribe` | api/transcribe/route.ts:17 | AssemblyAI transcription API |
| `transcribeWithAssemblyAI()` | api/transcribe/route.ts:70 | AssemblyAI upload → transcribe → poll |
| `startGameLoop()` | useGame1111Engine.ts | Start counter animation |
| `handleTap()` | useGame1111Engine.ts | Stop counter and calculate score |

### State Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `audioStatus` | State | 'idle' \| 'recording' \| 'processing' \| 'game1111' |
| `isRecordingRef` | Ref | Track if actively recording |
| `transcriptRef` | Ref | Store Web Speech API transcript |
| `recordedAudioRef` | Ref | Store audio blob for transcription |
| `audioUrlRef` | Ref | Audio file URL for playback/download |
| `transcriptionValidatedRef` | Ref | Whether "Zo" was detected |
| `speechRecognitionRef` | Ref | Web Speech API instance |
| `mediaRecorderRef` | Ref | MediaRecorder instance |

---

## Setup & Configuration

### 1. AssemblyAI Setup (Recommended)

**Get API Key**:
1. Sign up at https://www.assemblyai.com/
2. Get API key from dashboard (free tier: 5 hours/month)
3. Add to `.env.local`:

```bash
ASSEMBLYAI_API_KEY=your_api_key_here
```

**Test**:
```bash
curl -X POST http://localhost:3000/api/transcribe \
  -F "audio=@test.wav"
```

### 2. Web Speech API (Fallback)

**Browser Support**:
- ✅ Chrome (Desktop & Android)
- ✅ Safari (iOS & macOS)
- ✅ Edge
- ❌ Firefox (not supported)

**No setup required** - works out of the box!

### 3. Microphone Permissions

**Request on mount**:
```typescript
useEffect(() => {
  const checkPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionState(result.state);
    } catch {
      setPermissionState('prompt');
    }
  };
  
  checkPermission();
}, []);
```

**Handle denied**:
```typescript
if (permissionState === 'denied') {
  return (
    <div>
      ❌ Microphone access denied
      <button onClick={() => window.location.reload()}>
        Enable Microphone
      </button>
    </div>
  );
}
```

---

## Failure Flow - When "zo" Is NOT Recognized

### What Happens When Validation Fails?

The system has **multiple validation checkpoints** to ensure "zo" is detected. Here's what happens at each failure point:

---

### Scenario 1: AssemblyAI Transcribes, But No "zo" Found

**Flow:**
1. ✅ Recording completes (3 seconds)
2. ✅ Audio sent to AssemblyAI API
3. ✅ Transcription returns successfully
4. ❌ Validation: `transcribedText.includes('zo')` returns `false`

**What the user sees:**

```
❌ Didn't hear "zo"

You said: "hello world"

Try: "zo" or "zo zo"
```

**Console logs:**

```javascript
🎤 ========================================
🎤 📝 ASSEMBLYAI TRANSCRIPTION (PRIMARY)
🎤 ========================================
🎤 📄 Transcribed Text: hello world
🎤 📊 Confidence: 95.3%
🎤 ✅ Using AssemblyAI as primary transcription source
🎤 🔍 Validation: ❌ FAILED
🎤   Looking for: "zo" anywhere in the text
🎤   Found "zo": false
🎤   Full text: hello world
🎤 ❌ Validation failed! No "zo" found in transcription.
```

**What happens next:**
- `setAudioStatus('idle')` - Returns to idle state
- `setRecordingDuration(0)` - Resets duration
- User can immediately try again by clicking the microphone button

---

### Scenario 2: AssemblyAI Not Configured → Web Speech API Fallback (No "zo")

**Flow:**
1. ✅ Recording completes (3 seconds)
2. ❌ AssemblyAI API returns 503 (not configured)
3. ⚠️ System falls back to Web Speech API
4. ✅ Web Speech API has transcript
5. ❌ Validation: `fallbackText.includes('zo')` returns `false`

**What the user sees:**

```
❌ Didn't hear "zo"

You said: "hello there"

Try: "zo" or "zo zo"
```

**Console logs:**

```javascript
🎤 ⚠️ ASSEMBLYAI NOT CONFIGURED - FALLING BACK TO WEB SPEECH API
🎤 ⚠️ AssemblyAI (primary) is not set up.
🎤 🔄 Falling back to Web Speech API (secondary) for validation.

🎤 📱 Web Speech API transcript (fallback): hello there
🎤 🔍 Fallback Validation: ❌ FAILED
🎤   Looking for: "zo" anywhere in the text
🎤   Found "zo": false
🎤 ⚠️ Web Speech API detected: hello there
🎤 ❌ But no "zo" found in text
```

**What happens next:**
- Returns to idle state
- User can try again immediately

---

### Scenario 3: No Transcription Detected At All

**Flow:**
1. ✅ Recording completes (3 seconds)
2. ❌ AssemblyAI returns empty/null text
3. ❌ Web Speech API also has no transcript

**What the user sees:**

```
❌ Couldn't hear you

Speak closer to the mic and say "zo"
```

**Common causes:**
- User didn't speak during the 3 seconds
- Microphone volume too low
- Background noise too loud
- Microphone permissions denied after initial approval

---

### Scenario 4: Both Systems Fail (Transcription Error)

**Flow:**
1. ✅ Recording completes (3 seconds)
2. ❌ AssemblyAI returns an error (network, API error, etc.)
3. ⚠️ Falls back to Web Speech API
4. ❌ Web Speech API also has no useful transcript

**What the user sees:**

```
❌ Couldn't hear you

Speak closer to the mic and say "zo"
```

---

### Recovery Mechanism

**Key behavior: Automatic state reset**

```typescript
// When validation fails, the component automatically resets:
transcriptionValidatedRef.current = false;  // Mark as invalid
setAudioStatus('idle');                     // Return to idle
setRecordingDuration(0);                    // Reset duration counter
```

**This means:**
- ✅ User can immediately try again
- ✅ No page refresh needed
- ✅ No manual state reset required
- ✅ Microphone button becomes clickable again

---

### Validation Logic (Simple & Flexible)

```typescript
// Current validation (VERY permissive):
const containsZo = transcribedText.toLowerCase().includes('zo');

// ✅ Accepts:
'zo'           → true
'mozo'         → true  
'fozo'         → true
'zo zo'        → true
'zo zo zo'     → true
'amazing zoo'  → true  (contains 'zo' from 'zoo')
'frozen'       → true  (contains 'zo')
'arizona'      → true  (contains 'zo')
'zone'         → true  (contains 'zo')
'ozone'        → true  (contains 'zo')

// ❌ Rejects:
'hello'        → false
'world'        → false
'test'         → false
```

**Note:** The validation is now **extremely flexible** - ANY word containing the substring "zo" will pass!

---

### User Experience Summary

| Scenario | Primary (AssemblyAI) | Fallback (Web Speech) | User Impact | Recovery |
|----------|---------------------|----------------------|-------------|----------|
| **Happy Path** | ✅ "zo" found | N/A | Success! Game starts | N/A |
| **No "zo" detected** | ✅ Transcribed, ❌ No "zo" | N/A | Alert shows what was heard | Instant retry |
| **AssemblyAI down** | ❌ Not configured | ✅ "zo" found | Success with fallback! | N/A |
| **AssemblyAI down + No "zo"** | ❌ Not configured | ✅ Transcribed, ❌ No "zo" | Alert shows what was heard | Instant retry |
| **Complete silence** | ❌ Empty | ❌ Empty | Alert: "Could not detect voice" | Instant retry |
| **Both systems error** | ❌ Error | ❌ Error | Alert with error message | Instant retry |

---

## Debugging

### Enable Console Logs

The system has extensive logging. Check console for:

```
🎤 Starting voice recording - waiting 3 seconds for you to speak...
🎙️ Microphone active
🗣️ Heard: zo
🎤 💾 Audio file saved!
   - Size: 54321 bytes (53.05 KB)
   - Format: WebM audio
   - Duration: ~5 seconds
🎤 📝 Starting audio transcription...
🎤 🎯 PRIMARY: Starting AssemblyAI transcription...
✅ AssemblyAI transcription: zo
   Confidence: 0.95
✅ "Zo" detected! Starting game...
```

### Download Audio File

Audio is stored in `audioUrlRef.current`:

```typescript
// Add download button (for debugging)
<a 
  href={audioUrlRef.current} 
  download={`voice-recording-${new Date().toISOString()}.webm`}
>
  Download Recording
</a>
```

### Test Transcription Locally

```bash
# Record audio
ffmpeg -f avfoundation -i ":0" -t 5 test.wav

# Test API
curl -X POST http://localhost:3000/api/transcribe \
  -F "audio=@test.wav"
```

---

## Troubleshooting

### Issue: "Microphone access denied"

**Solution**: 
1. Check browser permissions (Settings → Privacy → Microphone)
2. Reload page and re-approve
3. Ensure HTTPS (required for getUserMedia on non-localhost)

---

### Issue: "Transcription service not configured"

**Solution**:
```bash
# Add to .env.local
ASSEMBLYAI_API_KEY=your_key_here

# Restart dev server
pnpm dev
```

---

### Issue: "No 'Zo' detected" (but you said it clearly)

**Possible causes**:
1. **Background noise** - Try quieter environment
2. **Microphone quality** - Use better microphone
3. **Accent/pronunciation** - Try "zone" or "go" instead
4. **Recording too short** - Speak within the 3 seconds

**Debug**:
- Download the audio file and listen to it
- Check console logs for transcript: `🗣️ Heard: ...`
- Try with AssemblyAI enabled for better accuracy

---

### Issue: Web Speech API not working

**Check**:
1. Browser support (Chrome/Safari only)
2. HTTPS connection (required)
3. Microphone permissions granted
4. Not in Firefox (not supported)

**Fallback**: AssemblyAI will still work!

---

## Performance Optimization

### P0-3: Use requestAnimationFrame for counter

Instead of `setInterval`, use `requestAnimationFrame` for smooth 60fps:

```typescript
const gameLoop = (currentTime: number) => {
  const elapsed = currentTime - startTimeRef.current;
  const progress = (elapsed / GAME_DURATION_MS) % 1;
  const newCounter = Math.floor(progress * MAX_COUNTER_VALUE);
  
  setCounter(newCounter);
  
  requestRef.current = requestAnimationFrame(gameLoop);
};
```

### P0-5: Double-click protection

Prevent multiple submissions:

```typescript
const isSubmittingRef = useRef(false);

const handleTap = () => {
  if (isSubmittingRef.current) return;
  
  isSubmittingRef.current = true;
  // ... submit logic
};
```

---

## Future Improvements

1. **Add OpenAI Whisper API** as alternative to AssemblyAI
2. **Support multiple languages** (currently English only)
3. **Add voice commands** for game controls ("stop", "reset")
4. **Implement real-time waveform visualization**
5. **Add noise cancellation** using Web Audio API
6. **Cache transcriptions** to avoid re-processing

---

**Last Updated**: November 22, 2025  
**Maintained By**: Zo World Development Team  
**Status**: ✅ Production Ready

