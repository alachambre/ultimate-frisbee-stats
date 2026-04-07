import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
let apiAccessToken: string | null = null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setApiAccessToken(token: string | null): void {
  apiAccessToken = token;
}

function applyAuthorizationHeader(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const headers = AxiosHeaders.from(config.headers);
  if (apiAccessToken) {
    headers.set("Authorization", `Bearer ${apiAccessToken}`);
  } else {
    headers.delete("Authorization");
  }
  config.headers = headers;
  return config;
}

apiClient.interceptors.request.use((config) => applyAuthorizationHeader(config));

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Network Error:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);
