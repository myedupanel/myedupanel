import axios from 'axios';

// Axios ka ek naya instance banayein
const api = axios.create({
  /*
   * ===== YEH SABSE ZAROORI BADLAV HAI =====
   * Humne baseURL ko 'http://localhost:5000/api' set kiya hai.
   * Isse Axios ko pata chal jaayega ki har request is poore address par bhejni hai.
   */
  baseURL: 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Yeh har request ke JAANE SE PEHLE token add karta hai.
api.interceptors.request.use(
  (config) => {
    // LocalStorage se token nikalo (yeh client-side par hi chalega)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
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
    if (error.response && error.response.status === 401) {
      // Agar error 401 (Unauthorized) hai, to token invalid hai.
      if (typeof window !== 'undefined') {
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