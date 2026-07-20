import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Badge,
  Space,
  Tabs,
  Typography,
  message,
  Alert,
  Spin,
  Tooltip,
} from 'antd';
import {
  FireOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { getKitchenItems, updateCookingStatus, batchUpdateCookingStatus } from '../api/kitchenApi';
import { useSignalR } from '../context/SignalRContext';

const { Title, Text } = Typography;

// Standard cooking status definitions
const COOKING_STATUS = {
  WAITING: 'Waiting',   // Món mới (New)
  ACCEPTED: 'Accepted', // Đã nhận
  COOKING: 'Cooking',   // Đang nấu
  READY: 'Ready',       // Đã xong / Hoàn thành
};

const KDSPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [cancelledAlerts, setCancelledAlerts] = useState([]);
  const signalRConnection = useSignalR();

  // Helper sound generator for EX-1 (Cancellation Warning & New Order Warning)
  const playAlertSound = useCallback((type = 'cancel') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'cancel') {
        // High pitch warning beep sequence for cancellation
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.15); // A4
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        // Gentle chime for new order
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // Browser autoplay restriction fallback
    }
  }, []);

  // Fetch kitchen items
  const fetchItems = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getKitchenItems();
      const data = res.data || [];
      // Sort chronologically from oldest to newest
      const sorted = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setItems(sorted);
    } catch (err) {
      console.error('Lỗi khi tải danh sách bếp:', err);
      message.error('Không thể tải danh sách chế biến món ăn.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(true);
    // Auto refresh fallback every 15 seconds
    const interval = setInterval(() => fetchItems(false), 15000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  // SignalR real-time event listener
  useEffect(() => {
    if (!signalRConnection) return;

    const handleNotification = (notif) => {
      console.log('KDS Notification received:', notif);

      if (notif.type === 'new-order' || notif.type === 'new-item') {
        playAlertSound('new');
        message.info(`🔔 Món mới từ ${notif.tableName || 'khách hàng'}!`);
        fetchItems(false);
      } else if (notif.type === 'item-cancelled' || notif.type === 'order-cancelled') {
        // EX-1: Cancellation warning from outside
        playAlertSound('cancel');
        const alertMsg = notif.message || `Món ăn #${notif.orderDetailId || ''} đã bị HỦY từ ngoài!`;
        setCancelledAlerts((prev) => [
          { id: Date.now(), message: alertMsg, timestamp: new Date().toLocaleTimeString('vi-VN') },
          ...prev,
        ]);
        fetchItems(false);
      } else if (notif.type === 'cooking-status-changed') {
        fetchItems(false);
      }
    };

    signalRConnection.on('ReceiveNotification', handleNotification);

    return () => {
      signalRConnection.off('ReceiveNotification', handleNotification);
    };
  }, [signalRConnection, fetchItems, playAlertSound]);

  // Single Item Status Change Handler
  const handleStatusChange = async (detailId, nextStatus) => {
    try {
      await updateCookingStatus(detailId, nextStatus);
      const statusLabels = {
        [COOKING_STATUS.ACCEPTED]: 'Đã nhận món',
        [COOKING_STATUS.COOKING]: 'Đã chuyển sang Đang nấu',
        [COOKING_STATUS.READY]: 'Đã hoàn thành chế biến',
      };
      message.success(statusLabels[nextStatus] || 'Đã cập nhật trạng thái');
      fetchItems(false);
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi cập nhật trạng thái món.');
    }
  };

  // AF1: Batch Processing Handler (Nhận/Nấu/Xong tất cả món trùng nhau)
  const handleBatchStatusChange = async (batchDetailIds, nextStatus) => {
    try {
      await batchUpdateCookingStatus(batchDetailIds, nextStatus);
      message.success(`Đã cập nhật ${batchDetailIds.length} món trong lô sang trạng thái mới!`);
      fetchItems(false);
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi xử lý lô món.');
    }
  };

  // Group items by status for Filter Tabs
  const waitingItems = useMemo(() => items.filter((i) => !i.cookingStatus || i.cookingStatus === COOKING_STATUS.WAITING), [items]);
  const acceptedItems = useMemo(() => items.filter((i) => i.cookingStatus === COOKING_STATUS.ACCEPTED), [items]);
  const cookingItems = useMemo(() => items.filter((i) => i.cookingStatus === COOKING_STATUS.COOKING), [items]);
  const readyItems = useMemo(() => items.filter((i) => i.cookingStatus === COOKING_STATUS.READY), [items]);

  // AF1: Aggregate identical dishes across active tables into Batches
  const activeBatchGroups = useMemo(() => {
    // Collect all items that are not yet Ready/Done
    const activeItems = items.filter((i) => i.cookingStatus !== COOKING_STATUS.READY);
    const groups = {};

    activeItems.forEach((item) => {
      const key = item.productId || item.productName;
      if (!groups[key]) {
        groups[key] = {
          productId: item.productId,
          productName: item.ProductName || item.productName,
          totalQty: 0,
          details: [],
        };
      }
      groups[key].totalQty += item.quantity;
      groups[key].details.push(item);
    });

    // Return batches that have items from multiple tables or multiple active items
    return Object.values(groups).filter((g) => g.details.length > 0);
  }, [items]);

  // Display items based on current active tab
  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case COOKING_STATUS.WAITING:
        return waitingItems;
      case COOKING_STATUS.ACCEPTED:
        return acceptedItems;
      case COOKING_STATUS.COOKING:
        return cookingItems;
      case COOKING_STATUS.READY:
        return readyItems;
      default:
        return items.filter((i) => i.cookingStatus !== COOKING_STATUS.READY);
    }
  }, [activeTab, items, waitingItems, acceptedItems, cookingItems, readyItems]);

  // Render Time Elapsed since created
  const renderTimeElapsed = (createdAt) => {
    if (!createdAt) return 'Vừa xong';
    const minutes = Math.floor((new Date() - new Date(createdAt)) / 60000);
    if (minutes < 1) return 'Vừa xong (<1 phút)';
    if (minutes > 30) {
      return <span style={{ color: '#ff4d4f', fontWeight: 700 }}>⚠️ {minutes} phút</span>;
    }
    return `${minutes} phút trước`;
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#141414', minHeight: 'calc(100vh - 64px)', color: '#fff' }}>
      {/* ── HEADER BANNER FOR KDS ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-[#1f1f1f]',
          backgroundColor: '#1f1f1f',
          padding: '16px 24px',
          borderRadius: 12,
          marginBottom: 20,
          border: '1px solid #303030',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <Space size="large">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: '#fff',
            }}
          >
            <FireOutlined />
          </div>
          <div>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              Màn hình Bếp & Chế biến (KDS)
            </Title>
            <Text style={{ color: '#8c8c8c' }}>
              UC-097: Điều phối & Điều khiển Thứ tự Chế biến Món ăn theo Thời gian Thực
            </Text>
          </div>
        </Space>

        <Space size="middle">
          <Tooltip title="Làm mới danh sách">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchItems(true)}
              style={{ backgroundColor: '#262626', borderColor: '#434343', color: '#fff' }}
            >
              Làm mới
            </Button>
          </Tooltip>

          <Badge count={waitingItems.length} overflowCount={99}>
            <Tag color="#ff4d4f" style={{ fontSize: 14, padding: '4px 12px', borderRadius: 16 }}>
              🔥 {waitingItems.length} Món mới chờ nhận
            </Tag>
          </Badge>

          <Badge count={cookingItems.length} overflowCount={99}>
            <Tag color="#faad14" style={{ fontSize: 14, padding: '4px 12px', borderRadius: 16 }}>
              🍳 {cookingItems.length} Món đang nấu
            </Tag>
          </Badge>
        </Space>
      </div>

      {/* ── EX-1: CANCELLATION ALERTS BANNER ────────────────────────────────── */}
      {cancelledAlerts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {cancelledAlerts.map((alert) => (
            <Alert
              key={alert.id}
              message={
                <Space>
                  <ExclamationCircleOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
                  <span style={{ fontWeight: 700 }}>CẢNH BÁO BẾP (EX-1):</span>
                  <span>{alert.message}</span>
                  <Tag color="default">{alert.timestamp}</Tag>
                </Space>
              }
              type="error"
              closable
              onClose={() => setCancelledAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
              style={{
                marginBottom: 8,
                backgroundColor: '#2a1215',
                borderColor: '#ff4d4f',
                color: '#fff',
                borderRadius: 8,
              }}
            />
          ))}
        </div>
      )}

      {/* ── AF1: BATCH PROCESSING BAR (GỘP MÓN TRÙNG NHAU TỪ NHIỀU BÀN) ─────── */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#faad14', fontSize: 18 }} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
              Thanh Chế Biến Theo Lô (Batch Processing Bar - AF1)
            </span>
            <Tag color="warning">Tối ưu giờ cao điểm</Tag>
          </Space>
        }
        style={{
          backgroundColor: '#1f1f1f',
          borderColor: '#303030',
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        {activeBatchGroups.length === 0 ? (
          <Text style={{ color: '#595959' }}>Không có món trùng nhau cần gộp chế biến lúc này.</Text>
        ) : (
          <Row gutter={[16, 16]}>
            {activeBatchGroups.map((batch) => {
              const batchWaitingIds = batch.details
                .filter((d) => !d.cookingStatus || d.cookingStatus === COOKING_STATUS.WAITING)
                .map((d) => d.orderDetailId);
              const batchAcceptedIds = batch.details
                .filter((d) => d.cookingStatus === COOKING_STATUS.ACCEPTED)
                .map((d) => d.orderDetailId);
              const batchCookingIds = batch.details
                .filter((d) => d.cookingStatus === COOKING_STATUS.COOKING)
                .map((d) => d.orderDetailId);

              const allBatchIds = batch.details.map((d) => d.orderDetailId);

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={batch.productId || batch.productName}>
                  <div
                    style={{
                      background: '#262626',
                      border: '1px solid #434343',
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong style={{ color: '#fff', fontSize: 16 }}>
                        🍲 {batch.productName}
                      </Text>
                      <Tag color="red" style={{ fontSize: 14, fontWeight: 700 }}>
                        Tổng: {batch.totalQty} phần
                      </Tag>
                    </div>

                    {/* Table markers */}
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ color: '#8c8c8c', fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Bàn yêu cầu:
                      </Text>
                      <Space wrap size={[4, 4]}>
                        {batch.details.map((d) => (
                          <Tag key={d.orderDetailId} color="blue" style={{ fontSize: 12 }}>
                            {d.tableName} ({d.quantity}x)
                          </Tag>
                        ))}
                      </Space>
                    </div>

                    {/* Batch Action Buttons */}
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {batchWaitingIds.length > 0 && (
                        <Button
                          type="primary"
                          block
                          size="small"
                          icon={<ThunderboltOutlined />}
                          onClick={() => handleBatchStatusChange(batchWaitingIds, COOKING_STATUS.ACCEPTED)}
                          style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                        >
                          Nhận tất cả ({batchWaitingIds.length} món)
                        </Button>
                      )}
                      {(batchWaitingIds.length > 0 || batchAcceptedIds.length > 0) && (
                        <Button
                          type="primary"
                          block
                          size="small"
                          icon={<FireOutlined />}
                          onClick={() =>
                            handleBatchStatusChange(
                              [...batchWaitingIds, ...batchAcceptedIds],
                              COOKING_STATUS.COOKING
                            )
                          }
                          style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
                        >
                          Nấu tất cả ({batchWaitingIds.length + batchAcceptedIds.length} món)
                        </Button>
                      )}
                      {batchCookingIds.length > 0 && (
                        <Button
                          type="primary"
                          block
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleBatchStatusChange(batchCookingIds, COOKING_STATUS.READY)}
                          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        >
                          Hoàn thành lô ({batchCookingIds.length} món)
                        </Button>
                      )}
                    </Space>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      {/* ── FILTER TABS & MAIN KITCHEN QUEUE ───────────────────────────────── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        style={{ color: '#fff' }}
        items={[
          {
            key: 'ALL',
            label: (
              <span>
                <AppstoreOutlined /> Tất cả món ({items.filter((i) => i.cookingStatus !== COOKING_STATUS.READY).length})
              </span>
            ),
          },
          {
            key: COOKING_STATUS.WAITING,
            label: (
              <span>
                <BellOutlined /> Món mới chờ nhận ({waitingItems.length})
              </span>
            ),
          },
          {
            key: COOKING_STATUS.ACCEPTED,
            label: (
              <span>
                <ClockCircleOutlined /> Đã nhận ({acceptedItems.length})
              </span>
            ),
          },
          {
            key: COOKING_STATUS.COOKING,
            label: (
              <span>
                <FireOutlined /> Đang nấu ({cookingItems.length})
              </span>
            ),
          },
          {
            key: COOKING_STATUS.READY,
            label: (
              <span>
                <CheckCircleOutlined /> Đã xong ({readyItems.length})
              </span>
            ),
          },
        ]}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Đang tải danh sách món ăn..." />
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 0',
            background: '#1f1f1f',
            borderRadius: 12,
            border: '1px border #303030',
          }}
        >
          <Title level={4} style={{ color: '#595959' }}>
            🎉 Bếp hiện không có món nào thuộc danh mục này!
          </Title>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredItems.map((item) => {
            const status = item.cookingStatus || COOKING_STATUS.WAITING;

            let cardBorderColor = '#303030';
            let statusTag = <Tag color="red">MÓN MỚI (NEW)</Tag>;

            if (status === COOKING_STATUS.ACCEPTED) {
              cardBorderColor = '#1890ff';
              statusTag = <Tag color="blue">ĐÃ NHẬN (ACCEPTED)</Tag>;
            } else if (status === COOKING_STATUS.COOKING) {
              cardBorderColor = '#fa8c16';
              statusTag = <Tag color="orange">ĐANG NẤU (COOKING)</Tag>;
            } else if (status === COOKING_STATUS.READY) {
              cardBorderColor = '#52c41a';
              statusTag = <Tag color="green">ĐÃ XONG (READY)</Tag>;
            }

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={item.orderDetailId}>
                <Card
                  hoverable
                  style={{
                    backgroundColor: '#1f1f1f',
                    borderColor: cardBorderColor,
                    borderRadius: 12,
                    borderWidth: 2,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  {/* Card Header: Table Name & Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Tag
                      color="volcano"
                      style={{ fontSize: 16, fontWeight: 700, padding: '2px 10px', borderRadius: 4 }}
                    >
                      🪑 {item.tableName}
                    </Tag>
                    <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {renderTimeElapsed(item.createdAt)}
                    </Text>
                  </div>

                  {/* Product Name & Quantity */}
                  <div style={{ marginBottom: 12 }}>
                    <Title level={4} style={{ color: '#fff', margin: '4px 0' }}>
                      {item.productName}
                    </Title>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#faad14' }}>
                      Số lượng: x{item.quantity}
                    </div>
                  </div>

                  {/* Note / Special instructions */}
                  {item.note && (
                    <div
                      style={{
                        backgroundColor: '#2b2111',
                        border: '1px solid #d48806',
                        borderRadius: 6,
                        padding: '6px 10px',
                        marginBottom: 12,
                        color: '#ffe58f',
                        fontSize: 13,
                      }}
                    >
                      <strong>📝 Ghi chú:</strong> {item.note}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div style={{ marginBottom: 16 }}>{statusTag}</div>

                  {/* Action Buttons (Normal Flow) */}
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {status === COOKING_STATUS.WAITING && (
                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleStatusChange(item.orderDetailId, COOKING_STATUS.ACCEPTED)}
                        style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', fontWeight: 600 }}
                      >
                        Accept (Nhận món)
                      </Button>
                    )}

                    {status === COOKING_STATUS.ACCEPTED && (
                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<FireOutlined />}
                        onClick={() => handleStatusChange(item.orderDetailId, COOKING_STATUS.COOKING)}
                        style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', fontWeight: 600 }}
                      >
                        Cook (Bắt đầu nấu)
                      </Button>
                    )}

                    {status === COOKING_STATUS.COOKING && (
                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleStatusChange(item.orderDetailId, COOKING_STATUS.READY)}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontWeight: 600 }}
                      >
                        Done (Hoàn thành món)
                      </Button>
                    )}

                    {status === COOKING_STATUS.READY && (
                      <Button block disabled style={{ backgroundColor: '#262626', color: '#595959' }}>
                        Đã báo phục vụ
                      </Button>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default KDSPage;
