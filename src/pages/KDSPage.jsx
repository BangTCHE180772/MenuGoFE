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
  Modal,
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
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

// Standard cooking status definitions
const COOKING_STATUS = {
  WAITING: 'Waiting',   // Món mới (New)
  ACCEPTED: 'Accepted', // Đã nhận
  COOKING: 'Cooking',   // Đang nấu
  READY: 'Ready',       // Đã xong / Hoàn thành
};

const KDSPage = () => {
  const { user } = useAuth();
  const currentBranchId = user?.branchId || user?.contracts?.find((c) => (c.status === 'Active' || c.status === 1) && c.branchId)?.branchId;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState('COLUMN'); // 'COLUMN' (Chia dọc) or 'GRID' (Grid/Tab)
  const [cancelledAlerts, setCancelledAlerts] = useState([]);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const signalRConnection = useSignalR();

  // Join branch-specific SignalR group
  useEffect(() => {
    if (signalRConnection && currentBranchId) {
      signalRConnection
        .invoke('JoinBranchGroup', Number(currentBranchId))
        .catch((err) => console.log('JoinBranchGroup error:', err));
    }
  }, [signalRConnection, currentBranchId]);

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

      // Branch isolation check: Bỏ qua nếu thông báo thuộc chi nhánh khác
      if (notif.branchId && currentBranchId && Number(notif.branchId) !== Number(currentBranchId)) {
        console.log('KDS Notification ignored due to branch mismatch:', notif.branchId, 'vs', currentBranchId);
        return;
      }

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



  // Group items by status for Filter Tabs & Columns
  const waitingItems = useMemo(() => items.filter((i) => !i.cookingStatus || i.cookingStatus === COOKING_STATUS.WAITING), [items]);
  const acceptedItems = useMemo(() => items.filter((i) => i.cookingStatus === COOKING_STATUS.ACCEPTED), [items]);
  const cookingItems = useMemo(() => items.filter((i) => i.cookingStatus === COOKING_STATUS.COOKING), [items]);
  const readyItems = useMemo(() => items.filter((i) => i.cookingStatus === COOKING_STATUS.READY), [items]);



  // Group a list of items by dish, splitting each dish into batches of up to 10
  // portions (mẻ) so the queue columns below the Batch Processing Bar are also
  // divided by mẻ instead of a flat, ungrouped list.
  const groupItemsByDish = useCallback((list) => {
    const groups = {};
    list.forEach((item) => {
      const key = item.productId || item.productName;
      if (!groups[key]) {
        groups[key] = {
          productId: item.productId,
          productName: item.productName || item.ProductName,
          items: [],
        };
      }
      groups[key].items.push(item);
    });

    const result = [];
    Object.values(groups).forEach((group) => {
      const sorted = [...group.items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      let batchIndex = 1;
      let currentBatch = { productId: group.productId, productName: group.productName, batchIndex, totalQty: 0, items: [] };

      sorted.forEach((item) => {
        if (currentBatch.totalQty > 0 && currentBatch.totalQty + item.quantity > 10) {
          result.push(currentBatch);
          batchIndex += 1;
          currentBatch = { productId: group.productId, productName: group.productName, batchIndex, totalQty: 0, items: [] };
        }
        currentBatch.items.push(item);
        currentBatch.totalQty += item.quantity;
      });

      if (currentBatch.items.length > 0) result.push(currentBatch);
    });

    return result;
  }, []);

  // Reusable renderer for a "chia theo mẻ" grouped column section
  const renderGroupedColumn = (list, emptyLabel) => {
    if (list.length === 0) {
      return <div style={{ textAlign: 'center', padding: '40px 0', color: '#595959' }}>{emptyLabel}</div>;
    }
    return groupItemsByDish(list).map((batch) => (
      <div key={`${batch.productId || batch.productName}_${batch.batchIndex}`} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong style={{ color: '#000000', fontSize: 14 }}>{batch.productName}</Text>
          {batch.items.length > 1 && (
            <Tag color="cyan" style={{ margin: 0, fontWeight: 700 }}>
              Mẻ {batch.batchIndex} • {batch.totalQty} phần
            </Tag>
          )}
        </div>
        {batch.items.map(renderKdsCard)}
      </div>
    ));
  };

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
          height: 340,
          display: 'flex',
          flexDirection: 'column',
        }}
        bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title
              level={4}
              style={{
                color: '#000000',
                margin: '0 0 4px 0',
                fontSize: 16,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {item.productName}
            </Title>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#faad14', fontVariantNumeric: 'tabular-nums' }}>
              Số lượng: x{item.quantity}
            </div>
          </div>
        </div>

        {/* Note / Special instructions (scrolls internally so the frame never grows) */}
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
              maxHeight: 56,
              overflowY: 'auto',
            }}
          >
            <strong>📝 Ghi chú:</strong> {item.note}
          </div>
        )}

        {/* Status Badge */}
        <div style={{ marginBottom: 16 }}>{statusTag}</div>

        {/* Spacer keeps the frame uniform (same height) regardless of note/image content */}
        <div style={{ flex: 1 }} />

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
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          backgroundColor: '#ffffff',
          padding: '16px 24px',
          borderRadius: 12,
          marginBottom: 20,
          border: '1px solid #303030',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <Space size="large" style={{ flexShrink: 0 }}>
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
              flexShrink: 0,
            }}
          >
            <FireOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <Title level={3} style={{ color: '#000000', margin: 0, whiteSpace: 'nowrap' }}>
              Màn hình Bếp & Chế biến (KDS)
            </Title>
            <Text style={{ color: '#595959', whiteSpace: 'nowrap' }}>
              Điều phối & Điều khiển Thứ tự Chế biến Món ăn theo Thời gian Thực
            </Text>
          </div>
        </Space>

        <Space size="middle" wrap style={{ flexShrink: 0 }}>
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

          <Button
            icon={<CheckCircleOutlined />}
            onClick={() => setShowCompletedModal(true)}
            style={{ backgroundColor: '#f6ffed', borderColor: '#52c41a', color: '#389e0d', borderRadius: 16 }}
          >
            Hoàn thành ({readyItems.length})
          </Button>
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
                color: '#ffffff',
                borderRadius: 8,
              }}
            />
          ))}
        </div>
      )}

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
                {waitingItems.length + acceptedItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#595959' }}>Không có món chờ chế biến</div>
                ) : (
                  [...waitingItems, ...acceptedItems].map(item => renderKdsCard(item))
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
                {renderGroupedColumn(cookingItems, 'Không có món đang làm')}
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
                {renderGroupedColumn(readyItems, 'Chưa có món hoàn thành')}
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

      {/* ── Modal: All completed orders (Đơn đã hoàn thành) ─────── */}
      <Modal
        title={`✅ Đơn đã hoàn thành (${readyItems.length})`}
        open={showCompletedModal}
        onCancel={() => setShowCompletedModal(false)}
        footer={null}
        width={900}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
          {renderGroupedColumn(readyItems, 'Chưa có món hoàn thành')}
        </div>
      </Modal>
    </div>
  );
};

export default KDSPage;
