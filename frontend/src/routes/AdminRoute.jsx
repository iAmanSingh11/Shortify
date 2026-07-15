import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';

// Guards routes so only users with role === 'admin' can reach them. Assumes
// it is nested inside <ProtectedRoute /> (or run after auth has resolved),
// but checks isLoading defensively anyway.
const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loader fullScreen />;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default AdminRoute;
