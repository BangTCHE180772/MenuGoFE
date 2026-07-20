import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDevice } from '../context/DeviceContext';
import { Button, Tooltip } from 'antd';
import { LogoutOutlined, LockOutlined, DesktopOutlined, LoginOutlined } from '@ant-design/icons';
import { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import DeviceEmployeeLoginModal from '../components/DeviceEmployeeLoginModal';
import '../styles/devicelayout.css';

const DeviceLayout = () => {
  const { deviceInfo, deviceEmployee, logoutEmployee, resetDevice } = useDevice();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginVisible, setLoginVisible] = useState(false);
  const [scannedEmail, setScannedEmail] = useState('');
  const pressTimerRef = useRef(null);
  const connectionRef = useRef(null);

  useEffect(() => {
    if (!deviceEmployee && deviceInfo && deviceInfo.deviceType === 'POS') {
      if (!loginVisible) setLoginVisible(true);
    }
  }, [deviceEmployee, deviceInfo, loginVisible]);

  useEffect(() => {
    const { deviceToken } = useDevice.getState ? useDevice.getState() : { deviceToken: localStorage.getItem('device_token') };
    const tokenToUse = deviceToken || localStorage.getItem('device_token');
    
    if (!tokenToUse || !deviceInfo?.isActive) return;

    const setupSignalR = async () => {
      const conn = new HubConnectionBuilder()
        .withUrl('http://localhost:5067/notificationHub')
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      conn.on('DeviceAuthScanned', (data) => {
        setScannedEmail(data.email);
        setLoginVisible(true);
      });

      try {
        await conn.start();
        await conn.invoke('JoinDeviceGroup', tokenToUse);
        connectionRef.current = conn;
      } catch (e) {
        console.error('SignalR Connection Error: ', e);
      }
    };

    setupSignalR();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [deviceInfo?.isActive]);

  const handleLoginSuccess = (employee) => {
    setLoginVisible(false);
  };

  const startPress = () => {
    pressTimerRef.current = setTimeout(() => {
      const pin = prompt("Nhập mã PIN để reset thiết bị:");
      if (pin === "123456") {
        resetDevice();
        navigate('/login');
      }
    }, 5000);
  };
  const endPress = () => clearTimeout(pressTimerRef.current);

  return (
    <div className="device-layout">
      {/* Device Header */}
      <header className="device-header">
        <div
          className="device-header-left"
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
        >
          <DesktopOutlined className="device-icon" />
          <div className="device-info">
            <span className="device-name">{deviceInfo?.name || 'Thiết bị quán'}</span>
            <span className="device-type">
              {deviceInfo?.deviceType === 'POS' && 'Máy Thu Ngân'}
              {deviceInfo?.deviceType === 'Waiter' && 'Máy Phục Vụ'}
              {deviceInfo?.deviceType === 'Kitchen' && 'Màn Hình Bếp'}
              {deviceInfo?.deviceType === 'Attendance' && 'Máy Điểm Danh'}
            </span>
          </div>
        </div>

        <div className="device-header-right">
          {deviceEmployee ? (
            <div className="device-employee">
              <span className="employee-name">👤 {deviceEmployee.name}</span>
              {deviceInfo?.deviceType === 'Waiter' ? (
                <Tooltip title="Khóa màn hình (Quay về sơ đồ bàn)">
                  <Button type="text" icon={<LockOutlined />} onClick={logoutEmployee} danger>
                    Khóa
                  </Button>
                </Tooltip>
              ) : (
                <Button type="text" icon={<LogoutOutlined />} onClick={logoutEmployee} danger>
                  Đăng xuất
                </Button>
              )}
            </div>
          ) : (
            <div className="device-status-container" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="device-status">Trạng thái: Sẵn sàng</span>
              <Button type="primary" icon={<LoginOutlined />} onClick={() => setLoginVisible(true)}>
                Đăng nhập
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="device-content">
        {deviceInfo?.isActive === false ? (
          <div className="device-revoked">
            <h2>⛔ THIẾT BỊ ĐÃ BỊ THU HỒI QUYỀN</h2>
            <p>Vui lòng liên hệ quản lý để biết thêm chi tiết.</p>
            <p className="hint">Nhấn giữ logo góc trái 5 giây để cài đặt lại.</p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <DeviceEmployeeLoginModal
        open={loginVisible}
        prefillEmail={scannedEmail}
        onCancel={() => {
          // Ngăn không cho tắt modal nếu là POS
          if (deviceInfo?.deviceType === 'POS') {
            return;
          }
          setLoginVisible(false);
          setScannedEmail('');
        }}
        onSuccess={(emp) => {
          handleLoginSuccess(emp);
          setScannedEmail('');
        }}
      />
    </div>
  );
};

export default DeviceLayout;
