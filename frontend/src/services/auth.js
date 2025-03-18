import api from './api';

// Auth service
const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await api.post('/users/login', credentials);
      const { access_token } = response.data;
      
      // Store token
      localStorage.setItem('token', access_token);
      
      // Get user data
      const userResponse = await api.get('/users/me');
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      return userResponse.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  },
  
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/me', userData);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default authService;