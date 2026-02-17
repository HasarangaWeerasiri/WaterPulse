import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, initializing } = useAuth();

  // Show loading state while auth is being verified
  if (initializing) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but user data isn't loaded yet, wait a moment
  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`User role '${user.role}' not in allowed roles:`, allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
