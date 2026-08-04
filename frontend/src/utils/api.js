import axios from "axios";

// Replace this with your actual Vercel backend URL if not using Netlify environment settings:
const VERCEL_BACKEND_URL = "https://aiclinicmanagementsaas.vercel.app/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || VERCEL_BACKEND_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
