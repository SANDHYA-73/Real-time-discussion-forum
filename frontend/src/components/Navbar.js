import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import notificationService from '../services/notifications';

const Navbar = ({ onSearch, onClearSearch }) => {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // Load notifications
      loadNotifications();
      
      // Connect to WebSocket for real-time notifications
      const socket = notificationService.connect(currentUser.id);
      socket.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      };
      
      return () => {
        notificationService.disconnect();
      };
    }
  }, []);
  
  const loadNotifications = async () => {
    try {
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query);
    }
  };
  
  const handleNavigation = () => {
    if (onClearSearch) {
      onClearSearch();
      setQuery('');
    }
  };
  
  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };
  
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await notificationService.markAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        
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
      setShowNotifications(false);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Add these styles to fix notifications dropdown z-index issues
  const notificationDropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.5rem',
    zIndex: 1050, // Higher z-index to ensure it appears above other elements
    width: '300px',
    maxHeight: '400px',
    overflow: 'hidden',
    boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
  };

  const notificationCardStyle = {
    width: '100%',
    maxHeight: '400px',
    overflowY: 'auto'
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const notifContainer = document.getElementById("notifications-dropdown");
      const notifButton = document.getElementById("notifications-button");
      
      if (
        showNotifications && 
        notifContainer && 
        !notifContainer.contains(event.target) && 
        notifButton && 
        !notifButton.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={handleNavigation}>Discussion Forum</Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={handleNavigation}>Home</Link>
            </li>
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/topics/new">New Topic</Link>
              </li>
            )}
          </ul>
          
          <form className="d-flex me-3" onSubmit={handleSearch}>
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn btn-outline-light" type="submit">Search</button>
          </form>
          
          {user ? (
            <div className="d-flex align-items-center">
              <div className="position-relative me-3">
                <button 
                  id="notifications-button"
                  className="btn btn-outline-light position-relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <i className="bi bi-bell"></i>
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div 
                    id="notifications-dropdown"
                    style={notificationDropdownStyle}
                  >
                    <div className="card" style={notificationCardStyle}>
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <button className="btn btn-sm btn-link" onClick={markAllAsRead}>
                            Mark all as read
                          </button>
                        )}
                      </div>
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
                                {new Date(notification.created_at).toLocaleString()}
                              </div>
                              <div>{notification.message}</div>
                            </li>
                          ))
                        ) : (
                          <li className="list-group-item text-center">No notifications</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="dropdown">
                <button className="btn btn-outline-light dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                  {user.username}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <Link to="/login" className="btn btn-outline-light me-2">Login</Link>
              <Link to="/register" className="btn btn-light">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;