# Voice Quest (One-time) — Feature Spec

**Version**: 1.0  
**Owner**: Game Systems / Audio  
**Last Updated**: 2025-11-13  
**Status**: 🔮 Planned

---

## Purpose

A one-time voice quest that asks a user to record a short audio clip as proof of presence, intention, or creative expression.

**Use Cases**:
- Onboarding tutorial quest
- Creative expression challenges
- Event participation proof
- Node activation rituals

## UX Flow

### 1. Quest Initiation
User taps "Voice Quest" from quest list or map marker

### 2. Permission Request
App requests microphone permission
- First-time users see explanation: "Record a short audio clip to complete this quest"
- If denied, show fallback option or cancel

### 3. Recording Interface
**Duration**: 10-30 seconds (configurable per quest)

**UI Elements**:
- Large "Record" button (red dot)
- Timer countdown display
- Real-time waveform visualization
- Cancel button

**Recording Flow**:
```
Tap Record → Countdown (3, 2, 1) → Recording starts → Auto-stop at time limit → Show preview
```

### 4. Preview & Review
After recording stops:
- Show waveform of full recording
- Play button to review
- Re-record button (retry)
- Submit button (confirm)

### 5. Submission
- Upload to secure storage (S3/IPFS)
- Show progress bar
- Generate audio reference hash
- Submit proof to `/api/quests/:id/submit`

### 6. Feedback
- Immediate success message
- Vibe Score delta display
- Reward animation (tokens + reputation)
- Next quest suggestion

---

## API

### Submit Voice Quest
```typescript
POST /api/quests/:id/submit

Request:
{
  user_id: string;
  quest_id: string;
  proof: {
    ts: string;                    // ISO timestamp
    source: 'webapp' | 'mobile';
    payload: {
      audio_ref: string;           // S3/IPFS reference
      duration_seconds: number;
      audio_hash: string;          // SHA256 of audio file
      waveform_data?: number[];    // For UI visualization
    };
  };
  metadata: {
    quest_title: string;
    device_type: string;
    browser?: string;
  };
}

Response:
{
  success: true;
  data: {
    completion_id: string;
    rewards: {
      zo_tokens: number;
      reputation: {
        explorer: number;
      };
    };
    vibe_delta: {
      creative_output: 0.3,
      behavior_recent: 0.1
    };
  };
}
```

---

## Audio Storage & Privacy

### Storage Strategy

**Short-term (7 days)**:
- Store full audio file in S3
- Path: `audio/voice-quests/{user_id}/{quest_id}/{timestamp}.webm`
- Access: Private, signed URLs only

**Long-term (permanent)**:
- Store audio reference hash in database
- Store derived features (duration, waveform summary)
- Delete raw audio after 7 days (GDPR compliance)

### Privacy Rules

1. **User consent required** before first recording
2. **Opt-out option** - Users can disable voice quests entirely
3. **Automatic deletion** - Raw audio deleted after 7 days
4. **No transcription** - Audio is not transcribed or analyzed for content (v1.0)
5. **Secure storage** - S3 bucket with encryption at rest

### Audio Format
- **Codec**: WebM (Opus codec) for web, AAC for mobile
- **Sample Rate**: 48 kHz
- **Bitrate**: 128 kbps
- **Channels**: Mono
- **Max File Size**: 2 MB (30 seconds)

---

## Verification

### Option A: Automated (v1.0)
- **Accept all submissions** as valid
- Basic checks:
  - Audio file exists and is accessible
  - Duration within allowed range (10-30 seconds)
  - File size < 2 MB
  - Timestamp is recent (within 5 minutes)

### Option B: Audio Fingerprinting (v2.0)
- **Noise profile detection** - Reject silent/empty recordings
- **Duplicate detection** - Check if audio matches previous submissions
- **Speech detection** - Verify audio contains human voice (optional)

### Option C: Human Moderation (v2.0)
- **Flagging system** - AI flags suspicious submissions
- **Moderator review** - Human listens and approves/rejects
- **Appeal process** - Users can appeal rejections

---

## Waveform Visualization

### Real-time During Recording
```typescript
// Using Web Audio API
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

function drawWaveform() {
  analyser.getByteTimeDomainData(dataArray);
  // Draw to canvas
  requestAnimationFrame(drawWaveform);
}
```

### Post-Recording Preview
Store waveform peaks for display:
```typescript
interface WaveformData {
  peaks: number[];      // 100-200 data points
  duration: number;
  sample_rate: number;
}
```

---

## Telemetry

Track these events:
- `voice_quest_start` - User initiates recording
- `voice_quest_permission_granted` - Mic permission granted
- `voice_quest_permission_denied` - Mic permission denied
- `voice_quest_recording_start` - Recording begins
- `voice_quest_recording_stop` - Recording ends
- `voice_quest_submit` - User submits recording
- `voice_quest_complete` - Quest verified and rewarded

**Event schema**: `{ ts, userId, questId, action, duration?, fileSize?, error? }`

---

## Acceptance Criteria

- [ ] User can initiate voice quest
- [ ] Microphone permission requested correctly
- [ ] Recording captures 10-30 seconds
- [ ] Real-time waveform displays during recording
- [ ] User can preview and re-record
- [ ] Audio uploads to S3 successfully
- [ ] Quest completion triggers rewards
- [ ] Raw audio deleted after 7 days

---

## Tests

### Unit Tests
```typescript
describe('Voice Quest', () => {
  it('requests microphone permission', async () => {
    const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
    expect(permission).toBeDefined();
  });
  
  it('records audio for 10 seconds', async () => {
    const recording = await recordAudio(10);
    expect(recording.duration).toBeCloseTo(10, 1);
  });
  
  it('uploads audio to S3', async () => {
    const audioBlob = createMockAudioBlob();
    const result = await uploadAudio(audioBlob, userId, questId);
    expect(result.audio_ref).toMatch(/^audio\/voice-quests\//);
  });
});
```

### Integration Tests
```typescript
describe('Voice Quest Flow', () => {
  it('completes full voice quest submission', async () => {
    // Mock microphone
    mockMediaDevices();
    
    // Start recording
    await startRecording();
    await sleep(10000); // 10 seconds
    await stopRecording();
    
    // Submit
    const result = await submitVoiceQuest(userId, questId, audioBlob);
    expect(result.success).toBe(true);
    expect(result.data.rewards.zo_tokens).toBeGreaterThan(0);
    
    // Verify storage
    const audioExists = await checkS3FileExists(result.audio_ref);
    expect(audioExists).toBe(true);
  });
  
  it('deletes audio after 7 days', async () => {
    // Submit voice quest
    const result = await submitVoiceQuest(userId, questId, audioBlob);
    
    // Fast-forward 7 days (mock)
    await mockTimeTravel(7, 'days');
    
    // Run cleanup job
    await runAudioCleanupJob();
    
    // Verify file deleted
    const audioExists = await checkS3FileExists(result.audio_ref);
    expect(audioExists).toBe(false);
    
    // Verify hash still exists
    const proof = await getQuestProof(result.completion_id);
    expect(proof.audio_hash).toBeDefined();
  });
});
```

---

## Browser Compatibility

### Web Audio API Support
- ✅ Chrome 23+
- ✅ Firefox 25+
- ✅ Safari 14.1+
- ✅ Edge 79+

### MediaRecorder API Support
- ✅ Chrome 47+
- ✅ Firefox 25+
- ✅ Safari 14.1+
- ✅ Edge 79+

### Fallback for Unsupported Browsers
Show message: "Voice quests require a modern browser with audio recording support. Please use Chrome, Firefox, Safari, or Edge."

---

## Work Order Snippet

```markdown
# WO-XXX: Implement Voice Quest Recording & Submission

## Scope
- Build voice recording UI component
- Integrate Web Audio API for recording
- Implement real-time waveform visualization
- Set up S3 bucket for audio storage
- Create audio upload service
- Implement `/api/quests/:id/submit` for voice proofs
- Add 7-day cleanup cron job

## Files to Create
- `apps/web/src/components/quests/VoiceQuestRecorder.tsx`
- `apps/web/src/hooks/useAudioRecorder.ts`
- `apps/web/src/lib/audioUpload.ts`
- `apps/web/src/lib/waveform.ts`
- `scripts/cleanup-voice-recordings.js` (cron job)
- `migrations/XXX_voice_quest_audio_refs.sql`

## Infrastructure
- Create S3 bucket: `zohm-voice-quests-{env}`
- Set up bucket lifecycle policy (7-day expiration)
- Configure CORS for browser uploads

## Tests
- Unit tests for recording hooks
- Integration test for full submission flow
- Cleanup job test
- Browser compatibility tests

## Acceptance Criteria
- Recording works in Chrome, Firefox, Safari
- Waveform displays in real-time
- Audio uploads successfully
- 7-day cleanup job runs correctly
- Privacy policy updated with audio recording info
```

---

## Related Documentation

- `Docs/QUESTS_SYSTEM.md` - Quest mechanics overview
- `Docs/API_CONTRACTS.md` - API endpoint contracts
- `Docs/VIBE_SCORE.md` - Vibe Score delta calculation
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MediaRecorder API: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder

