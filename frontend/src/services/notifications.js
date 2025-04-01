import { notificationAPI } from './api';

// WebSocket connection
let socket = null;

const notificationService = {
  connect: (userId) => {
    if (socket) {
      // Close existing socket if it's open
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      socket = null;
    }
    
    // Get the auth token
    const token = localStorage.getItem('token');
    if (!token || !userId) {
      console.warn('Cannot connect to notifications: No auth token or user ID');
      return null;
    }
    
    // Create WebSocket connection with auth token in query params
    const wsUrl = process.env.REACT_APP_WS_URL || 
      `ws://localhost:8000/api/notifications/ws/${userId}?token=${encodeURIComponent(token)}`;
    
    try {
      socket = new WebSocket(wsUrl);
      
      // Add connection event handlers
      socket.onopen = () => {
        console.log('WebSocket connection established');
      };
      
      // Add error and reconnection handling
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket connection closed with code: ${event.code}`);
        
        // Only try to reconnect if not closed cleanly and we still have a valid user and token
        if (!event.wasClean && localStorage.getItem('token') && userId) {
          console.log('Attempting to reconnect in 3 seconds...');
          setTimeout(() => {
            notificationService.connect(userId);
          }, 3000);
        }
      };
      
      return socket;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      return null;
    }
  },
  
  disconnect: () => {
    if (socket) {
      try {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1000, "User logged out");
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      } finally {
        socket = null;
      }
    }
  },
  
  getNotifications: async (page = 1, limit = 20) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return [];
      }
      
      const response = await notificationAPI.getNotifications(page, limit);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Return empty array instead of throwing to prevent cascading errors
      return [];
    }
  },
  
  markAsRead: async (id) => {
    try {
      const response = await notificationAPI.markAsRead(id);
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },
  
  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllAsRead();
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  },
};

export default notificationService;