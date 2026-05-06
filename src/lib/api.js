import axios from 'axios';

const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = host === 'localhost' || host === '127.0.0.1';
const isVivutradeDomain = host === 'posweb.vivutrade.io.vn' || host.endsWith('.vivutrade.io.vn');
const API_URL = (
    import.meta.env.VITE_API_URL || 
    '/api'
);

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 15000, // 15 seconds timeout
});

// Interceptor removed

let isHandlingAuthFailure = false;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if ((status === 401 || status === 403) && typeof window !== 'undefined') {
            if (!isHandlingAuthFailure) {
                isHandlingAuthFailure = true;
                localStorage.removeItem('pos_user');
                localStorage.removeItem('pos_shop');

                // We no longer force redirect to login here.
                // The App will handle "Guest Mode" or pages will prompt for login when needed.
                /*
                if (!window.location.pathname.startsWith('/login')) {
                    window.location.replace('/login');
                }
                */

                setTimeout(() => {
                    isHandlingAuthFailure = false;
                }, 300);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
