import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Radio, Spin } from 'antd';
import {
  ShoppingCartOutlined,
  TeamOutlined,
  TableOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useAuth, ROLES } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { getBranchDashboardStats } from '../api/branchApi';

const HomePage = () => {
  const { user, role, hasRole } = useAuth();
  const { currentBranchId } = useBranch();
  const [range, setRange] = useState('thisMonth');
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await getBranchDashboardStats(range, null, null, currentBranchId);
        if (res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải số liệu thống kê dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [range, currentBranchId]);

  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <div className="home-page" style={{ padding: '24px' }}>
      {/* Welcome Banner */}
      {/* <div className="home-banner" style={{ marginBottom: '24px' }}>
        <div className="home-banner-content">
          <h1 className="home-banner-title">
            Xin chào, <span>{user?.name ?? 'bạn'}</span>! 👋
          </h1>
          <p className="home-banner-subtitle">
            Hôm nay là một ngày tuyệt vời để quản lý nhà hàng
          </p>
        </div>
        <div className="home-banner-emoji">🍜</div>
      </div> */}

      {/* Filter range select for stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
          Báo cáo doanh thu & chi phí
        </h2>
        <Radio.Group value={range} onChange={(e) => setRange(e.target.value)} buttonStyle="solid">
          <Radio.Button value="7days">7 ngày qua</Radio.Button>
          <Radio.Button value="thisMonth">Tháng này</Radio.Button>
          <Radio.Button value="thisYear">Năm nay</Radio.Button>
        </Radio.Group>
      </div>

      {/* Stats cards - Financial Stats */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card className="stat-card stat-card-blue" hoverable style={{ borderLeft: '4px solid #1890ff' }}>
              <Statistic
                title="Tổng doanh thu"
                value={stats.revenue}
                formatter={(val) => formatVND(val)}
                valueStyle={{ color: '#1890ff', fontWeight: 700 }}
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card stat-card-orange" hoverable style={{ borderLeft: '4px solid #ff4d4f' }}>
              <Statistic
                title="Tổng chi phí"
                value={stats.expenses}
                formatter={(val) => formatVND(val)}
                valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
                prefix={<FallOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card stat-card-green" hoverable style={{ borderLeft: '4px solid #52c41a' }}>
              <Statistic
                title="Lợi nhuận ròng"
                value={stats.profit}
                formatter={(val) => formatVND(val)}
                valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Additional operational indicators */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
        Hoạt động hôm nay
      </h2>
      <Row gutter={[16, 16]}>
        {hasRole(ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN, ROLES.CASHIER) && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" hoverable>
              <Statistic
                title="Đơn hàng"
                value={0}
                prefix={<ShoppingCartOutlined />}
                suffix="đơn"
              />
            </Card>
          </Col>
        )}

        {hasRole(ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN) && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" hoverable>
              <Statistic
                title="Nhân sự trực ca"
                value={0}
                prefix={<TeamOutlined />}
                suffix="người"
              />
            </Card>
          </Col>
        )}

        {hasRole(ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN, ROLES.CASHIER, ROLES.WAITER) && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" hoverable>
              <Statistic
                title="Bàn đang mở"
                value={0}
                prefix={<TableOutlined />}
                suffix="bàn"
              />
            </Card>
          </Col>
        )}

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" hoverable>
            <Statistic
              title="Ca làm việc"
              value={0}
              prefix={<CalendarOutlined />}
              suffix="ca"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;
