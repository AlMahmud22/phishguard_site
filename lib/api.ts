import axios from "axios";

/// setup base axios instance for REST communication with PhishGuard backend
/// this instance is configured to communicate with the API at phish.equators.site/api
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  /// timeout after 10 seconds
  timeout: 10000,
});

/// request interceptor to add authentication token to headers
api.interceptors.request.use(
  (config) => {
    /// retrieve token from localStorage if available
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/// response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    /// handle 401 unauthorized errors by clearing token and redirecting to login
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
