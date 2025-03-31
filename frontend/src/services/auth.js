import api from './api';
import { createContext, useContext, useState, useEffect } from 'react';

// Create an auth context
export const AuthContext = createContext(null);

// Auth service with existing functionality
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
      
      // Trigger global event for auth state change
      window.dispatchEvent(new Event('auth-change'));
      
      return userResponse.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Trigger global event for auth state change
    window.dispatchEvent(new Event('auth-change'));
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
      
      // Trigger global event for auth state change
      window.dispatchEvent(new Event('auth-change'));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Auth provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  
  // Update auth state when localStorage changes
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(authService.getCurrentUser());
    };

    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  // Value to provide in context
  const value = {
    user: currentUser,
    setUser: setCurrentUser,
    authService
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}

export default authService;