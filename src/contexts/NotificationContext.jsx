import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

const NotificationContext = createContext()

export function useNotification() {
    return useContext(NotificationContext)
}

export function NotificationProvider({ children }) {
    const [notification, setNotification] = useState(null)

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type })
        setTimeout(() => {
            setNotification(null)
        }, 3000)
    }, [])

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}

            {/* Snackbar UI */}
            {notification && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm animate-fade-in-up">
                    <div className={`
                        px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md
                        ${notification.type === 'success' ? 'bg-green-500/90 text-white border-green-400' :
                            notification.type === 'error' ? 'bg-red-500/90 text-white border-red-400' :
                                'bg-gray-800/90 text-white border-gray-700'}
                    `}>
                        {notification.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                        ) : notification.type === 'error' ? (
                            <XCircle className="w-5 h-5 text-white shrink-0" />
                        ) : (
                            <Info className="w-5 h-5 text-white shrink-0" />
                        )}
                        <span className="text-sm font-bold flex-1">{notification.message}</span>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    )
}
