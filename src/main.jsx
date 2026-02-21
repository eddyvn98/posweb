import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Notify Telegram that the Mini App is ready to display
window.Telegram?.WebApp?.ready()
window.Telegram?.WebApp?.expand()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
