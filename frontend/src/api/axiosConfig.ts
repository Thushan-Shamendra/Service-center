import axios from 'axios';

// In production, VITE_API_URL points to the Render backend (e.g. https://vsms-api.onrender.com)
// In local dev, falls back to '/api' which Vite proxies to localhost:5000
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Disable caching for API requests to prevent 304 issues
  // Force axios to always fetch fresh data
  paramsSerializer: {
    indexes: null
  }
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vsms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for 401 unauthorized -> redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('vsms_token');
      localStorage.removeItem('vsms_user');
      // Avoid infinite loop if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
