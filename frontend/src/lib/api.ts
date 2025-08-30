import axios from "axios";
import { camelizeKeys, decamelizeKeys } from "humps";
import { toast } from "@/hooks/use-toast";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL ?? "http://localhost:8000",
});

api.interceptors.request.use(async (config) => {
  // Don't process FormData objects
  if (config.data && !(config.data instanceof FormData)) {
    config.data = decamelizeKeys(config.data);
  }
  if (config.params) config.params = decamelizeKeys(config.params);

  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    res.data = camelizeKeys(res.data);
    return res;
  },
  (err) => {
    if (err.response?.data) err.response.data = camelizeKeys(err.response.data);

    // Handle 401 errors by clearing auth state
    if (
      err.response?.status === 401 &&
      !err.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
      return Promise.reject(err);
    }

    const description =
      err.response?.data?.detail ??
      err.response?.data?.message ??
      err.message ??
      "Unexpected error";

    // Only show toast for non-auth errors to avoid duplicate error messages
    if (!err.config?.url?.includes("/auth/")) {
      toast({
        title: `Error ${err.response?.status ?? ""}`,
        description,
        variant: "destructive",
      });
    }

    return Promise.reject(err);
  }
);
