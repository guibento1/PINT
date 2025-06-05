// web/frontend/shared/services/axios.js

import axios from "axios";

// Criação do cliente Axios com base na variável de ambiente
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // No caso: http://localhost:3000
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para incluir o token de autenticação, se existir
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); //
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
