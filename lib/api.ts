import axios from "axios";
import { getSession } from "next-auth/react";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      const session = await getSession();
      
      if (session?.user) {
        // Use NextAuth session token for external API calls
        config.headers.Authorization = `Bearer ${session.user.id}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

// URL scanning functions
export const scanUrl = async (url: string) => {
  const response = await api.post("/url/scan", { url });
  return response.data;
};

export const fetchScanHistory = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) => {
  const response = await api.get("/url/history", { params });
  return response.data;
};

export const getScanDetails = async (scanId: string) => {
  const response = await api.get(`/url/scan/${scanId}`);
  return response.data;
};

// User dashboard functions
export const fetchUserStats = async () => {
  const response = await api.get("/user/stats");
  return response.data;
};

export const fetchUserSettings = async () => {
  const response = await api.get("/user/settings");
  return response.data;
};

export const updateUserSettings = async (settings: any) => {
  const response = await api.put("/user/settings", settings);
  return response.data;
};

// tester role functions
export const getSystemLogs = async (params?: {
  page?: number;
  limit?: number;
  severity?: string;
}) => {
  const response = await api.get("/admin/logs", { params });
  return response.data;
};

export const promoteUser = async (userId: string) => {
  const response = await api.post(`/admin/users/${userId}/promote`);
  return response.data;
};

export const demoteUser = async (userId: string) => {
  const response = await api.post(`/admin/users/${userId}/demote`);
  return response.data;
};

// admin role functions
export const getAllUsers = async (params?: {
  page?: number;
  limit?: number;
  role?: string;
}) => {
  const response = await api.get("/admin/users", { params });
  return response.data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getRateLimitStats = async () => {
  const response = await api.get("/admin/rate-limits");
  return response.data;
};

export const updateRateLimitConfig = async (config: {
  maxRequests: number;
  windowMs: number;
}) => {
  const response = await api.put("/admin/rate-limits", config);
  return response.data;
};

export const getActivityLogs = async (params?: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get("/admin/activity", { params });
  return response.data;
};

export const exportActivityLogs = async (format: "csv" | "json") => {
  const response = await api.get(`/admin/activity/export`, {
    params: { format },
    responseType: "blob",
  });
  return response.data;
};

export const getSystemHealth = async () => {
  const response = await api.get("/admin/health");
  return response.data;
};

// desktop app download
export const getDesktopAppDownload = async (platform: "windows" | "mac" | "linux") => {
  const response = await api.get(`/app/download/${platform}`);
  return response.data;
};

export default api;
