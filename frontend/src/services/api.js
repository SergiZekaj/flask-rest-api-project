import axios from 'axios';

// Get API URL from environment variable or use localhost for development

const getApiBaseUrl = () => {
  // Use environment variable if set (set in Render's environment variables for production)
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback to localhost for local development
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (username, password) =>
    api.post('/register', { username, password }),
  
  login: (username, password) =>
    api.post('/login', { username, password }),
  
  logout: () =>
    api.post('/logout'),
  
  refresh: () =>
    api.post('/refresh'),
};

// Store API
export const storeAPI = {
  getAll: () =>
    api.get('/store'),
  
  getById: (id) =>
    api.get(`/store/${id}`),
  
  create: (name) =>
    api.post('/store', { name }),
  
  update: (id, name) =>
    api.put(`/store/${id}`, { name }),
  
  delete: (id) =>
    api.delete(`/store/${id}`),
};

// Item API
export const itemAPI = {
  getAll: () =>
    api.get('/item'),
  
  getById: (id) =>
    api.get(`/item/${id}`),
  
  create: (itemData) =>
    api.post('/item', itemData),
  
  update: (id, itemData) =>
    api.put(`/item/${id}`, itemData),
  
  delete: (id) =>
    api.delete(`/item/${id}`),
};

// Tag API
export const tagAPI = {
  getByStore: (storeId) =>
    api.get(`/store/${storeId}/tag`),
  
  create: (storeId, name) =>
    api.post(`/store/${storeId}/tag`, { name }),
  
  getById: (id) =>
    api.get(`/tag/${id}`),
  
  update: (id, name) =>
    api.put(`/tag/${id}`, { name }),
  
  delete: (id) =>
    api.delete(`/tag/${id}`),
  
  linkToItem: (itemId, tagId) =>
    api.post(`/item/${itemId}/tag/${tagId}`),
  
  unlinkFromItem: (itemId, tagId) =>
    api.delete(`/item/${itemId}/tag/${tagId}`),
};

export default api;

