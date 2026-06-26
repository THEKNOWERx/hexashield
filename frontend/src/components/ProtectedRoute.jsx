"use client";
import React from 'react';

// TODO: handle react-router-dom imports: Navigate, Outlet


const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const decoded = parseJwt(token);
  if (!decoded || !decoded.role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
    // If user's role is not allowed, redirect to dashboard or an unauthorized page
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
