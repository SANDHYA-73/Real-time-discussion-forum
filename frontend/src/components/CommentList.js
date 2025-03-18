import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { commentAPI } from '../services/api';
import authService from '../services/auth';

const CommentList = ({ topicId, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  const user = authService.getCurrentUser();
  
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await commentAPI.getTopicComments(topicId);
      setComments(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load comments. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [topicId]);
  
  useEffect(() => {
    loadComments();
  }, [loadComments]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    try {
      setLoading(true);
      const response = await commentAPI.createComment({
        content,
        topic_id: topicId
      });
      
      setComments([...comments, response.data]);
      setContent('');
      setError(null);
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      setError('Failed to add comment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };
  
  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };
  
  const saveEdit = async (id) => {
    if (!editContent.trim()) return;
    
    try {
      setLoading(true);
      const response = await commentAPI.updateComment(id, {
        content: editContent
      });
      
      setComments(comments.map(c => 
        c.id === id ? response.data : c
      ));
      
      setEditingId(null);
      setEditContent('');
      setError(null);
    } catch (err) {
      setError('Failed to update comment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteComment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      setLoading(true);
      await commentAPI.deleteComment(id);
      
      setComments(comments.filter(c => c.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete comment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="comments-section mt-4">
      <h3 className="mb-3">Comments ({comments.length})</h3>
      
      {user && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <textarea
              className="form-control"
              placeholder="Add a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="3"
              required
            ></textarea>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !content.trim()}
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {comments.length > 0 ? (
        <div className="comment-list">
          {comments.map(comment => (
            <div key={comment.id} className="card mb-3">
              <div className="card-body">
                {editingId === comment.id ? (
                  <div className="edit-form">
                    <textarea
                      className="form-control mb-2"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows="3"
                    ></textarea>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => saveEdit(comment.id)}
                        disabled={loading || !editContent.trim()}
                      >
                        Save
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="card-text">{comment.content}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Posted by {comment.user.username} • {moment(comment.created_at).fromNow()}
                      </small>
                      
                      {user && user.id === comment.user_id && (
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => startEditing(comment)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteComment(comment.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center my-4">
          <p className="text-muted">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

export default CommentList;