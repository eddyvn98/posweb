import axios from 'axios';

const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = host === 'localhost' || host === '127.0.0.1';
const isVivutradeDomain = host === 'posweb.vivutrade.io.vn' || host.endsWith('.vivutrade.io.vn');
const API_URL = (
    import.meta.env.VITE_API_URL ||
    (isVivutradeDomain ? 'https://api-posweb.vivutrade.io.vn/api' : '') ||
    (isLocalHost ? 'http://localhost:3001/api' : 'https://api-posweb.vivutrade.io.vn/api')
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

let isHandlingAuthFailure = false;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if ((status === 401 || status === 403) && typeof window !== 'undefined') {
            if (!isHandlingAuthFailure) {
                isHandlingAuthFailure = true;
                localStorage.removeItem('pos_token');
                localStorage.removeItem('pos_user');
                localStorage.removeItem('pos_shop');

                if (!window.location.pathname.startsWith('/login')) {
                    window.location.replace('/login');
                }

                setTimeout(() => {
                    isHandlingAuthFailure = false;
                }, 300);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
