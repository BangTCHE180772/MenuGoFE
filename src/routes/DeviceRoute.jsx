import { Navigate, Outlet } from 'react-router-dom';
import { useDevice } from '../context/DeviceContext';

/**
 * Bảo vệ route: yêu cầu thiết bị đã được cấp quyền (có device_token)
 * Nếu không có device_token → redirect về /login
 *
 * Dùng cho màn thu ngân / điểm danh
 */
const DeviceRoute = () => {
  const { isDeviceAuthorized } = useDevice();

  if (!isDeviceAuthorized) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default DeviceRoute;
