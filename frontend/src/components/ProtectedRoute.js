import React from 'react';
import { Navigate } from 'react-router-dom';

// This component is a "wrapper"
const ProtectedRoute = ({ children }) => {
  // Check if a token exists in localStorage
  const token = localStorage.getItem('token');

  if (!token) {
    // If no token, redirect the user to the /login page
    return <Navigate to="/login" replace />;
  }

  // If a token exists, render the component that was passed in
  // (e.g., the Dashboard)
  return children;
};

export default ProtectedRoute;