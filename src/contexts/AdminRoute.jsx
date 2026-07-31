import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './AuthContext';

export const AdminRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};
