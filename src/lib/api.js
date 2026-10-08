import axios from 'axios';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'https://api.management.phidimservice.com.np'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
