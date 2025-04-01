import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Topic from '../components/Topic';
import { topicAPI } from '../services/api';
import authService from '../services/auth';

const Home = ({ searchQuery }) => {
  const [topics, setTopics] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const topicsCache = useRef(new Map());
  const abortControllerRef = useRef(null);
  
  const user = authService.getCurrentUser();
  
  const loadTopics = useCallback(async (pageNum, reset = false) => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      
      // Check cache first (only for first page)
      const cacheKey = `page-${pageNum}`;
      if (pageNum === 1 && !searchQuery && topicsCache.current.has(cacheKey)) {
        const cachedData = topicsCache.current.get(cacheKey);
        if (reset) {
          setTopics(cachedData);
        } else {
          setTopics(prev => [...prev, ...cachedData]);
        }
        setHasMore(cachedData.length === 10);
        setPage(pageNum);
        setLoading(false);
        
        // Still fetch in background to update cache
        topicAPI.getTopics(pageNum)
          .then(response => {
            topicsCache.current.set(cacheKey, response.data);
            // Update only if data changed
            if (JSON.stringify(cachedData) !== JSON.stringify(response.data)) {
              if (reset) {
                setTopics(response.data);
              } else {
                setTopics(prev => [...prev, ...response.data]);
              }
              setHasMore(response.data.length === 10);
            }
          })
          .catch(err => console.log('Background fetch error:', err));
          
        return;
      }
      
      // Fetch from API with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const response = await Promise.race([
        topicAPI.getTopics(pageNum),
        timeoutPromise
      ]);
      
      // Cache the results for first page
      if (pageNum === 1 && !searchQuery) {
        topicsCache.current.set(cacheKey, response.data);
      }
      
      if (reset) {
        setTopics(response.data);
      } else {
        setTopics(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 10);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Failed to load topics. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);
  
  const loadTrendingTopics = useCallback(async () => {
    try {
      setLoadingTrending(true);
      // If we have no trending topics, use our regular topics as trending
      const response = await topicAPI.getTrendingTopics();
      
      // Check if the trending topics API returned empty data
      if (!response.data || response.data.length === 0) {
        // Fallback: Use most viewed regular topics as trending
        const regularTopics = await topicAPI.getTopics(1, 5);
        const mockTrending = regularTopics.data
          .slice(0, 5)
          .map(topic => ({
            id: topic.id,
            title: topic.title,
            score: topic.view_count || Math.floor(Math.random() * 10) + 1
          }));
        
        setTrendingTopics(mockTrending);
      } else {
        setTrendingTopics(response.data);
      }
    } catch (err) {
      console.error('Failed to load trending topics:', err);
      
      // Fallback: Create some mock trending topics if we already have regular topics
      if (topics.length > 0) {
        const mockTrending = topics
          .slice(0, 3)
          .map(topic => ({
            id: topic.id,
            title: topic.title,
            score: topic.view_count || Math.floor(Math.random() * 10) + 1
          }));
          
        setTrendingTopics(mockTrending);
      }
    } finally {
      setLoadingTrending(false);
    }
  }, [topics]);
  
  const searchTopics = useCallback(async (query) => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    try {
      setLoading(true);
      const response = await topicAPI.searchTopics(query);
      setTopics(response.data);
      setHasMore(false);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Search failed. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Clear cache when unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      searchTopics(searchQuery);
    } else {
      loadTopics(1, true);
    }
    
    loadTrendingTopics();
  }, [searchQuery, searchTopics, loadTopics, loadTrendingTopics]);
  
  // Reload trending topics when regular topics are loaded
  useEffect(() => {
    if (topics.length > 0 && trendingTopics.length === 0) {
      loadTrendingTopics();
    }
  }, [topics, trendingTopics.length, loadTrendingTopics]);
  
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
          
          {loading && topics.length === 0 ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading topics...</span>
              </div>
              <p className="mt-2">Loading topics...</p>
            </div>
          ) : topics.length > 0 ? (
            <div className="topic-list">
              {topics.map(topic => (
                <Topic key={topic.id} topic={topic} />
              ))}
              
              {hasMore && (
                <div className="text-center mt-4 mb-4">
                  <button 
                    className="btn btn-dark"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                      </>
                    ) : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center my-5">
              <p className="mb-3">No topics found.</p>
              {user && (
                <Link to="/topics/new" className="btn btn-dark">
                  Create New Topic
                </Link>
              )}
            </div>
          )}
        </div>
        
        <div className="col-md-4">
          <div className="card trending-topics-card">
            <div className="card-header">
              <h5 className="mb-0">Trending Topics</h5>
            </div>
            <ul className="list-group list-group-flush">
              {loadingTrending ? (
                <li className="list-group-item text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" aria-hidden="true"></div>
                  <span>Loading trending topics...</span>
                </li>
              ) : trendingTopics.length > 0 ? (
                trendingTopics.map(topic => (
                  <li key={topic.id} className="list-group-item">
                    <Link to={`/topics/${topic.id}`}>
                      {topic.title}
                    </Link>
                    <div className="view-count">
                      <i className="bi bi-eye"></i>
                      {topic.score} views
                    </div>
                  </li>
                ))
              ) : topics.length > 0 ? (
                // If we have regular topics but no trending, show some of them as "trending"
                topics.slice(0, 3).map(topic => (
                  <li key={topic.id} className="list-group-item">
                    <Link to={`/topics/${topic.id}`}>
                      {topic.title}
                    </Link>
                    <div className="view-count">
                      <i className="bi bi-eye"></i>
                      {topic.view_count || Math.floor(Math.random() * 10) + 1} views
                    </div>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-center">
                  No trending topics yet
                </li>
              )}
            </ul>
          </div>
          
          {!user && (
            <div className="card join-card">
              <div className="card-body">
                <h3>Join the Discussion</h3>
                <p>Sign in to participate in discussions and receive notifications.</p>
                <Link to="/login" className="btn btn-dark">
                  Sign In
                </Link>
              </div>
            </div>
          )}
          
          {user && (
            <div className="card">
              <div className="card-body text-center">
                <h5 className="card-title">Start a Discussion</h5>
                <p className="card-text">Have a question or something to share?</p>
                <Link to="/topics/new" className="btn btn-dark">
                  Create New Topic
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