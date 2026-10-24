const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = process.env.PORT || 4011;
const apiTarget = process.env.API_TARGET || 'http://127.0.0.1:3011';

// Proxy /api requests to backend
app.use(
  '/api',
  createProxyMiddleware({
    target: apiTarget,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      '^/': '/api/',
    },
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'posweb-free-frontend', port });
});

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback for HTML5 client-side routing (Express 4 & 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`[posweb-free-frontend] Serving on http://localhost:${port} -> proxying API to ${apiTarget}`);
});
