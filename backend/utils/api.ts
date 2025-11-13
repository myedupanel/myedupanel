import axios from 'axios';

// Create a new Axios instance
// Updated to use the Vercel backend URL directly instead of relying on Next.js rewrites
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://myedupanel-backend.vercel.app',
  // Removed hardcoded 'Content-Type' header.
  // Axios will now set Content-Type based on the request data.
  // (e.g., 'multipart/form-data' for file uploads, 'application/json' for text)
});

// Request Interceptor: Adds token AND adjusts URL before every request.
api.interceptors.request.use(
  (config) => {
    // Get token from LocalStorage (this only runs client-side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      // Check if the request URL already starts with /api (to avoid adding it twice)
      const needsApiPrefix = !config.url?.startsWith('/api');

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      // If data is FormData, do NOT set Content-Type (let Axios do it)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      // Add '/api' prefix to the request URL if it's not already there.
      // This ensures paths like '/academics/exams' become '/api/academics/exams'
      if (needsApiPrefix && config.url) {
        config.url = `/api${config.url}`;
      }
    }
    // If server-side rendering (window undefined), don't modify the URL
    // (Assume server-side calls handle the full path correctly if needed)

    return config;
  },
  (error) => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor (Error Handling: Lock & Logout)
api.interceptors.response.use(
  (response) => {
    // If the response is good, just return it.
    return response;
  },
  (error) => {
    // If there's an error, check it.
    console.error(
      'Axios response interceptor error:',
      error.response?.data || error.message
    );

    // === THIS IS THE NEW "LOCK" ===
    if (error.response && error.response.status === 403) {
      // 403 Forbidden error means the 'checkSubscription' middleware
      // has blocked the user.
      if (typeof window !== 'undefined') {
        // Redirect them to the upgrade page.
        // Check to avoid redirect loop if /upgrade itself fails
        if (window.location.pathname !== '/upgrade') {
          console.log('Subscription error (403). Redirecting to /upgrade.');
          window.location.href = '/upgrade';
        }
      }
    }
    // === "LOCK" ENDS HERE ===

    // --- Automatic Logout ---
    if (error.response && error.response.status === 401) {
      // 401 (Unauthorized) error means token is invalid.
      if (typeof window !== 'undefined') {
        console.log('Unauthorized (401) error detected. Logging out.');
        localStorage.removeItem('token');
        // Send the user to the login page.
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    // --- Logout Ends Here ---

    // For all other errors, just pass them along.
    return Promise.reject(error);
  }
);

export default api;