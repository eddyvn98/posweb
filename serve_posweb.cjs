const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 13002;

// Proxy /api and /health requests to the backend
app.use(['/api', '/health'], createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true
}));

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 POSWeb Frontend serving at http://localhost:${PORT}`);
  console.log(`🔌 Proxying /api to http://localhost:3001`);
});
