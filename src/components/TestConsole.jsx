import { useState, useRef } from 'react'
import { testStress, testMobileUX } from '../lib/testUtils'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'

export default function TestConsole() {
    const { shop, user } = useAuth()
    const { pushSales } = useSync()
    const [isOpen, setIsOpen] = useState(false)
    const [logs, setLogs] = useState([])
    const [isRunning, setIsRunning] = useState(false)
    const logsEndRef = useRef(null)

    const addLog = (message, type = 'info') => {
        setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }])
        setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }

    const runStressTest = async () => {
        if (!shop?.id || !user?.id) {
            addLog('❌ Shop or User not found', 'error')
            return
        }

        setIsRunning(true)
        addLog('Starting stress test...', 'info')

        try {
            const originalLog = console.log
            console.log = (...args) => {
                addLog(args.join(' '), 'debug')
                originalLog(...args)
            }

            const results = await testStress.runFullTest(shop.id, user.id, pushSales, 100)

            console.log = originalLog

            if (results.overall.success) {
                addLog('✅ STRESS TEST PASSED', 'success')
                addLog(`Total duration: ${results.overall.totalDuration}ms`, 'success')
            } else {
                addLog('❌ STRESS TEST FAILED', 'error')
            }

            addLog(JSON.stringify(results, null, 2), 'debug')
        } catch (err) {
            addLog(`❌ Error: ${err.message}`, 'error')
        } finally {
            setIsRunning(false)
        }
    }

    const runScanTest = async () => {
        setIsRunning(true)
        addLog('Starting rapid scan test...', 'info')

        try {
            // Mock scan handler
            const mockHandler = async (barcode) => {
                addLog(`Scanned: ${barcode}`, 'debug')
                await new Promise(resolve => setTimeout(resolve, 10))
            }

            const results = await testMobileUX.simulateRapidScans(mockHandler, 20, 100)

            addLog(`✅ SCAN TEST COMPLETED`, 'success')
            addLog(`Success: ${results.successCount}/20`, 'success')
            addLog(`Average time: ${results.averagePerScan}ms`, 'success')

            if (results.averagePerScan < 100) {
                addLog('✅ Performance acceptable (<100ms)', 'success')
            } else {
                addLog('⚠️ Performance could be optimized', 'warning')
            }
        } catch (err) {
            addLog(`❌ Error: ${err.message}`, 'error')
        } finally {
            setIsRunning(false)
        }
    }

    const checkKeyboardOverlap = () => {
        addLog('Checking keyboard overlap...', 'info')
        const result = testMobileUX.checkKeyboardOverlap()
        addLog(`Status: ${result.status}`, result.obscuredElementsCount > 0 ? 'warning' : 'success')
        addLog(JSON.stringify(result, null, 2), 'debug')
    }

    const clearLogs = () => {
        setLogs([])
    }

    const getLogColor = (type) => {
        switch (type) {
            case 'success': return 'text-green-600'
            case 'error': return 'text-red-600'
            case 'warning': return 'text-yellow-600'
            case 'debug': return 'text-gray-500'
            default: return 'text-blue-600'
        }
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition z-40 font-bold text-lg"
                title="Epic 9 Test Console"
            >
                🧪
            </button>

            {/* Test Console Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-purple-200 z-40 flex flex-col">
                    {/* Header */}
                    <div className="bg-purple-600 text-white px-4 py-3 rounded-t-xl font-bold flex justify-between items-center">
                        🧪 Test Console
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-purple-700 rounded px-2 py-1"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Control Buttons */}
                    <div className="p-3 bg-purple-50 border-b border-purple-100 grid grid-cols-2 gap-2">
                        <button
                            onClick={runStressTest}
                            disabled={isRunning}
                            className="btn btn-sm bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isRunning ? '⏳' : '📊'} Stress Test
                        </button>
                        <button
                            onClick={runScanTest}
                            disabled={isRunning}
                            className="btn btn-sm bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 disabled:opacity-50"
                        >
                            {isRunning ? '⏳' : '📱'} Scan Test
                        </button>
                        <button
                            onClick={checkKeyboardOverlap}
                            className="btn btn-sm bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600"
                        >
                            ⌨️ Keyboard Check
                        </button>
                        <button
                            onClick={clearLogs}
                            className="btn btn-sm bg-gray-500 text-white rounded-lg text-xs font-bold hover:bg-gray-600"
                        >
                            🗑️ Clear
                        </button>
                    </div>

                    {/* Logs */}
                    <div className="flex-1 overflow-y-auto p-3 bg-gray-50 font-mono text-xs space-y-1">
                        {logs.length === 0 ? (
                            <div className="text-gray-400 italic">No logs yet. Click a button to start testing.</div>
                        ) : (
                            logs.map((log, idx) => (
                                <div key={idx} className={`${getLogColor(log.type)}`}>
                                    <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2 bg-purple-50 border-t border-purple-100 text-xs text-gray-600">
                        <p><strong>Shop:</strong> {shop?.id?.slice(0, 8)}...</p>
                        <p><strong>Logs:</strong> {logs.length}</p>
                    </div>
                </div>
            )}
        </>
    )
}
