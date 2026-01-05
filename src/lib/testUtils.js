/**
 * TEST UTILITIES - EPIC 9
 * Helpers for stress testing and QA verification
 */

/**
 * TASK 9.1: Sales Stress Test
 * Simulate 100 offline sales and verify sync integrity
 */

import { supabase } from '../lib/supabase'
import { saveOfflineSale, getPendingSales, markSaleSynced, initDB } from '../lib/db'

export const testStress = {
    /**
     * Generate 100 random sales with unique data
     */
    generateTestSales: (shopId, count = 100) => {
        const testProducts = [
            { id: '1', name: 'Cà phê đen', price: 12000 },
            { id: '2', name: 'Cà phê sữa', price: 15000 },
            { id: '3', name: 'Trà chanh', price: 10000 },
            { id: '4', name: 'Nước cam', price: 8000 },
            { id: '5', name: 'Bánh mì', price: 15000 },
        ]

        const sales = []
        for (let i = 1; i <= count; i++) {
            const itemCount = Math.floor(Math.random() * 3) + 1
            const items = []
            let totalAmount = 0

            for (let j = 0; j < itemCount; j++) {
                const product = testProducts[Math.floor(Math.random() * testProducts.length)]
                const quantity = Math.floor(Math.random() * 3) + 1
                items.push({
                    product_id: product.id,
                    product_name: product.name,
                    quantity,
                    price: product.price
                })
                totalAmount += product.price * quantity
            }

            sales.push({
                shop_id: shopId,
                code: `TEST-${i.toString().padStart(5, '0')}`,
                total_amount: totalAmount,
                payment_method: Math.random() > 0.5 ? 'cash' : 'transfer',
                sale_date: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
                items,
                test_index: i // Track order
            })
        }

        return sales
    },

    /**
     * Save all test sales to local IndexedDB
     */
    saveTestSales: async (testSales) => {
        console.log(`[TEST] Saving ${testSales.length} test sales to IndexedDB...`)
        const startTime = performance.now()

        try {
            for (const sale of testSales) {
                await saveOfflineSale(sale)
            }

            const endTime = performance.now()
            const duration = (endTime - startTime).toFixed(2)

            console.log(`[TEST] ✅ Saved ${testSales.length} sales in ${duration}ms`)
            return {
                success: true,
                count: testSales.length,
                duration: parseFloat(duration),
                averagePerSale: (parseFloat(duration) / testSales.length).toFixed(2)
            }
        } catch (err) {
            console.error('[TEST] ❌ Error saving test sales:', err)
            throw err
        }
    },

    /**
     * Verify all saved sales are in correct order
     */
    verifyLocalOrder: async () => {
        console.log('[TEST] Verifying order of local sales...')
        const pending = await getPendingSales()

        if (pending.length === 0) {
            console.warn('[TEST] ⚠️ No pending sales found')
            return { success: false, message: 'No pending sales' }
        }

        // Check if test_index is in order (FIFO)
        const orderedCorrectly = pending.every((sale, index) => {
            return sale.test_index === (index + 1)
        })

        const report = {
            success: orderedCorrectly,
            totalPending: pending.length,
            firstSale: pending[0]?.code,
            lastSale: pending[pending.length - 1]?.code,
            orderedCorrectly,
            message: orderedCorrectly ? '✅ All sales in correct FIFO order' : '❌ Sales are out of order!'
        }

        console.log(`[TEST] ${report.message}`)
        return report
    },

    /**
     * Simulate sync process and verify data integrity on server
     */
    simulateSync: async (shopId, user, pushSalesFunction) => {
        console.log('[TEST] Starting sync simulation...')
        const startTime = performance.now()

        try {
            // Count before sync
            const { data: beforeData } = await supabase
                .from('sales')
                .select('id')
                .eq('shop_id', shopId)

            const countBefore = beforeData?.length || 0
            console.log(`[TEST] Sales in DB before sync: ${countBefore}`)

            // Execute sync
            await pushSalesFunction()

            // Wait a moment for DB to settle
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Count after sync
            const { data: afterData } = await supabase
                .from('sales')
                .select('id, code, total_amount, created_at')
                .eq('shop_id', shopId)
                .order('created_at', { ascending: true })

            const countAfter = afterData?.length || 0
            const syncedCount = countAfter - countBefore

            const endTime = performance.now()
            const duration = (endTime - startTime).toFixed(2)

            console.log(`[TEST] Sales in DB after sync: ${countAfter} (+${syncedCount})`)

            return {
                success: syncedCount > 0,
                countBefore,
                countAfter,
                syncedCount,
                duration: parseFloat(duration),
                data: afterData
            }
        } catch (err) {
            console.error('[TEST] ❌ Error during sync simulation:', err)
            throw err
        }
    },

    /**
     * Verify no data loss and correct amounts
     */
    verifyDataIntegrity: (testSales, syncedData) => {
        console.log('[TEST] Verifying data integrity...')

        const issues = []

        // Check count
        if (syncedData.length !== testSales.length) {
            issues.push(`❌ Count mismatch: Expected ${testSales.length}, got ${syncedData.length}`)
        }

        // Check total amounts match
        const testTotalAmount = testSales.reduce((sum, s) => sum + s.total_amount, 0)
        const syncedTotalAmount = syncedData.reduce((sum, s) => sum + s.total_amount, 0)

        if (testTotalAmount !== syncedTotalAmount) {
            issues.push(`❌ Total amount mismatch: Expected ${testTotalAmount}, got ${syncedTotalAmount}`)
        }

        // Check codes exist
        const testCodes = testSales.map(s => s.code)
        const syncedCodes = syncedData.map(s => s.code)

        const missingCodes = testCodes.filter(code => !syncedCodes.includes(code))
        if (missingCodes.length > 0) {
            issues.push(`❌ Missing codes: ${missingCodes.join(', ')}`)
        }

        const report = {
            success: issues.length === 0,
            testCount: testSales.length,
            syncedCount: syncedData.length,
            testTotalAmount,
            syncedTotalAmount,
            issues,
            message: issues.length === 0 ? '✅ All data intact!' : 'Data integrity issues found'
        }

        console.log(`[TEST] ${report.message}`)
        issues.forEach(issue => console.log(issue))

        return report
    },

    /**
     * Complete stress test workflow
     */
    runFullTest: async (shopId, userId, pushSalesFunction, count = 100) => {
        console.log(`\n${'='.repeat(60)}`)
        console.log(`EPIC 9.1 - SALES STRESS TEST (${count} sales)`)
        console.log(`${'='.repeat(60)}\n`)

        const results = {
            timestamp: new Date().toISOString(),
            shopId,
            testCount: count,
            stages: {}
        }

        try {
            // Stage 1: Generate test sales
            console.log('\n[STAGE 1] Generating test sales...')
            const testSales = testStress.generateTestSales(shopId, count)
            results.stages.generate = { success: true, count }
            console.log(`✅ Generated ${count} test sales\n`)

            // Stage 2: Save to local
            console.log('[STAGE 2] Saving to local IndexedDB...')
            const saveResult = await testStress.saveTestSales(testSales)
            results.stages.save = saveResult
            console.log()

            // Stage 3: Verify local order
            console.log('[STAGE 3] Verifying local order (FIFO)...')
            const orderResult = await testStress.verifyLocalOrder()
            results.stages.order = orderResult
            console.log()

            // Stage 4: Sync to server
            console.log('[STAGE 4] Syncing to server...')
            const syncResult = await testStress.simulateSync(shopId, userId, pushSalesFunction)
            results.stages.sync = syncResult
            console.log()

            // Stage 5: Verify data integrity
            console.log('[STAGE 5] Verifying data integrity...')
            const integrityResult = testStress.verifyDataIntegrity(testSales, syncResult.data)
            results.stages.integrity = integrityResult
            console.log()

            // Summary
            results.overall = {
                success: Object.values(results.stages).every(s => s.success),
                totalDuration: (
                    (saveResult.duration || 0) +
                    (syncResult.duration || 0)
                ).toFixed(2)
            }

            console.log(`${'='.repeat(60)}`)
            console.log(`TEST RESULT: ${results.overall.success ? '✅ PASSED' : '❌ FAILED'}`)
            console.log(`Total Duration: ${results.overall.totalDuration}ms`)
            console.log(`${'='.repeat(60)}\n`)

            return results
        } catch (err) {
            console.error('[TEST] ❌ Test failed with error:', err)
            results.overall = { success: false, error: err.message }
            throw err
        }
    }
}

/**
 * TASK 9.2: Mobile UX Test Helpers
 */
export const testMobileUX = {
    /**
     * Simulate rapid barcode scans
     */
    simulateRapidScans: async (onScanHandler, count = 20, delayMs = 100) => {
        console.log(`[TEST] Simulating ${count} rapid barcode scans...`)
        const startTime = performance.now()
        const results = []

        for (let i = 1; i <= count; i++) {
            const barcode = `TEST-${i.toString().padStart(5, '0')}`

            try {
                await onScanHandler(barcode)
                results.push({ barcode, success: true })
                console.log(`[${i}/${count}] ✅ Scanned: ${barcode}`)
            } catch (err) {
                results.push({ barcode, success: false, error: err.message })
                console.log(`[${i}/${count}] ❌ Error: ${barcode}`)
            }

            // Simulate scan delay
            if (i < count) {
                await new Promise(resolve => setTimeout(resolve, delayMs))
            }
        }

        const endTime = performance.now()
        const duration = (endTime - startTime).toFixed(2)

        return {
            totalScans: count,
            successCount: results.filter(r => r.success).length,
            failCount: results.filter(r => !r.success).length,
            duration: parseFloat(duration),
            averagePerScan: (parseFloat(duration) / count).toFixed(2),
            results
        }
    },

    /**
     * Check for keyboard overlap issues on mobile
     */
    checkKeyboardOverlap: () => {
        const windowHeight = window.innerHeight
        const screenHeight = window.screen.height

        // If window height decreased, keyboard likely open
        const keyboardOpen = windowHeight < screenHeight - 100

        // Check if sticky elements are visible
        const stickyElements = document.querySelectorAll('[class*="sticky"], [style*="sticky"]')
        const obscuredElements = []

        stickyElements.forEach(el => {
            const rect = el.getBoundingClientRect()
            if (rect.bottom > windowHeight) {
                obscuredElements.push({
                    element: el.tagName,
                    class: el.className,
                    bottom: rect.bottom,
                    windowHeight
                })
            }
        })

        return {
            keyboardVisible: keyboardOpen,
            estimatedKeyboardHeight: screenHeight - windowHeight,
            stickyElementsCount: stickyElements.length,
            obscuredElementsCount: obscuredElements.length,
            obscuredElements,
            status: obscuredElements.length === 0 ? '✅ All sticky elements visible' : '❌ Some elements obscured'
        }
    },

    /**
     * Measure UI responsiveness during scan
     */
    measureScanPerformance: (scanDurationMs) => {
        const threshold = 100 // 100ms is acceptable for scan response

        return {
            scanDuration: scanDurationMs,
            isAcceptable: scanDurationMs < threshold,
            status: scanDurationMs < threshold ? '✅ Fast (<100ms)' : '❌ Slow (>100ms)',
            recommendation: scanDurationMs > threshold ? 'Optimize event handlers and re-renders' : 'Performance is good'
        }
    }
}
