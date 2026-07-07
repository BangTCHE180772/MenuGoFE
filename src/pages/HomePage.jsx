import { Card, Row, Col, Statistic } from 'antd';
import {
  ShoppingCartOutlined,
  TeamOutlined,
  TableOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAuth, ROLES } from '../context/AuthContext';

const HomePage = () => {
  const { user, role, hasRole } = useAuth();

  return (
    <div className="home-page">
      {/* Welcome Banner */}
      <div className="home-banner">
        <div className="home-banner-content">
          <h1 className="home-banner-title">
            Xin chào, <span>{user?.name ?? 'bạn'}</span>! 👋
          </h1>
          <p className="home-banner-subtitle">
            Hôm nay là một ngày tuyệt vời để quản lý nhà hàng
          </p>
        </div>
        <div className="home-banner-emoji">🍜</div>
      </div>

      {/* Stats cards - hiện theo role */}
      <Row gutter={[16, 16]} className="home-stats">
        {hasRole(ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN, ROLES.CASHIER) && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card-blue" hoverable>
              <Statistic
                title="Đơn hàng hôm nay"
                value={0}
                prefix={<ShoppingCartOutlined />}
                suffix="đơn"
              />
            </Card>
          </Col>
        )}

        {hasRole(ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN) && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card-green" hoverable>
              <Statistic
                title="Nhân sự hiện có"
                value={0}
                prefix={<TeamOutlined />}
                suffix="người"
              />
            </Card>
          </Col>
        )}

        {hasRole(ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN, ROLES.CASHIER, ROLES.WAITER) && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card-orange" hoverable>
              <Statistic
                title="Bàn đang hoạt động"
                value={0}
                prefix={<TableOutlined />}
                suffix="bàn"
              />
            </Card>
          </Col>
        )}

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-purple" hoverable>
            <Statistic
              title="Ca làm việc hôm nay"
              value={0}
              prefix={<CalendarOutlined />}
              suffix="ca"
            />
          </Card>
        </Col>
      </Row>

      {/* Placeholder nội dung */}
      <div className="home-placeholder">
        <div className="home-placeholder-icon">🚧</div>
        <h3>Đang phát triển</h3>
        <p>Nội dung dashboard sẽ được bổ sung sau khi hoàn thiện các tính năng</p>
      </div>
    </div>
  );
};

export default HomePage;
