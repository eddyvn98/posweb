# 🧪 EPIC 9 – TEST CASE BẮT BUỘC (Mandatory Test Cases)

## Overview
Epic 9 defines two critical test scenarios that must be validated before production:
1. **TASK 9.1** - Sales Stress Test: 100 offline sales sync integrity
2. **TASK 9.2** - Mobile UX Test: Keyboard handling and rapid scanning

---

# TASK 9.1 – Sales Stress Test

## Objective
Verify that the system can handle 100 offline sales without data loss and maintain FIFO order during sync.

## Test Scenario
- **Offline Environment**: Sales created while not connected
- **Load**: 100 transactions with varying quantities and payment methods
- **Acceptance**: ✅ No lost sales ✅ Correct order maintained ✅ All amounts intact

## Pre-Test Checklist
- [ ] Browser DevTools open (Console tab)
- [ ] Network tab open to monitor data sync
- [ ] Supabase dashboard open in another tab
- [ ] Fresh database (or known baseline count)
- [ ] IndexedDB cleared (run: `await clearAllStores()` in console)

## Step-by-Step Execution

### Method 1: Using Test Utilities (Programmatic)

1. **Open Browser Console** and run:
```javascript
import { testStress } from './src/lib/testUtils.js'

// Get shop ID and user ID from current app state
const shopId = '...' // From Auth context
const userId = '...' // From Auth context
const pushSalesFunc = pushSales // From SyncContext

// Run full stress test
const results = await testStress.runFullTest(shopId, userId, pushSalesFunc, 100)

// View results
console.table(results.stages)
console.log(JSON.stringify(results, null, 2))
```

**This will:**
- ✅ Generate 100 random sales
- ✅ Save to IndexedDB (measures time)
- ✅ Verify FIFO order locally
- ✅ Sync to Supabase
- ✅ Verify data integrity (no loss, correct amounts)

### Method 2: Manual Testing

#### Step 1: Generate Test Sales (5 min)
1. Go to Sales page
2. Manually create 100 sales OR use quick-add repeatedly
3. Use DevTools to monitor IndexedDB filling up:
   ```javascript
   // In console
   const db = await indexedDB.databases()
   db.forEach(d => console.log(d.name))
   ```

#### Step 2: Verify Local Storage (2 min)
1. Go to DevTools → Application → IndexedDB → pos_db → sales_queue
2. Count rows (should be 100)
3. Check timestamps are recent
4. **Verify order**: Oldest sale should be first (FIFO)

#### Step 3: Disable Internet (1 min)
1. DevTools → Network → Offline checkbox
2. Create 5 more sales while offline
3. Verify sales still save locally
4. Try to sync manually - should fail gracefully

#### Step 4: Re-enable Internet & Sync (5 min)
1. Check DevTools → Network → Online
2. App should auto-sync
3. Watch Network tab:
   - POST `/rest/v1/sales` (multiple batches)
   - POST `/rest/v1/sale_items`
4. Verify no errors in Console

#### Step 5: Verify Server Data (5 min)
1. Open Supabase dashboard
2. Go to SQL Editor
3. Run:
```sql
SELECT COUNT(*) FROM sales WHERE shop_id = 'YOUR_SHOP_ID' AND created_at > NOW() - INTERVAL '1 hour'
```
   - Should show: **100+ sales**

4. Run to check order:
```sql
SELECT code, total_amount, created_at 
FROM sales 
WHERE shop_id = 'YOUR_SHOP_ID'
ORDER BY created_at DESC
LIMIT 10
```
   - Verify codes match your test sales
   - Verify amounts are correct

#### Step 6: Check Cart Integrity (2 min)
1. Go to Reports page
2. Select today's month
3. Revenue Report should show:
   - Total matches all 100 sales
   - No duplicate transactions
   - All payment methods recorded

## Expected Results

### ✅ PASS Criteria
- [x] All 100 sales synced (count matches)
- [x] No sales missing or duplicated
- [x] Total amount = sum of all individual sales
- [x] FIFO order preserved (TEST-00001 before TEST-00002)
- [x] Payment methods recorded correctly
- [x] Sync completes without errors

### ❌ FAIL Criteria
- [x] Any sales missing (count < 100)
- [x] Duplicate transactions in database
- [x] Total amount incorrect
- [x] Sales out of order
- [x] Console errors during sync
- [x] Timeout/connection errors

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Sales not syncing | Clear browser cache, check internet connection |
| Duplicate sales | Clear IndexedDB + Supabase test data, restart |
| Missing sales | Check browser console for errors, verify DB connection |
| Slow performance | Close other tabs, disable extensions, test on fresh browser |

## Test Report Template

```
TEST: Sales Stress Test (9.1)
Date: ___________
Tester: ___________
Environment: [Dev/Staging/Production]
Browser: ___________

RESULTS:
- Total Sales Generated: 100
- Total Sales Synced: ___
- Data Loss: ___
- Order Preserved: [Yes/No]
- Errors: ___________
- Duration: ___ seconds

STATUS: [PASS/FAIL]
Notes: ___________
```

---

# TASK 9.2 – Mobile UX Test

## Objective
Verify that mobile UX remains usable when:
1. **Keyboard opens** - Total price & checkout button stay visible
2. **Rapid scanning** - No UI lag, scans process smoothly

## Pre-Test Checklist
- [ ] Mobile device or Chrome DevTools mobile emulation
- [ ] Network throttling set to "Fast 3G"
- [ ] Touch simulation enabled (if desktop testing)
- [ ] Sales page open with products loaded
- [ ] Cart ready for testing

## Test 1: Keyboard Overlay

### Step 1: Mobile Setup (2 min)
1. Open app on real mobile device OR
2. Open Chrome DevTools → Toggle Device Toolbar
3. Select device (iPhone 12 Pro recommended)
4. Rotate to Portrait mode

### Step 2: Open Keyboard (3 min)
1. Go to Sales page
2. Tap on "Tìm tên hoặc quét mã SP..." input field
3. Keyboard should open
4. **CRITICAL CHECK**: Verify:
   - [ ] Total price still visible
   - [ ] "HOÀN TẤT" (Checkout) button still visible
   - [ ] No overlap with form fields
   - [ ] Scroll works smoothly

### Step 3: Type While Keyboard Open (2 min)
1. Type product name or barcode
2. Verify:
   - [ ] Results display below input
   - [ ] Total price updates in real-time
   - [ ] No jank/lag when typing

### Step 4: Add Items While Keyboard Open (3 min)
1. Tap a product result
2. Tap "+" in cart area without closing keyboard
3. Verify:
   - [ ] Item adds to cart
   - [ ] Total updates
   - [ ] Keyboard stays open (doesn't auto-close)
   - [ ] Can immediately add another item

### Step 5: Checkout with Keyboard Open (3 min)
1. Without closing keyboard, tap "HOÀN TẤT" button
2. Verify:
   - [ ] Button is accessible (not hidden)
   - [ ] Modal opens properly
   - [ ] Keyboard closes
   - [ ] Can select payment method

## Expected Results

### ✅ PASS Criteria
- [x] Total price visible with keyboard open
- [x] Checkout button accessible (not obscured)
- [x] No UI overlap or text cutoff
- [x] Smooth scrolling with keyboard
- [x] Keyboard auto-closes on checkout modal

### ❌ FAIL Criteria
- [x] Sticky bar hidden by keyboard
- [x] Button partially or fully obscured
- [x] Text cutoff or overlapped
- [x] Scroll doesn't work smoothly
- [x] Page jumps when keyboard opens/closes

---

## Test 2: Rapid Barcode Scanning

### Step 1: Scan Simulation Setup (2 min)
1. Open Chrome DevTools → Console
2. Paste this script:
```javascript
import { testMobileUX } from './src/lib/testUtils.js'

// Simulate 20 rapid scans
const results = await testMobileUX.simulateRapidScans(
    handleScanResult,  // Your scan handler
    20,                // number of scans
    100                // delay between scans (ms)
)

console.table(results)
```

### Step 2: Manual Rapid Scan Test (5 min)
1. Go to Sales page
2. Have barcode scanner ready (or simulated)
3. Scan 20 products rapidly (one every 100-200ms)
4. Verify:
   - [ ] All items add to cart
   - [ ] No missing scans
   - [ ] UI responsive (not frozen)
   - [ ] Quantities increment correctly
   - [ ] Total price accurate

### Step 3: Performance Monitoring (3 min)
1. DevTools → Performance tab
2. Record while scanning 10 items rapidly
3. Check metrics:
   - [ ] Response time < 100ms per scan
   - [ ] No long-running tasks (> 50ms)
   - [ ] Frame rate stays 60 FPS

## Expected Results

### ✅ PASS Criteria
- [x] All 20 scans processed (none lost)
- [x] Response time < 100ms per scan
- [x] No UI lag/stutter
- [x] Accurate cart totals
- [x] Cart items in correct order

### ❌ FAIL Criteria
- [x] Scans missed or dropped
- [x] Response time > 100ms
- [x] UI freezes/stutters
- [x] Wrong totals
- [x] Items out of order

## Test Report Template

```
TEST: Mobile UX Test (9.2)
Date: ___________
Tester: ___________
Device: [iPhone/Android/Desktop Emulation]
Browser: ___________

KEYBOARD TEST:
- Total visible: [Yes/No]
- Button accessible: [Yes/No]
- No overlap: [Yes/No]
- Smooth scroll: [Yes/No]
  STATUS: [PASS/FAIL]

SCANNING TEST:
- Scans completed: 20/20
- Response time: ___ ms
- No UI lag: [Yes/No]
- Accurate totals: [Yes/No]
  STATUS: [PASS/FAIL]

OVERALL: [PASS/FAIL]
Notes: ___________
```

---

# Test Automation Integration

## Running Tests Programmatically

### Option 1: Browser Console (Interactive)
```javascript
// Copy-paste into DevTools console on the Sales page
import { testStress, testMobileUX } from './src/lib/testUtils.js'

// Stress test
const stressResults = await testStress.runFullTest(shopId, userId, pushSales, 100)

// Rapid scan test
const scanResults = await testMobileUX.simulateRapidScans(handleScanResult, 20, 100)
```

### Option 2: Testing Framework (Future)
```javascript
// Example using Jest (future setup)
import { testStress } from './src/lib/testUtils'

describe('Epic 9 Tests', () => {
  test('100 sales sync without loss', async () => {
    const results = await testStress.runFullTest(...)
    expect(results.stages.integrity.success).toBe(true)
    expect(results.stages.order.orderedCorrectly).toBe(true)
  })

  test('Rapid scans < 100ms response', async () => {
    const results = await testMobileUX.simulateRapidScans(...)
    expect(results.averagePerScan).toBeLessThan(100)
  })
})
```

---

# Acceptance Criteria Checklist

## TASK 9.1 – Sales Stress Test
- [ ] Generated 100 test sales
- [ ] All saved to IndexedDB without error
- [ ] Verified FIFO order locally
- [ ] Synced to Supabase successfully
- [ ] No data loss (count matches)
- [ ] No amount corruption
- [ ] No order corruption
- [ ] Test report completed and signed off

## TASK 9.2 – UX Mobile Test
- [ ] Keyboard test: Total price visible
- [ ] Keyboard test: Checkout button accessible
- [ ] Keyboard test: No UI overlap
- [ ] Scan test: 20/20 scans processed
- [ ] Scan test: Response < 100ms
- [ ] Scan test: UI responsive (no lag)
- [ ] Test report completed and signed off

---

# Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Tester | __________ | __________ | __________ |
| Developer | __________ | __________ | __________ |
| Manager | __________ | __________ | __________ |
