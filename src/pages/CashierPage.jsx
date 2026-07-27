import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Tag,
  Badge,
  Space,
  Typography,
  Input,
  Tabs,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Divider,
  Statistic,
  Empty,
  Spin,
  Alert,
  Tooltip,
} from 'antd';
import {
  DollarOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TableOutlined,
  LockOutlined,
  SwapOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { getAllOrders, getOrderById } from '../api/orderApi';
import { getAllTables } from '../api/tableApi';
import { getAllAccounts } from '../api/accountApi';
import PaymentModal from '../components/payment/PaymentModal';
import DeviceEmployeeLoginModal from '../components/DeviceEmployeeLoginModal';
import { useSignalR } from '../context/SignalRContext';

const { Title, Text } = Typography;

const CashierPage = () => {
  const [activeTab, setActiveTab] = useState('CHECKOUT');
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Order for Checkout
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Payment Modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // Attendance Modal State
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // SignalR
  const signalRConnection = useSignalR();

  // Fetch Orders and Tables
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [oRes, tRes, aRes] = await Promise.allSettled([
        getAllOrders(),
        getAllTables(),
        getAllAccounts(),
      ]);

      if (oRes.status === 'fulfilled') setOrders(oRes.value.data || []);
      if (tRes.status === 'fulfilled') setTables(tRes.value.data || []);
      if (aRes.status === 'fulfilled') setAccounts(aRes.value.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải dữ liệu quầy thu ngân.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // SignalR Listener for real-time payment / order updates
  useEffect(() => {
    if (!signalRConnection) return;

    const handleNotif = (notif) => {
      if (
        notif.type === 'cooking-status-changed' ||
        notif.type === 'new-order' ||
        notif.type === 'order-cancelled' ||
        notif.type === 'PaymentWebhook'
      ) {
        fetchData(false);
      }
    };

    signalRConnection.on('ReceiveNotification', handleNotif);
    return () => {
      signalRConnection.off('ReceiveNotification', handleNotif);
    };
  }, [signalRConnection, fetchData]);

  // Fetch Order Details when an order is selected
  const handleSelectOrder = async (orderId) => {
    setSelectedOrderId(orderId);
    setLoadingDetail(true);
    try {
      const res = await getOrderById(orderId);
      setSelectedOrderDetail(res.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải chi tiết hóa đơn.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filter Active / Pending Checkout Orders
  const pendingOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'Serving' ||
        o.status === 'Pending' ||
        o.status === 'Unpaid' ||
        o.status === 'Created'
    );
  }, [orders]);

  const paidTodayOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(
      (o) =>
        (o.status === 'Paid' || o.status === 'Completed') &&
        o.createdAt &&
        new Date(o.createdAt).toDateString() === today
    );
  }, [orders]);

  // Filtered Pending list by Search
  const filteredPendingOrders = useMemo(() => {
    if (!searchTerm) return pendingOrders;
    const term = searchTerm.toLowerCase();
    return pendingOrders.filter(
      (o) =>
        (o.id && String(o.id).includes(term)) ||
        (o.tableName && o.tableName.toLowerCase().includes(term)) ||
        (o.customerName && o.customerName.toLowerCase().includes(term))
    );
  }, [pendingOrders, searchTerm]);

  // Shift Stats
  const totalPaidRevenue = paidTodayOrders.reduce(
    (acc, curr) => acc + (curr.totalAmount || curr.finalAmount || 0),
    0
  );

  // Print Pre-Bill Action
  const handlePrintPreBill = () => {
    if (!selectedOrderDetail) return;
    const printWindow = window.open('', '_blank');
    const itemsHtml = (selectedOrderDetail.orderDetails || selectedOrderDetail.details || [])
      .map(
        (item) =>
          `<tr>
            <td>${item.productName || item.product?.name || 'Món ăn'}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${(item.price || item.unitPrice || 0).toLocaleString('vi-VN')}đ</td>
            <td style="text-align: right;">${((item.price || item.unitPrice || 0) * item.quantity).toLocaleString('vi-VN')}đ</td>
          </tr>`
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>PHIẾU TẠM TÍNH - ${selectedOrderDetail.tableName || 'BÀN'}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 300px; margin: 0 auto; }
            h2, h3 { text-align: center; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 4px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h2>NHÀ HÀNG MENUGO</h2>
          <h3>PHIẾU TẠM TÍNH</h3>
          <p>Mã HĐ: #${selectedOrderDetail.id} | Bàn: ${selectedOrderDetail.tableName || 'N/A'}</p>
          <p>Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Món</th>
                <th style="text-align: center;">SL</th>
                <th style="text-align: right;">Đ.Giá</th>
                <th style="text-align: right;">T.Tiền</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="divider"></div>
          <div class="total">TỔNG CỘNG: ${(selectedOrderDetail.totalAmount || 0).toLocaleString('vi-VN')}đ</div>
          <p style="text-align: center; margin-top: 20px; font-size: 11px;">Cảm ơn quý khách và hẹn gặp lại!</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* ── HEADER BANNER QUẦY THU NGÂN ──────────────────────────────────────── */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #001529 0%, #002140 100%)',
          color: '#fff',
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <DollarOutlined style={{ color: '#fff' }} />
              </div>
              <div>
                <Title level={3} style={{ color: '#fff', margin: 0 }}>
                  Quầy Thu Ngân & Điểm Danh (Cashier Counter)
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Xử lý Thanh toán Hóa đơn, In phiếu tạm tính & Điểm danh Ca làm việc
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
              <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ fontSize: 13, padding: '4px 10px' }}>
                Thiết bị đã xác thực
              </Tag>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchData(true)}
                style={{ backgroundColor: '#141414', borderColor: '#434343', color: '#fff' }}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ── MAIN WORKSPACE TABS ─────────────────────────────────────────────── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'CHECKOUT',
            label: (
              <span>
                <DollarOutlined /> Thanh Toán Hóa Đơn ({pendingOrders.length} bàn chờ)
              </span>
            ),
          },
          {
            key: 'ATTENDANCE',
            label: (
              <span>
                <ClockCircleOutlined /> Điểm Danh Nhân Viên Ca Làm
              </span>
            ),
          },
          {
            key: 'SHIFT_STATS',
            label: (
              <span>
                <ThunderboltOutlined /> Thống Kê Ca Thu Ngân ({paidTodayOrders.length} HĐ đã thu)
              </span>
            ),
          },
        ]}
      />

      {/* ── TAB 1: MÀN HÌNH THANH TOÁN HÓA ĐƠN ────────────────────────────── */}
      {activeTab === 'CHECKOUT' && (
        <Row gutter={[16, 16]}>
          {/* CỘT TRÁI: DANH SÁCH BÀN / ĐƠN HÀNG CHỜ THANH TOÁN */}
          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <TableOutlined style={{ color: '#1890ff' }} />
                  <span>Danh Sách Đơn Hàng Chờ Thanh Toán</span>
                  <Badge count={pendingOrders.length} overflowCount={99} />
                </Space>
              }
              style={{ borderRadius: 12, height: '100%' }}
              bodyStyle={{ padding: 16 }}
            >
              <Input
                placeholder="Tìm theo số bàn, mã đơn hoặc tên khách..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginBottom: 16 }}
                allowClear
              />

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin tip="Đang nạp danh sách bàn chờ thanh toán..." />
                </div>
              ) : filteredPendingOrders.length === 0 ? (
                <Empty description="Hiện không có đơn hàng nào chờ thanh toán" />
              ) : (
                <div style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
                  <List
                    itemLayout="horizontal"
                    dataSource={filteredPendingOrders}
                    renderItem={(order) => {
                      const isSelected = order.id === selectedOrderId;
                      return (
                        <div
                          key={order.id}
                          onClick={() => handleSelectOrder(order.id)}
                          style={{
                            padding: '14px',
                            marginBottom: '10px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #1890ff' : '1px solid #e8e8e8',
                            backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Row align="middle" justify="space-between">
                            <Col>
                              <Space>
                                <Tag color="volcano" style={{ fontSize: 15, fontWeight: 700 }}>
                                  🪑 {order.tableName || `Đơn #${order.id}`}
                                </Tag>
                                <Tag color="blue">{order.status || 'Serving'}</Tag>
                              </Space>
                              <div style={{ marginTop: 6, fontSize: 13, color: '#595959' }}>
                                🕒 {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('vi-VN') : 'Vừa tạo'}
                              </div>
                            </Col>
                            <Col style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#ff4d4f' }}>
                                {(order.totalAmount || order.finalAmount || 0).toLocaleString('vi-VN')}đ
                              </div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Click để chọn
                              </Text>
                            </Col>
                          </Row>
                        </div>
                      );
                    }}
                  />
                </div>
              )}
            </Card>
          </Col>

          {/* CỘT PHẢI: CHI TIẾT HÓA ĐƠN & THAO TÁC THANH TOÁN */}
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <PrinterOutlined style={{ color: '#52c41a' }} />
                  <span>Chi Tiết Hóa Đơn {selectedOrderDetail ? `#${selectedOrderDetail.id}` : ''}</span>
                </Space>
              }
              style={{ borderRadius: 12, height: '100%' }}
              bodyStyle={{ padding: 20 }}
            >
              {!selectedOrderId ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <TableOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <Title level={4} type="secondary">
                    Vui lòng chọn 1 đơn hàng từ danh sách bên trái để thực hiện thanh toán
                  </Title>
                </div>
              ) : loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Spin size="large" tip="Đang tải chi tiết đơn hàng..." />
                </div>
              ) : selectedOrderDetail ? (
                <div>
                  {/* Order Header Summary */}
                  <div
                    style={{
                      background: '#fafafa',
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 16,
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Title level={4} style={{ margin: 0 }}>
                          🪑 {selectedOrderDetail.tableName || 'Bàn chưa xác định'}
                        </Title>
                        <Text type="secondary">
                          Mã HĐ: #{selectedOrderDetail.id} | Giờ vào: {new Date(selectedOrderDetail.createdAt).toLocaleTimeString('vi-VN')}
                        </Text>
                      </Col>
                      <Col style={{ textAlign: 'right' }}>
                        <Text type="secondary">TỔNG TIỀN CANH TOÁN</Text>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#ff4d4f' }}>
                          {(selectedOrderDetail.totalAmount || 0).toLocaleString('vi-VN')}đ
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Items List Table */}
                  <Title level={5} style={{ marginBottom: 12 }}>
                    Danh sách món ăn gọi tại bàn:
                  </Title>
                  <Table
                    size="small"
                    pagination={false}
                    rowKey="id"
                    dataSource={selectedOrderDetail.orderDetails || selectedOrderDetail.details || []}
                    columns={[
                      {
                        title: 'Món ăn',
                        dataIndex: 'productName',
                        key: 'productName',
                        render: (text, record) => (
                          <Text strong>{text || record.product?.name || 'Món ăn'}</Text>
                        ),
                      },
                      {
                        title: 'Số lượng',
                        dataIndex: 'quantity',
                        key: 'quantity',
                        align: 'center',
                        render: (qty) => <Tag color="blue">x{qty}</Tag>,
                      },
                      {
                        title: 'Đơn giá',
                        dataIndex: 'price',
                        key: 'price',
                        align: 'right',
                        render: (price, record) => (
                          <span>{(price || record.unitPrice || 0).toLocaleString('vi-VN')}đ</span>
                        ),
                      },
                      {
                        title: 'Thành tiền',
                        key: 'total',
                        align: 'right',
                        render: (_, record) => (
                          <Text strong color="volcano">
                            {((record.price || record.unitPrice || 0) * record.quantity).toLocaleString('vi-VN')}đ
                          </Text>
                        ),
                      },
                    ]}
                    style={{ marginBottom: 20 }}
                  />

                  {/* Action Buttons: Print Pre-Bill & Pay */}
                  <Row gutter={12}>
                    <Col span={12}>
                      <Button
                        type="default"
                        block
                        size="large"
                        icon={<PrinterOutlined />}
                        onClick={handlePrintPreBill}
                        style={{ height: 48, fontWeight: 600 }}
                      >
                        In Phiếu Tạm Tính
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<DollarOutlined />}
                        onClick={() => setPaymentModalVisible(true)}
                        style={{ height: 48, fontWeight: 600, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                      >
                        Thanh Toán Hóa Đơn (PayOS / Tiền mặt)
                      </Button>
                    </Col>
                  </Row>
                </div>
              ) : null}
            </Card>
          </Col>
        </Row>
      )}

      {/* ── TAB 2: ĐIỂM DANH NHÂN VIÊN (STAFF ATTENDANCE CLOCK-IN/OUT) ──────── */}
      {activeTab === 'ATTENDANCE' && (
        <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 24 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                ⏰ Máy Điểm Danh Nhân Viên Ca Làm Việc
              </Title>
              <Text type="secondary">
                Điểm danh trực tiếp tại máy quầy thu ngân cho nhân viên phục vụ, thu ngân & bếp
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<UserOutlined />}
                size="large"
                onClick={() => setAttendanceModalVisible(true)}
                style={{ backgroundColor: '#1890ff', borderRadius: 8 }}
              >
                Thực Hiện Điểm Danh Nhanh
              </Button>
            </Col>
          </Row>

          <Alert
            message="Hướng dẫn sử dụng máy điểm danh quầy Thu ngân"
            description="Nhân viên chỉ cần bấm 'Thực hiện điểm danh nhanh', chọn tài khoản nhân viên và nhập mã PIN để xác nhận giờ vào ca (Clock-In) hoặc ra ca (Clock-Out)."
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />

          <Title level={5} style={{ marginBottom: 12 }}>
            Nhật ký điểm danh ca làm hôm nay:
          </Title>
          <Table
            size="small"
            rowKey="id"
            dataSource={attendanceLogs}
            columns={[
              { title: 'Thời gian', dataIndex: 'time', key: 'time' },
              { title: 'Nhân viên', dataIndex: 'employeeName', key: 'employeeName' },
              {
                title: 'Hành động',
                dataIndex: 'type',
                key: 'type',
                render: (t) => (
                  <Tag color={t === 'Clock-In' ? 'green' : 'orange'}>
                    {t === 'Clock-In' ? '🟢 Vào ca (Clock-In)' : '🔴 Ra ca (Clock-Out)'}
                  </Tag>
                ),
              },
              { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: () => <Tag color="blue">Đã ghi nhận</Tag> },
            ]}
            locale={{ emptyText: 'Chưa có lượt điểm danh nào trong ca hôm nay.' }}
          />
        </Card>
      )}

      {/* ── TAB 3: THỐNG KÊ CA THU NGÂN (SHIFT SUMMARY & REGISTER) ─────────── */}
      {activeTab === 'SHIFT_STATS' && (
        <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 24 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            📊 Thống Kê Ca Thu Ngân Hôm Nay
          </Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card style={{ background: '#f6ffed', borderColor: '#b7eb8f', borderRadius: 8 }}>
                <Statistic
                  title="Tổng doanh thu đã thu"
                  value={totalPaidRevenue}
                  formatter={(val) => new Intl.NumberFormat('vi-VN').format(val)}
                  suffix="VND"
                  valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ background: '#e6f7ff', borderColor: '#91d5ff', borderRadius: 8 }}>
                <Statistic
                  title="Số hóa đơn đã hoàn thành"
                  value={paidTodayOrders.length}
                  suffix="hóa đơn"
                  valueStyle={{ color: '#1890ff', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ background: '#fff7e6', borderColor: '#ffd591', borderRadius: 8 }}>
                <Statistic
                  title="Số đơn còn chờ thanh toán"
                  value={pendingOrders.length}
                  suffix="bàn"
                  valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          <Title level={5} style={{ marginBottom: 12 }}>
            Danh sách hóa đơn đã thu tiền hôm nay:
          </Title>
          <Table
            size="small"
            rowKey="id"
            dataSource={paidTodayOrders}
            columns={[
              { title: 'Mã HĐ', dataIndex: 'id', key: 'id', render: (id) => `#${id}` },
              { title: 'Bàn', dataIndex: 'tableName', key: 'tableName', render: (name) => `🪑 ${name || 'N/A'}` },
              {
                title: 'Thời gian thu',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (t) => (t ? new Date(t).toLocaleTimeString('vi-VN') : 'N/A'),
              },
              {
                title: 'Tổng tiền',
                dataIndex: 'totalAmount',
                key: 'totalAmount',
                align: 'right',
                render: (val, record) => (
                  <Text strong color="green">
                    {((val || record.finalAmount || 0)).toLocaleString('vi-VN')}đ
                  </Text>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: () => <Tag color="green">Đã hoàn thành</Tag>,
              },
            ]}
          />
        </Card>
      )}

      {/* ── PAYMENT MODAL COMPONENT ────────────────────────────────────────── */}
      {paymentModalVisible && selectedOrderDetail && (
        <PaymentModal
          visible={paymentModalVisible}
          orderId={selectedOrderDetail.id}
          items={selectedOrderDetail.orderDetails || selectedOrderDetail.details || []}
          onCancel={() => setPaymentModalVisible(false)}
          onSuccess={() => {
            setPaymentModalVisible(false);
            setSelectedOrderId(null);
            setSelectedOrderDetail(null);
            message.success('Thanh toán đơn hàng thành công!');
            fetchData(false);
          }}
        />
      )}

      {/* ── DEVICE ATTENDANCE MODAL COMPONENT ─────────────────────────────── */}
      {attendanceModalVisible && (
        <DeviceEmployeeLoginModal
          visible={attendanceModalVisible}
          onCancel={() => setAttendanceModalVisible(false)}
          onSuccess={(empData) => {
            setAttendanceModalVisible(false);
            const newLog = {
              id: Date.now(),
              time: new Date().toLocaleTimeString('vi-VN'),
              employeeName: empData?.name || 'Nhân viên',
              type: 'Clock-In',
              status: 'Success',
            };
            setAttendanceLogs((prev) => [newLog, ...prev]);
            message.success(`🟢 Nhân viên ${empData?.name || ''} điểm danh thành công!`);
          }}
        />
      )}
    </div>
  );
};

export default CashierPage;
