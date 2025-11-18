# AssemblyAI Setup Verification

## ✅ API Key Added

You've added the AssemblyAI API key. Here's how to verify it's working:

---

## 🔍 Verification Steps

### 1. **Check Your .env File**

Make sure the key is in `apps/web/.env` or `apps/web/.env.local`:

```bash
# In apps/web/.env or apps/web/.env.local
ASSEMBLYAI_API_KEY=your_actual_api_key_here
```

**Important:** 
- No quotes around the key value
- No spaces around the `=` sign
- The key should start with something like `a1b2c3d4...`

### 2. **Restart Dev Server** ⚠️ CRITICAL

**You MUST restart your Next.js dev server** for environment variables to load:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd apps/web
pnpm dev
# or
npm run dev
```

### 3. **Test the Voice Feature**

1. Start the quest (onboarding or from dashboard)
2. Grant microphone permission
3. Say **"Zo Zo Zo"** clearly
4. Wait 5 seconds for recording
5. **Check the console** for transcription results

---

## 🎯 Expected Console Output (With AssemblyAI)

When AssemblyAI is working, you should see:

```
🎤 📝 Starting audio transcription...
🎤 Transcribing audio file: { name: 'voice-recording-...', size: 87432, type: 'audio/webm' }
✅ Audio uploaded to AssemblyAI: https://cdn.assemblyai.com/...
📝 Transcription started, ID: abc123xyz
⏳ Transcription in progress... (1/30)
⏳ Transcription in progress... (2/30)
✅ Transcription completed!
🎤 📄 Transcribed Text: zo zo zo
🎤 📊 Confidence: 95.2%
🎤 ✅ Validation passed! Proceeding to success state...
```

---

## 🐛 Troubleshooting

### If you still see "Transcription service not configured":

1. **Check the key is correct:**
   ```bash
   # In apps/web directory
   grep ASSEMBLYAI_API_KEY .env
   ```

2. **Verify the key format:**
   - Should be a long string (usually 40+ characters)
   - No quotes, no spaces
   - Example: `ASSEMBLYAI_API_KEY=a1b2c3d4e5f6g7h8i9j0...`

3. **Restart the dev server:**
   - Environment variables only load on server start
   - Stop (Ctrl+C) and restart `pnpm dev`

4. **Check server logs:**
   - Look for `🎤 Transcribing audio file:` in server console
   - If you see `Transcription service not configured`, the key isn't loading

### If you see "AssemblyAI upload failed":

- Check your API key is valid at https://www.assemblyai.com/dashboard
- Verify you haven't exceeded free tier limits
- Check your internet connection

### If transcription times out:

- AssemblyAI can take 5-30 seconds
- The system will fall back to Web Speech API if timeout occurs
- Check your internet connection

---

## 🔄 Fallback Behavior

Even with AssemblyAI configured, the system has a smart fallback:

1. **Primary:** AssemblyAI (high accuracy)
2. **Fallback:** Web Speech API (browser-based, real-time)
3. **Validation:** Checks for "zo zo zo" in either transcript

So the voice feature works even if AssemblyAI has issues!

---

## ✅ Success Indicators

You'll know AssemblyAI is working when:

- ✅ Console shows "✅ Audio uploaded to AssemblyAI"
- ✅ Console shows "📝 Transcription started, ID: ..."
- ✅ Console shows "✅ Transcription completed!"
- ✅ You see confidence percentage (e.g., "📊 Confidence: 95.2%")
- ✅ No "not configured" errors

---

## 📝 Next Steps

1. **Restart your dev server** (if you haven't already)
2. **Test the voice feature** with "Zo Zo Zo"
3. **Check the console** for AssemblyAI logs
4. **Verify transcription accuracy** - AssemblyAI should be more accurate than Web Speech API

---

**Need Help?** Check the console logs - they'll tell you exactly what's happening at each step!

