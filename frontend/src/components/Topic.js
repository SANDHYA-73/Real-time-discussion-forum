import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

const Topic = ({ topic }) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between">
          <h5 className="card-title">
            <Link to={`/topics/${topic.id}`}>
              {topic.title}
            </Link>
          </h5>
          <span className="badge bg-dark d-flex align-items-center">
            <i className="bi bi-chat-dots me-1"></i>
            {topic.comments_count}
          </span>
        </div>
        
        <p className="card-text text-truncate">{topic.content}</p>
        
        <div className="d-flex justify-content-between align-items-center">
          <div className="small text-muted">
            Posted by <Link to={`/users/${topic.user.id}`}>{topic.user.username}</Link>
            {' • '}{moment(topic.created_at).fromNow()}
          </div>
          <div className="small text-muted">
            <i className="bi bi-eye me-1"></i>
            {topic.view_count} views
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topic;