import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

registerSW({ immediate: true })

// Notify Telegram that the Mini App is ready to display
window.Telegram?.WebApp?.ready()
window.Telegram?.WebApp?.expand()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <App />
        </HelmetProvider>
    </React.StrictMode>,
)
