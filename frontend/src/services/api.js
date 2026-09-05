import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export const SERVER_URL =
  API_BASE_URL.replace(
    /\/api\/?$/,
    ""
  );

export const getFileUrl = (filePath) => {
  if (!filePath) {
    return "";
  }

  const value = String(filePath).trim();

  if (!value) {
    return "";
  }

  // Already a complete URL
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Convert relative path into absolute backend URL
  const normalizedPath = value.startsWith("/")
    ? value
    : `/${value}`;

  return `${SERVER_URL}${normalizedPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jt_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;