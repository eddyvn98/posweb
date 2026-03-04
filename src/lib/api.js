import axios from 'axios';

const host = typeof window !== 'undefined' ? window.location.hostname : '';
const API_URL = (
    import.meta.env.VITE_API_URL ||
    (host === 'posweb.vivutrade.io.vn' ? 'https://api-posweb.vivutrade.io.vn/api' : '') ||
    'http://localhost:3001/api'
);

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
