import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { notification } from 'antd';
import { useSignalR } from '../context/SignalRContext';
import TopBar from '../components/TopBar';
import ToTop from '../components/ToTop';

/**
 * Layout chính của app sau khi đăng nhập
 * Bao gồm: TopBar cố định trên cùng + nội dung trang + nút ToTop
 */
const MainLayout = () => {
  const connection = useSignalR();
  const location = useLocation();
  const isFluid = location.pathname.startsWith('/product-catalog');

  useEffect(() => {
    if (connection) {
      const handleNotification = (data) => {
        notification.info({
          message: 'Thông báo từ khách hàng',
          description: data.message,
          placement: 'topRight',
          duration: 5,
        });
      };

      connection.on('ReceiveNotification', handleNotification);

      return () => {
        connection.off('ReceiveNotification', handleNotification);
      };
    }
  }, [connection]);

  return (
    <div className="main-layout">
      <TopBar />
      <main className={`main-content ${isFluid ? 'fluid' : ''}`}>
        <Outlet />
      </main>
      <ToTop />
    </div>
  );
};

export default MainLayout;
