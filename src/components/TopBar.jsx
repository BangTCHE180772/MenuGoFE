import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown, Avatar, message } from 'antd';
import {
  HomeOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  CalendarOutlined,
  ShopOutlined,
  ApartmentOutlined,
  TableOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  CrownOutlined,
  DesktopOutlined,
  BookOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useAuth, ROLES } from '../context/AuthContext';

// ─── Menu items theo từng role ─────────────────────────────────────────────
const ROLE_MENUS = {
  [ROLES.ADMIN]: [
    { label: 'Tổng quan', path: '/home', icon: <HomeOutlined /> },
    { label: 'Thu ngân', path: '/cashier', icon: <DesktopOutlined /> },
    { label: 'Sơ đồ bàn', path: '/table-map', icon: <TableOutlined /> },
    { label: 'Đặt bàn', path: '/reservations', icon: <BookOutlined /> },
    { label: 'Chuỗi', path: '/chains', icon: <ApartmentOutlined /> },
    { label: 'Chi nhánh', path: '/branches', icon: <ShopOutlined /> },
    { label: 'Thực đơn', path: '/menu-management', icon: <BookOutlined /> },
    { label: 'Khuyến mãi', path: '/vouchers', icon: <GiftOutlined /> },
    { label: 'Nhân sự', path: '/accounts', icon: <TeamOutlined /> },
    { label: 'Lịch làm việc', path: '/work-schedule', icon: <CalendarOutlined /> },
    { label: 'Đơn hàng', path: '/orders', icon: <ShoppingCartOutlined /> },
    { label: 'Quản lý bàn', path: '/tables', icon: <TableOutlined /> },
    { label: 'Quản trị', path: '/admin', icon: <SettingOutlined /> },
  ],
  [ROLES.OWNER]: [
    { label: 'Tổng quan', path: '/home', icon: <HomeOutlined /> },
    { label: 'Thu ngân', path: '/cashier', icon: <DesktopOutlined /> },
    { label: 'Sơ đồ bàn', path: '/table-map', icon: <TableOutlined /> },
    { label: 'Đặt bàn', path: '/reservations', icon: <BookOutlined /> },
    { label: 'Chuỗi', path: '/chains', icon: <ApartmentOutlined /> },
    { label: 'Chi nhánh', path: '/branches', icon: <ShopOutlined /> },
    { label: 'Thực đơn', path: '/menu-management', icon: <BookOutlined /> },
    { label: 'Khuyến mãi', path: '/vouchers', icon: <GiftOutlined /> },
    { label: 'Nhân sự', path: '/accounts', icon: <TeamOutlined /> },
    { label: 'Lịch làm việc', path: '/work-schedule', icon: <CalendarOutlined /> },
    { label: 'Đơn hàng', path: '/orders', icon: <ShoppingCartOutlined /> },
  ],
  [ROLES.MANAGER]: [
    { label: 'Tổng quan', path: '/home', icon: <HomeOutlined /> },
    { label: 'Thu ngân', path: '/cashier', icon: <DesktopOutlined /> },
    { label: 'Sơ đồ bàn', path: '/table-map', icon: <TableOutlined /> },
    { label: 'Đặt bàn', path: '/reservations', icon: <BookOutlined /> },
    { label: 'Thực đơn', path: '/menu-management', icon: <BookOutlined /> },
    { label: 'Khuyến mãi', path: '/vouchers', icon: <GiftOutlined /> },
    { label: 'Nhân sự', path: '/accounts', icon: <TeamOutlined /> },
    { label: 'Lịch làm việc', path: '/work-schedule', icon: <CalendarOutlined /> },
    { label: 'Đơn hàng', path: '/orders', icon: <ShoppingCartOutlined /> },
    { label: 'Quản lý bàn', path: '/tables', icon: <TableOutlined /> },
  ],
  [ROLES.CASHIER]: [
    { label: 'Tổng quan', path: '/home', icon: <HomeOutlined /> },
    { label: 'Thu ngân', path: '/cashier', icon: <DesktopOutlined /> },
    { label: 'Sơ đồ bàn', path: '/table-map', icon: <TableOutlined /> },
    { label: 'Đặt bàn', path: '/reservations', icon: <BookOutlined /> },
    { label: 'Đơn hàng', path: '/orders', icon: <ShoppingCartOutlined /> },
  ],
  [ROLES.CHEF]: [
    { label: 'Tổng quan', path: '/home', icon: <HomeOutlined /> },
    { label: 'Lịch làm việc', path: '/work-schedule', icon: <CalendarOutlined /> },
  ],
  [ROLES.WAITER]: [
    { label: 'Tổng quan', path: '/home', icon: <HomeOutlined /> },
    { label: 'Sơ đồ bàn', path: '/table-map', icon: <TableOutlined /> },
    { label: 'Đơn hàng', path: '/orders', icon: <ShoppingCartOutlined /> },
  ],
};

// ─── Hiển thị role bằng tiếng Việt ───────────────────────────────────────
const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.OWNER]: 'Chủ sở hữu',
  [ROLES.MANAGER]: 'Quản lý',
  [ROLES.CASHIER]: 'Thu ngân',
  [ROLES.CHEF]: 'Bếp trưởng',
  [ROLES.WAITER]: 'Phục vụ',
};

const TopBar = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = ROLE_MENUS[role] ?? [];

  const handleLogout = async () => {
    await logout();
    message.success('Đã đăng xuất');
    navigate('/login');
  };

  // Dropdown menu khi click vào avatar/tên user
  const userDropdownItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      disabled: true, // TODO: thêm trang profile sau
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header className="topbar">
      {/* Logo */}
      <Link to="/home" className="topbar-logo">
        <span className="topbar-logo-icon">🍜</span>
        <span className="topbar-logo-text">MenuGo</span>
      </Link>

      {/* Navigation */}
      <nav className="topbar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`topbar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User info */}
      <div className="topbar-right">
        <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" arrow>
          <div className="topbar-user">
            <Avatar
              icon={<UserOutlined />}
              src={user?.avatarImage}
              className="topbar-avatar"
            />
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user?.name ?? 'Người dùng'}</span>
              <span className="topbar-user-role">
                <CrownOutlined style={{ fontSize: 10, marginRight: 3 }} />
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default TopBar;
