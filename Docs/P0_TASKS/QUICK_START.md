# P0 Tasks - QUICK START GUIDE

**Dev 3 (Bug Squad):** This is YOUR sprint. Do ALL 5 tasks in order.

---

## 📋 Your Mission

Make Game1111 bulletproof for 1000+ users. 9-13 hours total.

---

## 🚀 Task Order

### Day 1 Morning: P0-1 Desktop UI (2-3h)
**Problem:** UI tiny on desktop  
**Fix:** Add responsive breakpoints  
**File:** `QuestAudio.tsx`  
**Search for:** `text-[48px]`, `w-[320px]`, `max-w-[360px]`  
**Add:** `md:text-[64px] lg:text-[80px] xl:text-[96px]` etc  
**Test:** Resize browser, verify scales properly

### Day 1 Afternoon: P0-2 Network Retry (3-4h)
**Problem:** Network failure = lost tokens  
**Fix:** Offline queue + retry  
**Files:** Create `apps/web/src/lib/questQueue.ts` + update `QuestAudio.tsx`  
**Key code:**
```typescript
// questQueue.ts - localStorage queue with retry logic
export function addToQueue(data) { /* save to localStorage */ }
export async function processQueue() { /* retry with backoff */ }

// QuestAudio.tsx - wrap API call
if (networkFails) {
  addToQueue(completionData);
  processQueue(); // retry automatically
}
```
**Test:** Go offline, complete quest, come online, verify sync

### Day 1 Evening: P0-5 Double-Click (1h)
**Problem:** Double-click = duplicate tokens  
**Fix:** Add submission guard  
**File:** `QuestAudio.tsx` handleStop function  
**Add:**
```typescript
const isSubmittingRef = useRef(false);

const handleStop = () => {
  if (isSubmittingRef.current) return; // ✅ Guard
  isSubmittingRef.current = true;
  
  try {
    // ... existing code ...
  } finally {
    isSubmittingRef.current = false;
  }
};
```
**Test:** Spam click stop button, verify only 1 API call

---

### Day 2 Morning: P0-3 Performance (2-3h)
**Problem:** 1000 renders/sec = lag  
**Fix:** RAF + direct DOM  
**File:** `QuestAudio.tsx`  
**Replace:**
```typescript
// OLD: setState every 1ms
const [counter, setCounter] = useState(0);
setInterval(() => setCounter(prev => prev + 1), 1);

// NEW: ref + RAF
const counterRef = useRef(0);
const counterDisplayRef = useRef<HTMLDivElement>(null);

requestAnimationFrame(() => {
  counterRef.current++;
  counterDisplayRef.current.textContent = counterRef.current.toString();
});
```
**Test:** Check DevTools performance tab, verify 60fps

### Day 2 Afternoon: P0-4 Tab Visibility (1-2h)
**Problem:** Users cheat by tab switching  
**Fix:** Auto-pause on tab hidden  
**File:** `QuestAudio.tsx`  
**Add:**
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      setIsPaused(true); // Pause game
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```
**Test:** Switch tabs, verify game pauses

---

## ✅ Completion Checklist

- [ ] P0-1: Desktop UI scales beautifully
- [ ] P0-2: Network failures don't lose tokens
- [ ] P0-3: Counter runs smooth 60fps
- [ ] P0-4: Tab switch pauses game
- [ ] P0-5: Double-click doesn't duplicate

---

## 🚨 If You Get Stuck

1. Re-read the guide (answer is probably there)
2. Check console for errors
3. Compare your code line-by-line with guide
4. Ask in #dev-help with screenshot

---

## 🎯 Success

When done:
- ✅ Game1111 handles 1000+ concurrent users
- ✅ Zero data loss
- ✅ Smooth performance
- ✅ Fair gameplay
- ✅ Perfect data integrity

**Then: SHIP IT!** 🚀
