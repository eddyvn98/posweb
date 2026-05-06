const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');

const app = express();
const PORT = 4011;
const BACKEND_PORT = 3011;

// Helmet with Explicit Content-Security-Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        "https://telegram.org", 
        "https://accounts.google.com",
        "https://static.cloudflareinsights.com"
      ],
      "connect-src": [
        "'self'", 
        "https://accounts.google.com", 
        "https://api.telegram.org",
        `http://localhost:${BACKEND_PORT}`,
        "https://poswebfree.vivutrade.io.vn",
        "ws://localhost:5173",
        "wss://poswebfree.vivutrade.io.vn"
      ],
      "img-src": [
        "'self'", 
        "data:", 
        "blob:",
        "https://telegram.org", 
        "https://api.telegram.org", 
        "https://*.googleusercontent.com",
        "https://images.unsplash.com",
        "https://plus.unsplash.com",
        "https://*.unsplash.com",
        "https://source.unsplash.com"
      ],
      "frame-src": ["'self'", "https://accounts.google.com", "https://*.google.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"]
    }
  }
}));

// Proxy /api and /health requests to the backend
app.use(createProxyMiddleware({
  pathFilter: ['/api', '/health'],
  target: `http://localhost:${BACKEND_PORT}`,
  changeOrigin: true
}));

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing (SPA fallback)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 POSWeb Free Frontend serving at http://localhost:${PORT}`);
  console.log(`🔌 Proxying /api to http://localhost:${BACKEND_PORT}`);
});
