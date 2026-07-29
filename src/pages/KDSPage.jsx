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
  Popconfirm,
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
import { getKitchenItems, updateCookingStatus, batchUpdateCookingStatus, cancelOrderDetail } from '../api/kitchenApi';
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
  const [viewMode, setViewMode] = useState('COLUMN'); // 'COLUMN' (Chia dọc) or 'GRID' (Grid/Tab)
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
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.15); // A4
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
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

  // Single Item Cancel Handler
  const handleCancelItem = async (detailId) => {
    try {
      await cancelOrderDetail(detailId);
      message.success('Đã hủy món ăn thành công');
      fetchItems(false);
    } catch (err) {
      console.error(err);
      message.error('Không thể hủy món. Món đã chế biến xong hoặc đã bị hủy.');
    }
  };

  // AF1: Batch Processing Handler
  const handleBatchStatusChange = async (batchDetailIds, nextStatus) => {
    try {
      await batchUpdateCookingStatus(batchDetailIds, nextStatus);
      message.success(`Đã cập nhật trạng thái cho ${batchDetailIds.length} món trong mẻ!`);
      fetchItems(false);
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi xử lý lô/mẻ món.');
    }
  };

  // Group items by status for Filter Tabs & Columns
  const waitingItems = useMemo(() => items.filter((i) => !i.cookingStatus || i.cookingStatus === COOKING_STATUS.WAITING), [items]);
  const acceptedItems = useMemo(() => items.filter((i) => i.cookingStatus === COOKING_STATUS.ACCEPTED), [items]);
  const cookingItems = useMemo(() => items.filter((i) => i.cookingStatus === COOKING_STATUS.COOKING), [items]);
  const readyItems = useMemo(() => items.filter((i) => i.cookingStatus === COOKING_STATUS.READY), [items]);

  // AF1: Split identical dishes into batches of 10
  const activeBatchGroups = useMemo(() => {
    const activeItems = items.filter((i) => i.cookingStatus !== COOKING_STATUS.READY);
    const groups = {};

    // Group active items by product ID/Name
    activeItems.forEach((item) => {
      const key = item.productId || item.productName;
      if (!groups[key]) {
        groups[key] = {
          productId: item.productId,
          productName: item.productName || item.ProductName,
          productImage: item.productImage,
          details: [],
        };
      }
      groups[key].details.push(item);
    });

    const allBatches = [];

    // Partition each group into batches of 10
    Object.values(groups).forEach((group) => {
      // Sort by createdAt ascending (FIFO)
      const sortedDetails = [...group.details].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      let batchNum = 1;
      let currentBatch = {
        productId: group.productId,
        productName: group.productName,
        productImage: group.productImage,
        batchIndex: batchNum,
        totalQty: 0,
        details: [],
      };

      sortedDetails.forEach((detail) => {
        let remainingQty = detail.quantity;

        while (remainingQty > 0) {
          const capacity = 10 - currentBatch.totalQty;
          if (capacity <= 0) {
            allBatches.push(currentBatch);
            batchNum += 1;
            currentBatch = {
              productId: group.productId,
              productName: group.productName,
              productImage: group.productImage,
              batchIndex: batchNum,
              totalQty: 0,
              details: [],
            };
            continue;
          }

          const qtyToTake = Math.min(remainingQty, capacity);
          currentBatch.details.push({
            orderDetailId: detail.orderDetailId,
            tableName: detail.tableName,
            quantity: qtyToTake,
            cookingStatus: detail.cookingStatus || COOKING_STATUS.WAITING,
          });
          currentBatch.totalQty += qtyToTake;
          remainingQty -= qtyToTake;
        }
      });

      if (currentBatch.totalQty > 0) {
        allBatches.push(currentBatch);
      }
    });

    return allBatches;
  }, [items]);

  // Display items based on current active tab
  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case COOKING_STATUS.WAITING:
      case COOKING_STATUS.ACCEPTED:
        return [...waitingItems, ...acceptedItems];
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

  // Reusable KDS Card component
  const renderKdsCard = (item) => {
    const status = item.cookingStatus || COOKING_STATUS.WAITING;

    let cardBorderColor = '#303030';
    let statusTag = <Tag color="red">CHỜ XÁC NHẬN</Tag>;

    if (status === COOKING_STATUS.ACCEPTED) {
      cardBorderColor = '#1890ff';
      statusTag = <Tag color="blue">ĐÃ NHẬN</Tag>;
    } else if (status === COOKING_STATUS.COOKING) {
      cardBorderColor = '#fa8c16';
      statusTag = <Tag color="orange">ĐANG NẤU</Tag>;
    } else if (status === COOKING_STATUS.READY) {
      cardBorderColor = '#52c41a';
      statusTag = <Tag color="green">READY</Tag>;
    }

    return (
      <Card
        key={item.orderDetailId}
        hoverable
        style={{
          backgroundColor: '#ffffff',
          borderColor: cardBorderColor,
          borderRadius: 12,
          borderWidth: 2,
          boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
          marginBottom: 16,
          width: '100%',
        }}
        bodyStyle={{ padding: 16 }}
      >
        {/* Card Header: Table Name & Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
          <Tag
            color="volcano"
            style={{ fontSize: 16, fontWeight: 700, padding: '2px 10px', borderRadius: 4, margin: 0 }}
          >
            🪑 {item.tableName}
          </Tag>
          <Text style={{ color: '#595959', fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {renderTimeElapsed(item.createdAt)}
          </Text>
        </div>

        {/* Product Image, Name & Quantity */}
        <div style={{ display: 'flex', marginBottom: 12, alignItems: 'center' }}>
          {item.productImage ? (
            <img
              src={item.productImage}
              alt={item.productName}
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                objectFit: 'cover',
                marginRight: 12,
                border: '1px solid #434343'
              }}
            />
          ) : (
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #303030, #202020)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#595959',
                marginRight: 12,
                border: '1px solid #434343'
              }}
            >
              🍲
            </div>
          )}
          <div style={{ flex: 1 }}>
            <Title level={4} style={{ color: '#000000', margin: '0 0 4px 0', fontSize: 16 }}>
              {item.productName}
            </Title>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#faad14', fontVariantNumeric: 'tabular-nums' }}>
              Số lượng: x{item.quantity}
            </div>
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
          {(status === COOKING_STATUS.WAITING || status === COOKING_STATUS.ACCEPTED) && (
            <Button
              type="primary"
              block
              size="large"
              icon={<FireOutlined />}
              onClick={() => handleStatusChange(item.orderDetailId, COOKING_STATUS.COOKING)}
              style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', fontWeight: 600, color: '#ffffff' }}
            >
              Xác nhận
            </Button>
          )}

          {status === COOKING_STATUS.COOKING && (
            <Button
              type="primary"
              block
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(item.orderDetailId, COOKING_STATUS.READY)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontWeight: 600, color: '#ffffff' }}
            >
              Hoàn thành
            </Button>
          )}

          {status === COOKING_STATUS.READY && (
            <Button block disabled style={{ backgroundColor: '#ffffff', color: '#595959' }}>
              Đã báo phục vụ
            </Button>
          )}

          {/* Cancellation Option ("Huỷ món") */}
          {status !== COOKING_STATUS.READY && (
            <Popconfirm
              title="Bạn có chắc chắn muốn hủy món này không?"
              onConfirm={() => handleCancelItem(item.orderDetailId)}
              okText="Đồng ý"
              cancelText="Hủy bỏ"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                block
                type="text"
                style={{
                  marginTop: 4,
                  borderColor: '#ff4d4f',
                  color: '#ff4d4f',
                  border: '1px dashed #ff4d4f',
                }}
              >
                Hủy món
              </Button>
            </Popconfirm>
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f0f2f5',
      minHeight: 'calc(100vh - 64px)',
      color: '#000000',
      fontFamily: "'Be Vietnam Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* ── HEADER BANNER FOR KDS ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
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
              color: '#ffffff',
            }}
          >
            <FireOutlined />
          </div>
          <div>
            <Title level={3} style={{ color: '#000000', margin: 0 }}>
              Màn hình Bếp & Chế biến (KDS)
            </Title>
            <Text style={{ color: '#595959' }}>
              UC-097: Điều phối & Điều khiển Thứ tự Chế biến Món ăn theo Thời gian Thực
            </Text>
          </div>
        </Space>

        <Space size="middle">
          {/* View Mode Toggle Button Group */}
          <Button.Group>
            <Button
              type={viewMode === 'COLUMN' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('COLUMN')}
              style={viewMode === 'COLUMN' ? { backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#ffffff' } : { backgroundColor: '#ffffff', borderColor: '#d9d9d9', color: '#000000' }}
            >
              Chia dọc (Cột)
            </Button>
            <Button
              type={viewMode === 'GRID' ? 'primary' : 'default'}
              icon={<BellOutlined />}
              onClick={() => setViewMode('GRID')}
              style={viewMode === 'GRID' ? { backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#ffffff' } : { backgroundColor: '#ffffff', borderColor: '#d9d9d9', color: '#000000' }}
            >
              Dạng Tabs
            </Button>
          </Button.Group>

          <Tooltip title="Làm mới danh sách">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchItems(true)}
              style={{ backgroundColor: '#ffffff', borderColor: '#d9d9d9', color: '#000000' }}
            >
              Làm mới
            </Button>
          </Tooltip>

          <Badge count={waitingItems.length} overflowCount={99}>
            <Tag color="#ff4d4f" style={{ fontSize: 14, padding: '4px 12px', borderRadius: 16 }}>
              🔥 {waitingItems.length} Món mới
            </Tag>
          </Badge>

          <Badge count={cookingItems.length} overflowCount={99}>
            <Tag color="#faad14" style={{ fontSize: 14, padding: '4px 12px', borderRadius: 16 }}>
              🍳 {cookingItems.length} Đang nấu
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
                color: '#000000',
                borderRadius: 8,
              }}
            />
          ))}
        </div>
      )}

      {/* ── AF1: BATCH PROCESSING BAR (CHIA MẺ 10 XUẤT 1 MẺ) ─────── */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#faad14', fontSize: 18 }} />
            <span style={{ color: '#000000', fontWeight: 600, fontSize: 16 }}>
              Thanh Chế Biến Theo Lô / Mẻ (Batch Processing Bar - AF1)
            </span>
            <Tag color="warning">Tối ưu 10 phần/mẻ</Tag>
          </Space>
        }
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#d9d9d9',
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        {activeBatchGroups.length === 0 ? (
          <Text style={{ color: '#595959' }}>Không có món cần gộp chế biến theo mẻ lúc này.</Text>
        ) : (
          <Row gutter={[16, 16]}>
            {activeBatchGroups.map((batch) => {
              const batchWaitingIds = [...new Set(batch.details
                .filter((d) => d.cookingStatus === COOKING_STATUS.WAITING)
                .map((d) => d.orderDetailId))];
              const batchAcceptedIds = [...new Set(batch.details
                .filter((d) => d.cookingStatus === COOKING_STATUS.ACCEPTED)
                .map((d) => d.orderDetailId))];
              const batchCookingIds = [...new Set(batch.details
                .filter((d) => d.cookingStatus === COOKING_STATUS.COOKING)
                .map((d) => d.orderDetailId))];

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={`${batch.productId || batch.productName}_batch_${batch.batchIndex}`}>
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #434343',
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                      <Text strong style={{ color: '#000000', fontSize: 15, display: 'flex', alignItems: 'center' }}>
                        {batch.productImage ? (
                          <img
                            src={batch.productImage}
                            alt={batch.productName}
                            style={{ width: 28, height: 28, borderRadius: 4, marginRight: 8, objectFit: 'cover', border: '1px solid #434343' }}
                          />
                        ) : (
                          <span style={{ marginRight: 8 }}>🍲</span>
                        )}
                        <span>{batch.productName}</span>
                      </Text>
                      <Tag color="cyan" style={{ margin: 0, fontWeight: 700 }}>
                        Mẻ {batch.batchIndex}
                      </Tag>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                      <Text style={{ color: '#595959', fontSize: 12 }}>Số lượng trong mẻ:</Text>
                      <Tag color="red" style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                        {batch.totalQty} phần
                      </Tag>
                    </div>

                    {/* Table markers (Removed label 'Bàn yêu cầu:' as requested by 'Xoá tên bàn yêu cầu') */}
                    <div style={{ marginBottom: 12 }}>
                      <Space wrap size={[4, 4]}>
                        {batch.details.map((d, index) => (
                          <Tag key={`${d.orderDetailId}_${index}`} color="blue" style={{ fontSize: 12, margin: 0 }}>
                            {d.tableName} ({d.quantity}x)
                          </Tag>
                        ))}
                      </Space>
                    </div>

                    {/* Batch Action Buttons */}
                    <Space direction="vertical" style={{ width: '100%' }}>
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
                          Xác nhận làm mẻ ({batchWaitingIds.length + batchAcceptedIds.length} món)
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
                          Đã nấu xong mẻ ({batchCookingIds.length} món)
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

      {/* ── MAIN KITCHEN QUEUE ───────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Đang tải danh sách món ăn..." />
        </div>
      ) : viewMode === 'COLUMN' ? (
        /* Vertical Column Split View (Chia dọc) */
        <Row gutter={[20, 20]}>
          {/* Column 1: Chờ chế biến (Waiting + Accepted) */}
          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #303030', minHeight: '60vh', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 10,
                borderBottom: '2px solid #1890ff'
              }}>
                <Title level={4} style={{ color: '#000000', margin: 0, fontSize: 16 }}>
                  📋 Chờ xác nhận ({waitingItems.length + acceptedItems.length})
                </Title>
                <Badge count={waitingItems.length + acceptedItems.length} style={{ backgroundColor: '#1890ff' }} />
              </div>
              <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingRight: 4 }}>
                {[...waitingItems, ...acceptedItems].map(renderKdsCard)}
                {[...waitingItems, ...acceptedItems].length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#595959' }}>Không có món chờ chế biến</div>
                )}
              </div>
            </div>
          </Col>

          {/* Column 2: Đang nấu (Cooking) */}
          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #303030', minHeight: '60vh', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 10,
                borderBottom: '2px solid #fa8c16'
              }}>
                <Title level={4} style={{ color: '#000000', margin: 0, fontSize: 16 }}>
                  🍳 Đang nấu ({cookingItems.length})
                </Title>
                <Badge count={cookingItems.length} style={{ backgroundColor: '#fa8c16' }} />
              </div>
              <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingRight: 4 }}>
                {cookingItems.map(renderKdsCard)}
                {cookingItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#595959' }}>Không có món đang làm</div>
                )}
              </div>
            </div>
          </Col>

          {/* Column 3: Hoàn thành (Ready) */}
          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #303030', minHeight: '60vh', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 10,
                borderBottom: '2px solid #52c41a'
              }}>
                <Title level={4} style={{ color: '#000000', margin: 0, fontSize: 16 }}>
                  ✅ Ready ({readyItems.length})
                </Title>
                <Badge count={readyItems.length} style={{ backgroundColor: '#52c41a' }} />
              </div>
              <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingRight: 4 }}>
                {readyItems.map(renderKdsCard)}
                {readyItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#595959' }}>Chưa có món hoàn thành</div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      ) : (
        /* Tab Mode (Original style but clean/refactored) */
        <>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            style={{ color: '#000000' }}
            items={[
              {
                key: 'ALL',
                label: (
                  <span>
                    <AppstoreOutlined /> Tất cả ({items.filter((i) => i.cookingStatus !== COOKING_STATUS.READY).length})
                  </span>
                ),
              },
              {
                key: COOKING_STATUS.WAITING,
                label: (
                  <span>
                    <BellOutlined /> Chờ xác nhận ({waitingItems.length + acceptedItems.length})
                  </span>
                ),
              },
              {
                key: COOKING_STATUS.COOKING,
                label: (
                  <span>
                    <FireOutlined /> Đang làm ({cookingItems.length})
                  </span>
                ),
              },
              {
                key: COOKING_STATUS.READY,
                label: (
                  <span>
                    <CheckCircleOutlined /> Đã nấu xong ({readyItems.length})
                  </span>
                ),
              },
            ]}
          />

          {filteredItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 0',
                background: '#1f1f1f',
                borderRadius: 12,
                border: '1px solid #303030',
              }}
            >
              <Title level={4} style={{ color: '#595959' }}>
                🎉 Bếp hiện không có món nào thuộc danh mục này!
              </Title>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredItems.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.orderDetailId}>
                  {renderKdsCard(item)}
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
    </div>
  );
};

export default KDSPage;
