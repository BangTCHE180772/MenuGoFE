import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Tag,
  Badge,
  Space,
  Typography,
  Spin,
  Progress,
  List,
} from 'antd';
import {
  ShoppingCartOutlined,
  TeamOutlined,
  TableOutlined,
  CalendarOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
  DollarOutlined,
  BookOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAuth, ROLES } from '../context/AuthContext';
import { getKitchenItems } from '../api/kitchenApi';
import { getAllOrders } from '../api/orderApi';
import { getAllTables } from '../api/tableApi';

const { Title, Text } = Typography;

const HomePage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [kitchenItems, setKitchenItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [kRes, oRes, tRes] = await Promise.allSettled([
          getKitchenItems().catch(() => ({ data: [] })),
          getAllOrders().catch(() => ({ data: [] })),
          getAllTables().catch(() => ({ data: [] })),
        ]);

        if (kRes.status === 'fulfilled' && kRes.value?.data) setKitchenItems(kRes.value.data);
        if (oRes.status === 'fulfilled' && oRes.value?.data) setOrders(oRes.value.data);
        if (tRes.status === 'fulfilled' && tRes.value?.data) setTables(tRes.value.data);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute Stats
  const waitingKdsCount = kitchenItems.filter(i => !i.cookingStatus || i.cookingStatus === 'Waiting').length;
  const cookingKdsCount = kitchenItems.filter(i => i.cookingStatus === 'Cooking').length;
  const readyKdsCount = kitchenItems.filter(i => i.cookingStatus === 'Ready').length;

  const todayOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  });

  const todayRevenue = todayOrders
    .filter(o => o.status === 'Paid' || o.status === 'Completed')
    .reduce((acc, curr) => acc + (curr.totalAmount || curr.finalAmount || 0), 0);

  const occupiedTables = tables.filter(t => t.status === 'Occupied' || t.status === 'Serving').length;
  const totalTables = tables.length || 1;
  const tableOccupancyRate = Math.round((occupiedTables / totalTables) * 100);

  return (
    <div style={{ padding: '20px', minHeight: 'calc(100vh - 64px)' }}>
      {/* ── BANNER XIN CHÀO ────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#fff',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(254, 180, 123, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
            Xin chào, {user?.name ?? 'Nguyễn Hữu Huy'}! 👋
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
            Tổng quan hệ thống vận hành nhà hàng MenuGO hôm nay
          </Text>
        </div>
        <Space wrap size="middle">
          {hasRole(ROLES.CHEF, ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN) && (
            <Button
              type="primary"
              size="large"
              icon={<FireOutlined />}
              onClick={() => navigate('/kds')}
              style={{
                backgroundColor: '#141414',
                borderColor: '#141414',
                fontWeight: 600,
                borderRadius: 8,
                height: 44,
              }}
            >
              Màn hình Bếp KDS (UC-097)
            </Button>
          )}
          {hasRole(ROLES.CASHIER, ROLES.WAITER, ROLES.MANAGER, ROLES.OWNER) && (
            <Button
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate('/orders')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.4)',
                fontWeight: 600,
                borderRadius: 8,
                height: 44,
              }}
            >
              Tạo Đơn Bán Hàng
            </Button>
          )}
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#8c8c8c' }}>Đang tải dữ liệu tổng quan...</div>
        </div>
      ) : (
        <>
          {/* ── METRIC STATISTIC CARDS ────────────────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderRadius: 12, borderTop: '4px solid #1890ff' }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 14 }}>Doanh thu hôm nay</Text>}
                  value={todayRevenue}
                  precision={0}
                  prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
                  suffix="VND"
                  formatter={(val) => new Intl.NumberFormat('vi-VN').format(val)}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderRadius: 12, borderTop: '4px solid #52c41a' }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 14 }}>Đơn hàng hôm nay</Text>}
                  value={todayOrders.length}
                  prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
                  suffix="đơn"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderRadius: 12, borderTop: '4px solid #fa8c16' }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 14 }}>Bàn đang có khách</Text>}
                  value={occupiedTables}
                  prefix={<TableOutlined style={{ color: '#fa8c16' }} />}
                  suffix={`/ ${totalTables} bàn`}
                />
                <Progress percent={tableOccupancyRate} size="small" status="active" strokeColor="#fa8c16" style={{ marginTop: 8 }} />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ borderRadius: 12, borderTop: '4px solid #ff4d4f' }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 14 }}>Món chờ Bếp (UC-097)</Text>}
                  value={waitingKdsCount + cookingKdsCount}
                  prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
                  suffix="món"
                />
                <Space style={{ marginTop: 8 }}>
                  <Tag color="red">{waitingKdsCount} mới</Tag>
                  <Tag color="orange">{cookingKdsCount} đang nấu</Tag>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* ── KITCHEN KDS OVERVIEW (UC-097 & UC-098) ──────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={14}>
              <Card
                title={
                  <Space>
                    <FireOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                      Vận Hành Bếp & Chế Biến (Kitchen KDS - UC-097 & UC-098)
                    </span>
                  </Space>
                }
                extra={
                  <Button type="link" onClick={() => navigate('/kds')} icon={<RightOutlined />}>
                    Xem Màn hình Bếp KDS
                  </Button>
                }
                style={{ borderRadius: 12, height: '100%' }}
              >
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                      <Text type="secondary">Món Mới (New)</Text>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f', marginTop: 4 }}>
                        {waitingKdsCount}
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                      <Text type="secondary">Đang Nấu (Cooking)</Text>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#faad14', marginTop: 4 }}>
                        {cookingKdsCount}
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                      <Text type="secondary">Đã Xong (Ready)</Text>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a', marginTop: 4 }}>
                        {readyKdsCount}
                      </div>
                    </div>
                  </Col>
                </Row>

                <Title level={5} style={{ marginBottom: 12 }}>
                  🔥 Món ăn chờ Bếp nhận chế biến mới nhất:
                </Title>

                {kitchenItems.length === 0 ? (
                  <Text type="secondary">Bếp hiện đang trống, chưa có đơn chờ mới.</Text>
                ) : (
                  <List
                    size="small"
                    dataSource={kitchenItems.slice(0, 5)}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Tag
                            color={
                              item.cookingStatus === 'Cooking'
                                ? 'orange'
                                : item.cookingStatus === 'Ready'
                                ? 'green'
                                : 'red'
                            }
                          >
                            {item.cookingStatus || 'Waiting'}
                          </Tag>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Badge count={item.quantity} overflowCount={99} color="#fa8c16" />}
                          title={<Text strong>🪑 {item.tableName} - {item.productName}</Text>}
                          description={item.note ? `Ghi chú: ${item.note}` : 'Chế biến tiêu chuẩn'}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Col>

            {/* ── QUICK NAVIGATION FEATURE GRID ─────────────────────────────── */}
            <Col xs={24} lg={10}>
              <Card
                title={
                  <Space>
                    <AppstoreOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Truy Cập Nhanh Tính Năng Hệ Thống</span>
                  </Space>
                }
                style={{ borderRadius: 12, height: '100%' }}
              >
                <Row gutter={[12, 12]}>
                  {hasRole(ROLES.CASHIER, ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN) && (
                    <Col span={12}>
                      <Card
                        hoverable
                        onClick={() => navigate('/cashier')}
                        style={{ background: '#f6ffed', borderColor: '#b7eb8f', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}
                      >
                        <DollarOutlined style={{ fontSize: 28, color: '#52c41a', marginBottom: 8 }} />
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Quầy Thu Ngân</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Thanh toán hóa đơn</Text>
                      </Card>
                    </Col>
                  )}

                  {hasRole(ROLES.CHEF, ROLES.CASHIER, ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN) && (
                    <Col span={12}>
                      <Card
                        hoverable
                        onClick={() => navigate('/kds')}
                        style={{ background: '#fff1f0', borderColor: '#ffa39e', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}
                      >
                        <FireOutlined style={{ fontSize: 28, color: '#ff4d4f', marginBottom: 8 }} />
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Bếp KDS (UC-097)</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Điều phối chế biến</Text>
                      </Card>
                    </Col>
                  )}

                  <Col span={12}>
                    <Card
                      hoverable
                      onClick={() => navigate('/table-map')}
                      style={{ background: '#fffbe6', borderColor: '#ffe58f', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}
                    >
                      <TableOutlined style={{ fontSize: 28, color: '#faad14', marginBottom: 8 }} />
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Sơ Đồ Bàn</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Trạng thái thời gian thực</Text>
                    </Card>
                  </Col>

                  {hasRole(ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN) && (
                    <Col span={12}>
                      <Card
                        hoverable
                        onClick={() => navigate('/menu-management')}
                        style={{ background: '#e6f7ff', borderColor: '#91d5ff', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}
                      >
                        <BookOutlined style={{ fontSize: 28, color: '#1890ff', marginBottom: 8 }} />
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Thực Đơn (UC-058)</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Món & Công thức</Text>
                      </Card>
                    </Col>
                  )}

                  {hasRole(ROLES.CASHIER, ROLES.WAITER, ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN) && (
                    <Col span={12}>
                      <Card
                        hoverable
                        onClick={() => navigate('/reservations')}
                        style={{ background: '#f9f0ff', borderColor: '#d3ade8', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}
                      >
                        <CalendarOutlined style={{ fontSize: 28, color: '#722ed1', marginBottom: 8 }} />
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Đặt Bàn Trước</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Lịch hẹn khách</Text>
                      </Card>
                    </Col>
                  )}
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default HomePage;
