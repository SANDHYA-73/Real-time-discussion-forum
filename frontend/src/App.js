import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles.css';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import TopicDetail from './pages/TopicDetail';
import NewTopic from './pages/NewTopic';

// Auth context
import { useAuth } from './services/auth';

// Private Route component
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <Router>
      <div className="app d-flex flex-column min-vh-100">
        <Navbar onSearch={handleSearch} onClearSearch={clearSearch} />
        
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home searchQuery={searchQuery} />} />
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <Login />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/" /> : <Register />
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/topics/new" element={
              <PrivateRoute>
                <NewTopic />
              </PrivateRoute>
            } />
            <Route path="/topics/:id" element={<TopicDetail />} />
          </Routes>
        </main>
        
        <footer className="bg-light text-dark py-4 mt-auto border-top">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <h5>Real-Time Discussion Forum</h5>
                <p className="mb-0 text-muted">
                  A platform for discussions with real-time updates.
                </p>
              </div>
              <div className="col-md-6 text-md-end">
                <p className="mb-0 text-muted">
                  &copy; {new Date().getFullYear()} Discussion Forum
                </p>
              </div>
            </div>
          </div>
        </footer>
        
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
};

export default App;