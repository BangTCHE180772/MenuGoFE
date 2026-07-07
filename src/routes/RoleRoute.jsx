import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

/**
 * Bảo vệ route: yêu cầu role cụ thể
 * @param {{ allowedRoles: string[] }} props
 *
 * @example
 * // Chỉ Manager, Owner, Admin mới vào được
 * <Route element={<RoleRoute allowedRoles={['Manager', 'Owner', 'Admin']} />}>
 *   <Route path="/accounts" element={<AccountsPage />} />
 * </Route>
 */
const RoleRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return <Spinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
};

export default RoleRoute;
