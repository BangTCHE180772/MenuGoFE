import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dropdown, Avatar, message } from "antd";
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
  FileProtectOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useAuth, ROLES } from "../context/AuthContext";

// ─── Menu items theo từng role ─────────────────────────────────────────────
const ROLE_MENUS = {
  [ROLES.ADMIN]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Sơ đồ bàn", path: "/table-map", icon: <TableOutlined /> },
    { label: "Đặt bàn", path: "/reservations", icon: <BookOutlined /> },
    { label: "Khuyến mãi", path: "/vouchers", icon: <GiftOutlined /> },
    { label: "Thiết bị", path: "/device-management", icon: <DesktopOutlined /> },
    { label: "Chuỗi", path: "/chains", icon: <ShopOutlined /> },
    { label: "Chi nhánh", path: "/branches", icon: <ApartmentOutlined /> },
    { label: "Thực đơn", path: "/menu-management", icon: <BookOutlined /> },
    { label: "Nhân sự", path: "/accounts", icon: <TeamOutlined /> },
    { label: "Hợp đồng", path: "/contracts", icon: <FileProtectOutlined /> },
    { label: "Ca làm việc", path: "/shifts", icon: <ClockCircleOutlined /> },
    {
      label: "Lịch làm việc",
      path: "/work-schedule",
      icon: <CalendarOutlined />,
    },
    { label: "Đơn hàng", path: "/orders", icon: <ShoppingCartOutlined /> },
    { label: "Quản lý bàn", path: "/tables", icon: <TableOutlined /> },
    { label: "Quản trị", path: "/admin", icon: <SettingOutlined /> },
  ],
  [ROLES.OWNER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Sơ đồ bàn", path: "/table-map", icon: <TableOutlined /> },
    { label: "Đặt bàn", path: "/reservations", icon: <BookOutlined /> },
    { label: "Khuyến mãi", path: "/vouchers", icon: <GiftOutlined /> },
    { label: "Thiết bị", path: "/device-management", icon: <DesktopOutlined /> },
    { label: "Chuỗi", path: "/chains", icon: <ShopOutlined /> },
    { label: "Chi nhánh", path: "/branches", icon: <ApartmentOutlined /> },
    { label: "Thực đơn", path: "/menu-management", icon: <BookOutlined /> },
    { label: "Nhân sự", path: "/accounts", icon: <TeamOutlined /> },
    { label: "Hợp đồng", path: "/contracts", icon: <FileProtectOutlined /> },
    { label: "Ca làm việc", path: "/shifts", icon: <ClockCircleOutlined /> },
    {
      label: "Lịch làm việc",
      path: "/work-schedule",
      icon: <CalendarOutlined />,
    },
    { label: "Đơn hàng", path: "/orders", icon: <ShoppingCartOutlined /> },
  ],
  [ROLES.MANAGER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Sơ đồ bàn", path: "/table-map", icon: <TableOutlined /> },
    { label: "Đặt bàn", path: "/reservations", icon: <BookOutlined /> },
    { label: "Thiết bị", path: "/device-management", icon: <DesktopOutlined /> },
    { label: "Khuyến mãi", path: "/vouchers", icon: <GiftOutlined /> },
    { label: "Thực đơn", path: "/menu-management", icon: <BookOutlined /> },
    { label: "Nhân sự", path: "/accounts", icon: <TeamOutlined /> },
    { label: "Hợp đồng", path: "/contracts", icon: <FileProtectOutlined /> },
    { label: "Ca làm việc", path: "/shifts", icon: <ClockCircleOutlined /> },
    {
      label: "Lịch làm việc",
      path: "/work-schedule",
      icon: <CalendarOutlined />,
    },
    { label: "Đơn hàng", path: "/orders", icon: <ShoppingCartOutlined /> },
    { label: "Quản lý bàn", path: "/tables", icon: <TableOutlined /> },
  ],
  [ROLES.CASHIER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Lịch làm việc", path: "/work-schedule", icon: <CalendarOutlined /> },
    { label: "Sơ đồ bàn", path: "/table-map", icon: <TableOutlined /> },
    { label: "Đặt bàn", path: "/reservations", icon: <BookOutlined /> },
    { label: "Đơn hàng", path: "/orders", icon: <ShoppingCartOutlined /> },
  ],
  [ROLES.CHEF]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    {
      label: "Lịch làm việc",
      path: "/work-schedule",
      icon: <CalendarOutlined />,
    },
  ],
  [ROLES.WAITER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Lịch làm việc", path: "/work-schedule", icon: <CalendarOutlined /> },
    { label: "Sơ đồ bàn", path: "/table-map", icon: <TableOutlined /> },
    { label: "Đơn hàng", path: "/orders", icon: <ShoppingCartOutlined /> },
  ],
};

// ─── Hiển thị role bằng tiếng Việt ───────────────────────────────────────
const ROLE_LABELS = {
  [ROLES.ADMIN]: "Quản trị viên",
  [ROLES.OWNER]: "Chủ sở hữu",
  [ROLES.MANAGER]: "Quản lý",
  [ROLES.CASHIER]: "Thu ngân",
  [ROLES.CHEF]: "Bếp trưởng",
  [ROLES.WAITER]: "Phục vụ",
};

const TopBar = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = ROLE_MENUS[role] ?? [];

  const handleLogout = async () => {
    await logout();
    message.success("Đã đăng xuất");
    navigate("/login");
  };

  // Dropdown menu khi click vào avatar/tên user
  const userDropdownItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
      disabled: true, // TODO: thêm trang profile sau
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const logoUrl = "/src/assets/logo.png";

  return (
    <header className="topbar">
      {/* Logo */}
      <Link to="/home" className="topbar-logo">
        <span className="topbar-logo-icon">
          {logoUrl && logoUrl.trim() !== "" ? (
            <img src={logoUrl} alt="Logo" />
          ) : (
            "🍜"
          )}
        </span>
        <span className="topbar-logo-text">MenuGo</span>
      </Link>

      {/* Navigation */}
      <nav className="topbar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`topbar-nav-item ${location.pathname === item.path ? "active" : ""}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User info */}
      <div className="topbar-right">
        <Dropdown
          menu={{ items: userDropdownItems }}
          placement="bottomRight"
          arrow
        >
          <div className="topbar-user">
            <Avatar
              icon={<UserOutlined />}
              src={user?.avatarImage}
              className="topbar-avatar"
            />
            <div className="topbar-user-info">
              <span className="topbar-user-name">
                {user?.name ?? "Người dùng"}
              </span>
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
