import axios from 'axios';

// ✅ Determine API base URL (works for both Vite & CRA)
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  'http://localhost:8000/api';

// ✅ Helper functions for token management
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setAccessToken = (token) => localStorage.setItem('access_token', token);
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// ✅ Create a dedicated Axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10 seconds
});

// ✅ Request interceptor → attaches access token to every request
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor → handles 401 Unauthorized (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors that are not retried already
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      // 🚫 Prevent infinite refresh loops
      if (originalRequest.url.includes('/auth/token/refresh/')) {
        clearTokens();
        // Optional: use SPA redirect if available
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'; // fallback hard redirect
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          // ✅ Use the configured instance (inherits baseURL)
          const res = await api.post('/auth/token/refresh/', {
            refresh: refreshToken,
          });

          // ✅ Save new access token and retry the original request
          setAccessToken(res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (err) {
          // ❌ Refresh failed (invalid/expired refresh token)
          clearTokens();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(err);
        }
      }
    }

    // For all other errors, reject normally
    return Promise.reject(error);
  }
);

export default api;
