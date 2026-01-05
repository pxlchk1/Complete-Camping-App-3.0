# 🔒 RELEASE CONTRACT - Smoke Test Checklist

> **This is your non-negotiable acceptance test for EVERY change until stability returns.**
> 
> Run this after EVERY code change. If any step fails, **STOP and REVERT immediately**.
> No "we'll fix it later."

---

## Pre-Flight Checks

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npx expo start` bundles successfully
- [ ] App launches on iOS Simulator without crash

---

## 🎯 Core Flow Smoke Test

### 1. Create Trip
- [ ] Tap "New Trip" or "+" button
- [ ] Fill in trip name
- [ ] Select dates
- [ ] Save trip
- [ ] **PASS**: No errors, modal closes

### 2. Trip Shows in List
- [ ] Navigate to My Trips
- [ ] **PASS**: New trip appears in the list with correct name

### 3. Open Trip Details
- [ ] Tap on the trip in the list
- [ ] **PASS**: Trip detail screen opens without crash
- [ ] **PASS**: Trip name and dates display correctly

### 4. Add Destination
- [ ] Tap to add destination/park
- [ ] Select or search for a destination
- [ ] Save/confirm selection
- [ ] **PASS**: Returns to trip details
- [ ] **PASS**: Destination is visible on trip details screen

### 5. Packing List Opens
- [ ] From trip details, tap Packing List
- [ ] **PASS**: Packing list screen opens without crash
- [ ] **PASS**: Can see packing categories/items

---

## ❌ FAILURE PROTOCOL

If ANY step above fails:

1. **STOP** - Do not continue
2. **REVERT** - `git checkout .` or `git reset --hard HEAD~1`
3. **INVESTIGATE** - Identify the breaking change
4. **FIX** - Address root cause before re-attempting
5. **RE-TEST** - Run full smoke test again

---

## ✅ PASS PROTOCOL

If ALL steps pass:

1. **COMMIT** - `git add . && git commit -m "fix: [description]"`
2. **NOTE** - Record what was fixed
3. **CONTINUE** - Proceed to next stabilization task

---

## Version History

| Date | Tester | Result | Notes |
|------|--------|--------|-------|
| 2026-01-04 | - | BASELINE | Created from stable-trips-2026-01-04 |

---

*Created: 2026-01-04*
*Branch: release/stable-trips*
*Tag: stable-trips-2026-01-04*
