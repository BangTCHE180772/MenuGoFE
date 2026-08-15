import  { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, Button } from "antd";
import { useAuth } from "../../context/AuthContext";
import {
  MenuOutlined,
  ShopOutlined,
  AppstoreOutlined,
  HomeOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const CustomerHeader = ({ chainInfo, activeSection, onNavigate }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { key: "hero", label: "Trang chủ", icon: <HomeOutlined /> },
    { key: "menu", label: "Thực đơn", icon: <AppstoreOutlined /> },
    { key: "branches", label: "Chi nhánh", icon: <EnvironmentOutlined /> },
  ];

  const handleNavClick = (key) => {
    onNavigate(key);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`customer-header ${scrolled ? "scrolled" : ""}`}>
      <div className="header-container">
        <div className="header-brand" onClick={() => handleNavClick("hero")}>
          {chainInfo?.logoImage ? (
            <img
              src={chainInfo.logoImage}
              alt={chainInfo.name || "Logo"}
              className="brand-logo"
            />
          ) : (
            <div className="brand-logo-fallback">
              <ShopOutlined />
            </div>
          )}
          <div className="brand-info">
            <span className="brand-name">
              {chainInfo?.name || "Nhà Hàng MenuGo"}
            </span>
            <span className="brand-subtitle">Trải nghiệm ẩm thực</span>
          </div>
        </div>

        <nav className="desktop-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-link ${activeSection === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            className="nav-link login-btn"
            onClick={() => navigate(isAuthenticated ? "/home" : "/login")}
            style={{
              marginLeft: "16px",
              background: "#ea580c",
              color: "#fff",
              borderRadius: "6px",
              padding: "6px 16px",
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            {isAuthenticated ? "Truy cập" : "Đăng nhập"}
          </button>
        </nav>

        <Button
          type="text"
          className="mobile-menu-btn"
          icon={<MenuOutlined />}
          onClick={() => setMobileMenuOpen(true)}
        />

        <Drawer
          title={
            <div className="drawer-brand">
              <ShopOutlined /> {chainInfo?.name || "MenuGo"}
            </div>
          }
          placement="right"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          className="customer-mobile-drawer"
        >
          <div className="mobile-nav-list">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`mobile-nav-item ${activeSection === item.key ? "active" : ""}`}
                onClick={() => handleNavClick(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <button
              className="mobile-nav-item login-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(isAuthenticated ? "/home" : "/login");
              }}
              style={{
                marginTop: "16px",
                width: "100%",
                background: "#ea580c",
                color: "#fff",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Đăng nhập
            </button>
          </div>
        </Drawer>
      </div>
    </header>
  );
};

export default CustomerHeader;
