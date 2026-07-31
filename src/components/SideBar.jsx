import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dropdown, Avatar, message, Select, Tooltip, Button } from "antd";
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
  FireOutlined,
  GiftOutlined,
  RocketOutlined,
  FileProtectOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  InboxOutlined,
  DollarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useAuth, ROLES } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";

// ─── Menu items theo từng role ─────────────────────────────────────────────
const ROLE_MENUS = {
  [ROLES.ADMIN]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Hiệu quả Kinh Doanh", path: "/financedashboard", icon: <BarChartOutlined /> },
    { label: "Hiệu quả Vận hành", path: "/orderdashboard", icon: <BarChartOutlined /> },
    { label: "Thu ngân", path: "/cashier", icon: <DollarOutlined /> },
    { label: "Màn hình Bếp", path: "/kds", icon: <FireOutlined /> },
    { label: "Sơ đồ bàn", path: "/table-map", icon: <TableOutlined /> },
    { label: "Đơn hàng", path: "/orders", icon: <ShoppingCartOutlined /> },
    { label: "Đặt bàn", path: "/reservations", icon: <BookOutlined /> },
    { label: "Khuyến mãi", path: "/vouchers", icon: <GiftOutlined /> },
    { label: "Thiết bị", path: "/device-management", icon: <DesktopOutlined /> },
    { label: "Chuỗi", path: "/chains", icon: <ShopOutlined /> },
    { label: "Chi nhánh", path: "/branches", icon: <ApartmentOutlined /> },
    { label: "Danh mục sản phẩm", path: "/product-catalog", icon: <AppstoreOutlined /> },
    { label: "Quản lý kho", path: "/inventory-management", icon: <InboxOutlined /> },
    { label: "Thực đơn", path: "/menu-management", icon: <BookOutlined /> },
    { label: "Nhân sự", path: "/accounts", icon: <TeamOutlined /> },
    { label: "Hợp đồng", path: "/contracts", icon: <FileProtectOutlined /> },
    { label: "Bảng lương", path: "/payroll", icon: <DollarOutlined /> },
    { label: "Chi tiết lương", path: "/salary-details", icon: <FileTextOutlined /> },
    { label: "Ca làm việc", path: "/shifts", icon: <ClockCircleOutlined /> },
    { label: "Lịch làm việc", path: "/work-schedule", icon: <CalendarOutlined /> },
    { label: "Quản lý bàn", path: "/tables", icon: <TableOutlined /> },
    { label: "Quản trị", path: "/admin", icon: <SettingOutlined /> },
  ],
  [ROLES.OWNER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Hiệu quả KD", path: "/financedashboard", icon: <BarChartOutlined /> },
    { label: "Hiệu quả Vận hành", path: "/orderdashboard", icon: <BarChartOutlined /> },
    { label: "Khuyến mãi", path: "/vouchers", icon: <GiftOutlined /> },
    { label: "Thiết bị", path: "/device-management", icon: <DesktopOutlined /> },
    { label: "Chuỗi", path: "/chains", icon: <ShopOutlined /> },
    { label: "Chi nhánh", path: "/branches", icon: <ApartmentOutlined /> },
    { label: "Danh mục sản phẩm", path: "/product-catalog", icon: <AppstoreOutlined /> },
    { label: "Quản lý kho", path: "/inventory-management", icon: <InboxOutlined /> },
    { label: "Thực đơn", path: "/menu-management", icon: <BookOutlined /> },
    { label: "Nhân sự", path: "/accounts", icon: <TeamOutlined /> },
    { label: "Hợp đồng", path: "/contracts", icon: <FileProtectOutlined /> },
    { label: "Bảng lương", path: "/payroll", icon: <DollarOutlined /> },
    { label: "Chi tiết lương", path: "/salary-details", icon: <FileTextOutlined /> },
    { label: "Ca làm việc", path: "/shifts", icon: <ClockCircleOutlined /> },
    { label: "Lịch làm việc", path: "/work-schedule", icon: <CalendarOutlined /> },
    { label: "Quản lý bàn", path: "/tables", icon: <TableOutlined /> },
  ],
  [ROLES.MANAGER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Hiệu quả KD", path: "/financedashboard", icon: <BarChartOutlined /> },
    { label: "Hiệu quả Vận hành", path: "/orderdashboard", icon: <BarChartOutlined /> },
    { label: "Đặt bàn", path: "/reservations", icon: <BookOutlined /> },
    { label: "Phiên Phục vụ", path: "/waiter-session", icon: <RocketOutlined /> },
    { label: "Thiết bị", path: "/device-management", icon: <DesktopOutlined /> },
    { label: "Khuyến mãi", path: "/vouchers", icon: <GiftOutlined /> },
    { label: "Danh mục sản phẩm", path: "/product-catalog", icon: <AppstoreOutlined /> },
    { label: "Quản lý kho", path: "/inventory-management", icon: <InboxOutlined /> },
    { label: "Thực đơn", path: "/menu-management", icon: <BookOutlined /> },
    { label: "Nhân sự", path: "/accounts", icon: <TeamOutlined /> },
    { label: "Hợp đồng", path: "/contracts", icon: <FileProtectOutlined /> },
    { label: "Bảng lương", path: "/payroll", icon: <DollarOutlined /> },
    { label: "Chi tiết lương", path: "/salary-details", icon: <FileTextOutlined /> },
    { label: "Ca làm việc", path: "/shifts", icon: <ClockCircleOutlined /> },
    { label: "Lịch làm việc", path: "/work-schedule", icon: <CalendarOutlined /> },
    { label: "Quản lý bàn", path: "/tables", icon: <TableOutlined /> },
  ],
  [ROLES.CASHIER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Lịch làm việc", path: "/work-schedule", icon: <CalendarOutlined /> },
  ],
  [ROLES.CHEF]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Lịch làm việc", path: "/work-schedule", icon: <CalendarOutlined /> },
  ],
  [ROLES.WAITER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Phiên Phục vụ", path: "/waiter-session", icon: <RocketOutlined /> },
    { label: "Lịch làm việc", path: "/work-schedule", icon: <CalendarOutlined /> },
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

const SideBar = ({ collapsed, onToggleCollapse }) => {
  const { user, role, logout } = useAuth();
  const { currentBranchId, selectBranch, branches } = useBranch();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = ROLE_MENUS[role] ?? [];

  const handleLogout = async () => {
    await logout();
    message.success("Đã đăng xuất");
    navigate("/login");
  };

  const userMenuItems = [
    {
      key: "user-info",
      label: (
        <div style={{ padding: "4px 8px" }}>
          <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
            {user?.name || user?.fullName || "Người dùng"}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {user?.email || ""}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin tài khoản",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar Header: Logo & Toggle Button */}
      <div className="sidebar-header">
        <Link to="/home" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <CrownOutlined style={{ fontSize: 22, color: "var(--color-primary)" }} />
          </div>
          {!collapsed && <span className="sidebar-logo-text">MenuGo</span>}
        </Link>
        <Button
          type="text"
          className="sidebar-toggle-btn"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          title={collapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
        />
      </div>

      {/* Branch Selector */}
      {branches && branches.length > 0 && (
        <div className="sidebar-branch-wrapper">
          {!collapsed ? (
            <Select
              className="sidebar-branch-select"
              value={currentBranchId || undefined}
              onChange={(value) => selectBranch(value)}
              placeholder="Chọn chi nhánh"
              options={branches.map((b) => ({
                label: (
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    <ShopOutlined style={{ marginRight: 6, color: "var(--color-primary)" }} />
                    {b.name}
                  </span>
                ),
                value: b.id,
              }))}
            />
          ) : (
            <Tooltip title="Đổi chi nhánh" placement="right">
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: branches.map((b) => ({
                    key: b.id,
                    label: b.name,
                    icon: <ShopOutlined />,
                    onClick: () => selectBranch(b.id),
                  })),
                  selectedKeys: [String(currentBranchId)],
                }}
              >
                <Button
                  type="text"
                  className="sidebar-branch-collapsed-btn"
                  icon={<ShopOutlined style={{ color: "var(--color-primary)", fontSize: 18 }} />}
                />
              </Dropdown>
            </Tooltip>
          )}
        </div>
      )}

      {/* Sidebar Nav List */}
      <nav className="sidebar-nav">
        {menuItems.map((item, idx) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/home" && location.pathname.startsWith(item.path));

          const navLinkContent = (
            <Link
              key={idx}
              to={item.path}
              state={{ from: location }}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={idx} title={item.label} placement="right">
                {navLinkContent}
              </Tooltip>
            );
          }

          return navLinkContent;
        })}
      </nav>

      {/* Sidebar Footer: User Info & Logout */}
      <div className="sidebar-footer">
        <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="topRight">
          <div className="sidebar-user">
            <Avatar className="sidebar-avatar" icon={<UserOutlined />} />
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">
                  {user?.name || user?.fullName || "Người dùng"}
                </span>
                <span className="sidebar-user-role">
                  {ROLE_LABELS[role] || role || "Nhân viên"}
                </span>
              </div>
            )}
          </div>
        </Dropdown>
        {!collapsed && (
          <Tooltip title="Đăng xuất" placement="right">
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="sidebar-logout-btn"
            />
          </Tooltip>
        )}
      </div>
    </aside>
  );
};

export default SideBar;
