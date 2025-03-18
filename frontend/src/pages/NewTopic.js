import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { topicAPI } from '../services/api';
import authService from '../services/auth';

const NewTopic = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Check if user is authenticated
  const user = authService.getCurrentUser();
  if (!user) {
    navigate('/login');
    return null;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Please fill out all fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await topicAPI.createTopic(formData);
      navigate(`/topics/${response.data.id}`);
    } catch (err) {
      setError(err.detail || 'Failed to create topic. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">New Topic</li>
        </ol>
      </nav>
      
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Create New Topic</h4>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <div className="form-text">
                Choose a clear, descriptive title for your topic.
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="content" className="form-label">Content</label>
              <textarea
                className="form-control"
                id="content"
                name="content"
                rows="10"
                value={formData.content}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            
            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Topic'}
              </button>
              <Link to="/" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewTopic;