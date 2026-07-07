import { Outlet } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ToTop from '../components/ToTop';

/**
 * Layout chính của app sau khi đăng nhập
 * Bao gồm: TopBar cố định trên cùng + nội dung trang + nút ToTop
 */
const MainLayout = () => {
  return (
    <div className="main-layout">
      <TopBar />
      <main className="main-content">
        <Outlet />
      </main>
      <ToTop />
    </div>
  );
};

export default MainLayout;
