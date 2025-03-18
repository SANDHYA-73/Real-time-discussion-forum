import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Topic from '../components/Topic';
import { topicAPI } from '../services/api';
import authService from '../services/auth';

const Home = ({ searchQuery }) => {
  const [topics, setTopics] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const user = authService.getCurrentUser();
  
  const loadTopics = useCallback(async (pageNum, reset = false) => {
    try {
      setLoading(true);
      const response = await topicAPI.getTopics(pageNum);
      
      if (reset) {
        setTopics(response.data);
      } else {
        setTopics(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 10);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError('Failed to load topics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const loadTrendingTopics = useCallback(async () => {
    try {
      const response = await topicAPI.getTrendingTopics();
      setTrendingTopics(response.data);
    } catch (err) {
      console.error('Failed to load trending topics:', err);
    }
  }, []);
  
  const searchTopics = useCallback(async (query) => {
    try {
      setLoading(true);
      const response = await topicAPI.searchTopics(query);
      setTopics(response.data);
      setHasMore(false);
      setError(null);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      searchTopics(searchQuery);
    } else {
      loadTopics(1, true);
    }
    
    loadTrendingTopics();
  }, [searchQuery, searchTopics, loadTopics, loadTrendingTopics]);
  
  const loadMore = () => {
    if (!loading && hasMore) {
      loadTopics(page + 1);
    }
  };
  
  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-md-8">
          {searchQuery ? (
            <h2 className="mb-4">Search Results: {searchQuery}</h2>
          ) : (
            <h2 className="mb-4">Recent Discussions</h2>
          )}
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          {topics.length > 0 ? (
            <div className="topic-list">
              {topics.map(topic => (
                <Topic key={topic.id} topic={topic} />
              ))}
              
              {hasMore && (
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center my-5">
              {loading ? (
                <p>Loading topics...</p>
              ) : (
                <div>
                  <p className="mb-3">No topics found.</p>
                  {user && (
                    <Link to="/topics/new" className="btn btn-primary">
                      Create New Topic
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Trending Topics</h5>
            </div>
            <ul className="list-group list-group-flush">
              {trendingTopics.length > 0 ? (
                trendingTopics.map(topic => (
                  <li key={topic.id} className="list-group-item">
                    <Link to={`/topics/${topic.id}`} className="text-decoration-none">
                      {topic.title}
                    </Link>
                    <div className="small text-muted">
                      <i className="bi bi-eye me-1"></i>
                      {topic.score} views
                    </div>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-center">No trending topics</li>
              )}
            </ul>
          </div>
          
          {user ? (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Start a Discussion</h5>
                <p className="card-text">Have a question or something to share?</p>
                <Link to="/topics/new" className="btn btn-primary">
                  Create New Topic
                </Link>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Join the Discussion</h5>
                <p className="card-text">Sign in to participate in discussions and receive notifications.</p>
                <Link to="/login" className="btn btn-primary">
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;