import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import moment from 'moment';
import CommentList from '../components/CommentList';
import { topicAPI } from '../services/api';
import authService from '../services/auth';

const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const user = authService.getCurrentUser();
  
  const loadTopic = useCallback(async () => {
    try {
      setLoading(true);
      const response = await topicAPI.getTopic(id);
      setTopic(response.data);
      setTitle(response.data.title);
      setContent(response.data.content);
      setError(null);
    } catch (err) {
      setError('Failed to load topic. It may have been removed or you may not have permission to view it.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    loadTopic();
  }, [loadTopic]);
  
  const startEditing = () => {
    setEditing(true);
  };
  
  const cancelEditing = () => {
    setEditing(false);
    setTitle(topic.title);
    setContent(topic.content);
  };
  
  const saveTopic = async () => {
    if (!title.trim() || !content.trim()) return;
    
    try {
      setLoading(true);
      const response = await topicAPI.updateTopic(id, {
        title,
        content
      });
      
      setTopic(response.data);
      setEditing(false);
      setError(null);
    } catch (err) {
      setError('Failed to update topic. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteTopic = async () => {
    if (!window.confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await topicAPI.deleteTopic(id);
      navigate('/');
    } catch (err) {
      setError('Failed to delete topic. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !topic) {
    return (
      <div className="container py-4">
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !topic) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <div className="text-center">
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  if (!topic) {
    return null;
  }
  
  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-md-12">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active">{topic.title}</li>
            </ol>
          </nav>
          
          <div className="card mb-4">
            <div className="card-body">
              {editing ? (
                <div className="edit-form">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">Content</label>
                    <textarea
                      className="form-control"
                      id="content"
                      rows="8"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary"
                      onClick={saveTopic}
                      disabled={loading || !title.trim() || !content.trim()}
                    >
                      Save Changes
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h1 className="card-title">{topic.title}</h1>
                    
                    {user && user.id === topic.user_id && (
                      <div className="btn-group">
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={startEditing}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-outline-danger"
                          onClick={deleteTopic}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="topic-meta mb-3">
                    <span className="badge bg-secondary me-2">
                      <i className="bi bi-person me-1"></i>
                      {topic.user.username}
                    </span>
                    <span className="badge bg-secondary me-2">
                      <i className="bi bi-calendar me-1"></i>
                      {moment(topic.created_at).format('MMM D, YYYY')}
                    </span>
                    <span className="badge bg-secondary">
                      <i className="bi bi-eye me-1"></i>
                      {topic.view_count} views
                    </span>
                  </div>
                  
                  <div className="topic-content mb-4">
                    <p className="card-text">{topic.content}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <CommentList 
            topicId={id} 
            onCommentAdded={loadTopic}
          />
        </div>
      </div>
    </div>
  );
};

export default TopicDetail;