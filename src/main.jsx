import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Clean up stale PWA caches/service workers that can pin old API URLs.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
        .catch(() => {})
}
if ('caches' in window) {
    caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => {})
}

// Notify Telegram that the Mini App is ready to display
window.Telegram?.WebApp?.ready()
window.Telegram?.WebApp?.expand()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
