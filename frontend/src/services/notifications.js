import { notificationAPI } from './api';

// WebSocket connection
let socket = null;

const notificationService = {
  connect: (userId) => {
    if (socket) {
      socket.close();
    }
    
    // Create WebSocket connection
    const wsUrl = process.env.REACT_APP_WS_URL || `ws://localhost:8000/api/notifications/ws/${userId}`;
    socket = new WebSocket(wsUrl);
    
    return socket;
  },
  
  disconnect: () => {
    if (socket) {
      socket.close();
      socket = null;
    }
  },
  
  getNotifications: async (page = 1, limit = 20) => {
    try {
      const response = await notificationAPI.getNotifications(page, limit);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  markAsRead: async (id) => {
    try {
      const response = await notificationAPI.markAsRead(id);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllAsRead();
      return true;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default notificationService;