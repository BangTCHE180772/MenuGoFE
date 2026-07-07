import { createContext, useContext, useState } from 'react';

const DEVICE_TOKEN_KEY = 'device_token';

const DeviceContext = createContext(null);

export const DeviceProvider = ({ children }) => {
  const [deviceToken, setDeviceToken] = useState(
    () => localStorage.getItem(DEVICE_TOKEN_KEY)
  );

  const isDeviceAuthorized = !!deviceToken;

  /**
   * Lưu device_token (Manager gọi khi cấp quyền cho thiết bị này)
   * @param {string} token
   */
  const authorizeDevice = (token) => {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    setDeviceToken(token);
  };

  /**
   * Xóa device_token (thu hồi quyền khỏi thiết bị này)
   */
  const revokeDevice = () => {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
    setDeviceToken(null);
  };

  const value = {
    deviceToken,
    isDeviceAuthorized,
    authorizeDevice,
    revokeDevice,
  };

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice phải được dùng bên trong <DeviceProvider>');
  }
  return context;
};
