import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import notificationService from '../services/notifications';
import { useAuth } from '../services/auth';
import '../styles.css';

const Navbar = ({ onSearch, onClearSearch }) => {
  const { user, authService } = useAuth();
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Load notifications
      loadNotifications();
      
      // Connect to WebSocket for real-time notifications
      const socket = notificationService.connect(user.id);
      socket.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      };
      
      return () => {
        notificationService.disconnect();
      };
    }
  }, [user]);
  
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
    zIndex: 1050, 
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
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom py-2">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/" onClick={handleNavigation}>Discussion Forum</Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={handleNavigation}>Home</Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center">
            <form className="d-flex me-3" onSubmit={handleSearch}>
              <div className="input-group">
                <input
                  className="form-control"
                  type="search"
                  placeholder="Search topics..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                />
                <button 
                  className="btn btn-dark" 
                  type="submit"
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                >
                  Search
                </button>
              </div>
            </form>
            
            {user ? (
              <div className="d-flex align-items-center">
                <div className="position-relative me-3">
                  <button 
                    id="notifications-button"
                    className="btn btn-outline-dark position-relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                    style={{ height: '38px', width: '38px', padding: '6px' }}
                  >
                    <i className="bi bi-bell"></i>
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                        {unreadCount}
                        <span className="visually-hidden">unread notifications</span>
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div 
                      id="notifications-dropdown"
                      style={notificationDropdownStyle}
                    >
                      <div className="card" style={notificationCardStyle}>
                        <div className="card-header d-flex justify-content-between align-items-center bg-white">
                          <span className="fw-bold">Notifications</span>
                          {unreadCount > 0 && (
                            <button className="btn btn-sm btn-link text-dark p-0" onClick={markAllAsRead}>
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
                  <button 
                    className="btn btn-outline-dark dropdown-toggle" 
                    type="button" 
                    id="userDropdown" 
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ height: '38px' }}
                  >
                    {user.username}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="userDropdown">
                    <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                    <li><Link className="dropdown-item" to="/topics/new">Create New Topic</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-center">
                <Link to="/login" className="btn btn-outline-dark me-2" style={{ height: '38px' }}>Login</Link>
                <Link to="/register" className="btn btn-dark" style={{ height: '38px' }}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;