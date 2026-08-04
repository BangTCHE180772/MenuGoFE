import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { notification } from 'antd';
import { useSignalR } from '../context/SignalRContext';
import SideBar from '../components/SideBar';
import ToTop from '../components/ToTop';

/**
 * Layout chính của app sau khi đăng nhập
 * Bao gồm: SideBar cố định bên trái (có thể thu gọn/mở rộng) + nội dung trang tự điều chỉnh kích thước + nút ToTop
 */
const MainLayout = () => {
  const connection = useSignalR();
  const location = useLocation();
  const isFluid = location.pathname.startsWith('/product-catalog') || location.pathname.startsWith('/inventory-management');

  // Sidebar collapse state initialized from localStorage
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const nextState = !prev;
      localStorage.setItem('sidebar_collapsed', String(nextState));
      // Dispatch resize event so Recharts & responsive containers auto-reflow cleanly
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 200);
      return nextState;
    });
  };

  useEffect(() => {
    if (connection) {
      const handleNotification = (data) => {
        if (data.type === 'cooking-status-changed' && data.cookingStatus !== 'Ready') {
          return;
        }

        let title = 'Thông báo hệ thống';
        if (data.type === 'cooking-status-changed') {
          title = 'Thông báo từ Bếp';
        } else if (data.type === 'new-order') {
          title = 'Đơn hàng mới';
        } else if (data.type === 'call-staff') {
          title = 'Khách gọi phục vụ';
        }

        notification.info({
          message: title,
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
    <div className={`main-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <SideBar collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />
      <div className="main-content-wrapper">
        <main className={`main-content ${isFluid ? 'fluid' : ''}`}>
          <Outlet />
        </main>
      </div>
      <ToTop />
    </div>
  );
};

export default MainLayout;
