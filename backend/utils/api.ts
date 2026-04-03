import axios from 'axios';

// --- Robust API URL handling ---
const LOCAL_API_URL = 'http://localhost:5000'; // Local dev port
// Allow Render or other hosts to set NEXT_PUBLIC_API_URL. Normalize it so it NEVER contains a trailing '/api' or a trailing slash.
const RAW_PRODUCTION_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myedupanel.onrender.com';
const PRODUCTION_HOST = RAW_PRODUCTION_API_URL.replace(/\/+$/,'').replace(/\/api$/i, '');

// Choose base host depending on environment, then append '/api' as a stable prefix.
const BASE_HOST = process.env.NODE_ENV === 'development' ? LOCAL_API_URL : PRODUCTION_HOST;
const BASE_API_URL = `${BASE_HOST.replace(/\/+$/,'')}/api`;

// Create a new Axios instance with the normalized base URL
const api = axios.create({
  baseURL: BASE_API_URL,
  timeout: 15000,
});

// --- End robust handling ---

// Request Interceptor: Adds token AND adjusts URL before every request.
api.interceptors.request.use(
  (config) => {
    // Token addition & FormData handling (client-only checks)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      if (config.data instanceof FormData) {
        // Let Axios set correct Content-Type (multipart/form-data; boundary=...)
        delete config.headers['Content-Type'];
      }
    }

    // Do NOT mutate the URL to add '/api' here. baseURL already includes '/api'.
    return config;
  },
  (error) => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor (Error Handling: Lock & Logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging for easier debugging
    const status = error.response?.status;
    const data = error.response?.data;
    console.error('Axios response interceptor error: status=', status, 'data=', data || error.message);

    // Subscription lock (403)
    if (status === 403 && typeof window !== 'undefined') {
      if (window.location.pathname !== '/upgrade') {
        window.location.href = '/upgrade';
      }
    }

    // Automatic logout on 401
    if (status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && !currentPath.startsWith('/reset-password')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    if (!error.response) {
      console.log('Network error or timeout occurred');
    }

    return Promise.reject(error);
  }
);

export default api;