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
  FireOutlined,
  GiftOutlined,
  LeftOutlined,
  RightOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useAuth, ROLES } from "../context/AuthContext";
import { useRef, useState, useEffect } from "react";

// ─── Menu items theo từng role ─────────────────────────────────────────────
const ROLE_MENUS = {
  [ROLES.ADMIN]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Khuyến mãi", path: "/vouchers", icon: <GiftOutlined /> },
    { label: "Thiết bị", path: "/device-management", icon: <DesktopOutlined /> },
    { label: "Chuỗi", path: "/chains", icon: <ShopOutlined /> },
    { label: "Màn hình Bếp", path: "/kds", icon: <FireOutlined /> },
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
    { label: "Quản lý bàn", path: "/tables", icon: <TableOutlined /> },
    { label: "Quản trị", path: "/admin", icon: <SettingOutlined /> },
  ],
  [ROLES.OWNER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
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
  ],
  [ROLES.MANAGER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Đặt bàn", path: "/reservations", icon: <BookOutlined /> },
    { label: "Phiên Phục vụ", path: "/waiter-session", icon: <RocketOutlined /> },
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
    { label: "Quản lý bàn", path: "/tables", icon: <TableOutlined /> },
  ],
  [ROLES.CASHIER]: [
    { label: "Tổng quan", path: "/home", icon: <HomeOutlined /> },
    { label: "Lịch làm việc", path: "/work-schedule", icon: <CalendarOutlined /> },
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

  // ─── Scroll & Drag-to-scroll logic ──────────────────────────────────────────
  const navRef = useRef(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(false);

  // Drag-to-scroll mouse states
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const updateScrollButtons = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setShowLeftBtn(scrollLeft > 5);
      setShowRightBtn(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const el = navRef.current;
    if (el) {
      updateScrollButtons();
      el.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", updateScrollButtons);
      }
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [menuItems]);

  const scrollNav = (direction) => {
    if (navRef.current) {
      const scrollAmount = 200;
      navRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Mouse Drag Events
  const handleMouseDown = (e) => {
    if (!navRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - navRef.current.offsetLeft);
    setScrollLeftState(navRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
    if (navRef.current) {
      navRef.current.classList.remove("dragging");
    }
  };

  const handleMouseUp = () => {
    setIsDown(false);
    if (navRef.current) {
      navRef.current.classList.remove("dragging");
    }
  };

  const handleMouseMove = (e) => {
    if (!isDown || !navRef.current) return;
    e.preventDefault();
    const x = e.pageX - navRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Tốc độ cuộn chuột

    // Chỉ kích hoạt chế độ dragging khi kéo chuột di chuyển nhiều hơn 5px
    if (Math.abs(x - startX) > 5) {
      navRef.current.classList.add("dragging");
    }

    navRef.current.scrollLeft = scrollLeftState - walk;
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

      {/* Navigation với thanh trượt / kéo chuột */}
      <div className="topbar-nav-wrapper">
        {showLeftBtn && (
          <button className="topbar-scroll-btn scroll-left" onClick={() => scrollNav("left")}>
            <LeftOutlined />
          </button>
        )}

        <nav
          ref={navRef}
          className="topbar-nav"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
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

        {showRightBtn && (
          <button className="topbar-scroll-btn scroll-right" onClick={() => scrollNav("right")}>
            <RightOutlined />
          </button>
        )}
      </div>

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
