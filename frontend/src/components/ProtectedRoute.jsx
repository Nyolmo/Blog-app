import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, autoLogoutIfExpired, getUserInfo } from '../auth';

export default function ProtectedRoute({ children, requireStaff = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = isAuthenticated();
  const user = getUserInfo();

  useEffect(() => {
    autoLogoutIfExpired(navigate);
  }, [navigate]);

  // ❌ Not authenticated → redirect to login with ?next=originalPath
  if (!isAuth) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // ❌ Not authorized (e.g. not staff)
  if (requireStaff && (!user || !user.is_staff)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Authenticated and authorized
  return children;
}