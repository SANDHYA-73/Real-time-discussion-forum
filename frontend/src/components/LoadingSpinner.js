import React from 'react';

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="text-center my-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      <p className="mt-2">{text}</p>
    </div>
  );
};

export default LoadingSpinner;