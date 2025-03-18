import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import notificationService from '../services/notifications';

const NotificationPanel = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (userId) {
      loadNotifications();
      
      // Connect to WebSocket for real-time notifications
      const socket = notificationService.connect(userId);
      socket.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        setNotifications(prev => [newNotification, ...prev]);
      };
      
      return () => {
        notificationService.disconnect();
      };
    }
  }, [userId]);
  
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
      setError(null);
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await notificationService.markAsRead(notification.id);
        
        // Update notification in state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    // Navigate to the topic
    if (notification.topic_id) {
      navigate(`/topics/${notification.topic_id}`);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };
  
  return (
    <div className="notification-panel card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Notifications</h5>
        {notifications.some(n => !n.is_read) && (
          <button 
            className="btn btn-sm btn-link"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>
      
      {loading && <div className="text-center p-3">Loading...</div>}
      
      {error && (
        <div className="alert alert-danger m-3" role="alert">
          {error}
        </div>
      )}
      
      <ul className="list-group list-group-flush">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <li 
              key={notification.id}
              className={`list-group-item ${!notification.is_read ? 'bg-light' : ''}`}
              onClick={() => handleNotificationClick(notification)}
              style={{ cursor: 'pointer' }}
            >
              <div className="small text-muted">
                {moment(notification.created_at).fromNow()}
              </div>
              <div>{notification.message}</div>
            </li>
          ))
        ) : (
          <li className="list-group-item text-center">No notifications</li>
        )}
      </ul>
    </div>
  );
};

export default NotificationPanel;