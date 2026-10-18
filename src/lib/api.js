import axios from 'axios';

// Keep browser requests on this origin so backend CORS and cross-site cookie
// policies cannot prevent authenticated writes from reaching the API.
export const API_BASE_URL = '/api/backend';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach Bearer token to all requests if present in localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
