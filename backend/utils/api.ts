import axios from 'axios';

// Axios ka ek naya instance banayein
const api = axios.create({

  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', // <-- FIX 1: Use Render/localhost URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Yeh har request ke JAANE SE PEHLE token add karta hai AUR URL ko adjust karta hai.
api.interceptors.request.use(
  (config) => {
    // LocalStorage se token nikalo (yeh client-side par hi chalega)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      // FIX 2: Check if the request URL already starts with /api (to avoid adding it twice)
      const needsApiPrefix = !config.url?.startsWith('/api');

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      // FIX 3: '/api' prefix ko request URL ke shuru mein add karein, agar woh pehle se nahi hai.
      // Yeh ensure karta hai ki path jaise '/academics/exams' banega '/api/academics/exams'
      if (needsApiPrefix && config.url) {
         config.url = `/api${config.url}`;
      }
    }
    // Agar server-side rendering hai (window undefined), toh URL ko modify na karein
    // (Assume server-side calls handle the full path correctly if needed)

    return config;
  },
  (error) => {
    console.error("Axios request interceptor error:", error); // Added logging
    return Promise.reject(error);
  }
);

// Response Interceptor (Automatic Logout)
api.interceptors.response.use(
  (response) => {
    // Agar response theek hai, to use seedha aage bhej do.
    return response;
  },
  (error) => {
    // Agar response mein error hai, to use check karo.
    console.error("Axios response interceptor error:", error.response?.data || error.message); // Added logging

    if (error.response && error.response.status === 401) {
      // Agar error 401 (Unauthorized) hai, to token invalid hai.
      if (typeof window !== 'undefined') {
        console.log("Unauthorized (401) error detected. Logging out."); // Added logging
        localStorage.removeItem('token');
        // User ko login page par bhej do.
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    // Baaki sabhi errors ke liye, unhe aage bhej do.
    return Promise.reject(error);
  }
);

export default api;