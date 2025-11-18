# P0 Tasks - Game1111 Production Hardening

**Last Updated:** 2025-11-17  
**Status:** Ready for Implementation  
**Priority:** 🔴 CRITICAL - Ship Blockers

---

## 📋 Quick Navigation

| Task | Priority | Time | Doc |
|------|----------|------|-----|
| **P0-1** Desktop UI Responsiveness | 🔴 | 2-3h | [Guide](P0-1_DESKTOP_UI_RESPONSIVENESS.md) |
| **P0-2** Network Retry Mechanism | 🔴 | 3-4h | [Guide](P0-2_NETWORK_RETRY_MECHANISM.md) |
| **P0-3** Counter Performance | 🔴 | 2-3h | [Guide](P0-3_COUNTER_PERFORMANCE_OPTIMIZATION.md) |
| **P0-4** Tab Visibility Detection | 🔴 | 1-2h | [Guide](P0-4_TAB_VISIBILITY_DETECTION.md) |
| **P0-5** Double-Click Protection | 🔴 | 1h | [Guide](P0-5_DOUBLE_CLICK_PROTECTION.md) |

**Total Time:** 9-13 hours (1-2 days)

---

## 🎯 What Are These?

5 **CRITICAL bugs** in Game1111 that MUST be fixed before launch:

1. **Desktop UI** - Game is tiny/unusable on desktop (need responsive breakpoints)
2. **Network Retry** - Users lose tokens on network failures (need offline queue)
3. **Performance** - 1000 renders/sec = lag (need requestAnimationFrame)
4. **Anti-Cheat** - Users can cheat via tab switching (need pause detection)
5. **Data Integrity** - Double-clicks cause duplicates (need submission guard)

---

## 🚀 Recommended Order

### Day 1 (6-8h):
1. **P0-1** (2-3h) - Desktop UI → Quick visual win
2. **P0-2** (3-4h) - Network Retry → Prevents data loss  
3. **P0-5** (1h) - Double-Click → Fast integrity fix

### Day 2 (4-5h):
4. **P0-3** (2-3h) - Performance → Smooth 60fps
5. **P0-4** (1-2h) - Tab Visibility → Anti-cheat

---

## 📊 Task Summaries

### P0-1: Desktop UI Responsiveness
**Problem:** UI is 320px on 1920px screens  
**Solution:** Add md:, lg:, xl: breakpoints  
**File:** `apps/web/src/components/QuestAudio.tsx`  
**Changes:** CSS only (~50 lines)

### P0-2: Network Retry Mechanism
**Problem:** Network failure = permanent token loss  
**Solution:** Offline queue + exponential backoff retry  
**Files:** New `questQueue.ts` + update `QuestAudio.tsx`  
**Changes:** ~330 lines total

### P0-3: Counter Performance
**Problem:** 1000 React renders/sec = lag  
**Solution:** RAF + direct DOM updates (no setState)  
**File:** `apps/web/src/components/QuestAudio.tsx`  
**Changes:** ~90 lines

### P0-4: Tab Visibility Detection  
**Problem:** Users can cheat by backgrounding tab  
**Solution:** Auto-pause on tab switch  
**File:** `apps/web/src/components/QuestAudio.tsx`  
**Changes:** ~80 lines

### P0-5: Double-Click Protection
**Problem:** Double-click = duplicate API calls  
**Solution:** isSubmittingRef guard  
**File:** `apps/web/src/components/QuestAudio.tsx`  
**Changes:** ~30 lines

---

## ✅ For Community Developers

Each guide includes:
- ✅ Exact problem description
- ✅ Current code with line numbers
- ✅ Complete solution code (copy-paste)
- ✅ Step-by-step implementation
- ✅ Testing checklist (6-10 tests)
- ✅ Acceptance criteria
- ✅ Common mistakes to avoid

**Impossible to get lost. Just follow the steps.**

---

## 📁 File Structure

```
Docs/P0_TASKS/
├── README.md (this file)
├── P0-1_DESKTOP_UI_RESPONSIVENESS.md
├── P0-2_NETWORK_RETRY_MECHANISM.md
├── P0-3_COUNTER_PERFORMANCE_OPTIMIZATION.md
├── P0-4_TAB_VISIBILITY_DETECTION.md
└── P0-5_DOUBLE_CLICK_PROTECTION.md
```

---

## 🎯 Success = All 5 Complete

When done, Game1111 will:
- ✅ Look beautiful on desktop
- ✅ Never lose user tokens
- ✅ Run smooth 60fps
- ✅ Prevent cheating
- ✅ Have perfect data integrity

**Then: Ship to 1000+ users with confidence!** 🚀

---

**Start:** Pick P0-1 (quickest win)  
**Help:** Read full guide for each task  
**Questions:** Check "Common Mistakes" section first
