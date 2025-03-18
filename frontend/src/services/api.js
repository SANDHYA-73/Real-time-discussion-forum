import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Topic API
export const topicAPI = {
  getTopics: (page = 1, limit = 10) => 
    api.get(`/topics?skip=${(page - 1) * limit}&limit=${limit}`),
  
  getTopic: (id) => 
    api.get(`/topics/${id}`),
  
  createTopic: (data) => 
    api.post('/topics', data),
  
  updateTopic: (id, data) => 
    api.put(`/topics/${id}`, data),
  
  deleteTopic: (id) => 
    api.delete(`/topics/${id}`),
  
  searchTopics: (query) => 
    api.get(`/topics/search?query=${query}`),
  
  getTrendingTopics: () => 
    api.get('/topics/trending'),
};

// Comment API
export const commentAPI = {
  getTopicComments: (topicId, page = 1, limit = 50) => 
    api.get(`/comments/topic/${topicId}?skip=${(page - 1) * limit}&limit=${limit}`),
  
  createComment: (data) => 
    api.post('/comments', data),
  
  updateComment: (id, data) => 
    api.put(`/comments/${id}`, data),
  
  deleteComment: (id) => 
    api.delete(`/comments/${id}`),
};

// Notification API
export const notificationAPI = {
  getNotifications: (page = 1, limit = 20) => 
    api.get(`/notifications?skip=${(page - 1) * limit}&limit=${limit}`),
  
  markAsRead: (id) => 
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () => 
    api.put('/notifications/read-all'),
};

export default api;