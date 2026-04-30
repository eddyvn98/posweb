const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 4011;
const BACKEND_PORT = 3011;

// Proxy /api and /health requests to the backend
app.use(['/api', '/health'], createProxyMiddleware({
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
