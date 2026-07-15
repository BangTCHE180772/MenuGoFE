import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { message, Spin, Spin as AntSpin, Modal } from 'antd';
import { getTableOrderSummary } from '../api/tableMapApi';
import { createOrder, createOrderDetail, cancelOrder, cancelOrderDetail } from '../api/orderApi';
import { callStaff, requestBill } from '../api/customerActionApi';
import MenuPanel from '../components/order/MenuPanel';
import '../styles/customer-order.css';

const formatPrice = (price) => Number(price).toLocaleString('vi-VN') + 'đ';

const getStatusBadge = (status, cookingStatus) => {
  if (status === 'Cancelled') return <span style={{ color: '#ef4444' }}>Đã huỷ</span>;
  if (status === 'CustomerPending') return <span style={{ color: '#f59e0b' }}>Chờ xác nhận</span>;
  if (cookingStatus === 'Waiting') return <span style={{ color: '#3b82f6' }}>Chờ nấu</span>;
  if (cookingStatus === 'Cooking') return <span style={{ color: '#f97316' }}>Đang nấu</span>;
  if (cookingStatus === 'Ready') return <span style={{ color: '#10b981' }}>Sẵn sàng</span>;
  if (cookingStatus === 'Served') return <span style={{ color: '#6b7280' }}>Đã phục vụ</span>;
  return <span>{status}</span>;
};

const getTableStatusText = (status) => {
  switch (status?.toLowerCase()) {
    case 'empty': return 'Trống';
    case 'reserved': return 'Đã đặt';
    case 'occupied': return 'Có khách';
    case 'cleaning': return 'Đang dọn';
    default: return status || 'Không rõ';
  }
};

const CustomerOrderPage = () => {
  const { tableId } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const fetchTableSummary = useCallback(async () => {
    try {
      const res = await getTableOrderSummary(tableId);
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể lấy thông tin bàn');
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    fetchTableSummary();
    const interval = setInterval(() => {
      fetchTableSummary();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTableSummary]);

  const isOccupied = summary?.tableStatus?.toLowerCase() === 'occupied';

  const handleAddItem = useCallback((item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    message.success(`Đã thêm ${item.name} vào giỏ`, 1);
  }, []);

  const handleUpdateQty = (id, delta) => {
    setCartItems((prev) => {
      return prev.map(i => {
        if (i.id === id) {
          const newQty = i.qty + delta;
          return { ...i, qty: newQty > 0 ? newQty : 0 };
        }
        return i;
      }).filter(i => i.qty > 0);
    });
  };

  const handleCallStaff = async () => {
    try {
      await callStaff(tableId);
      message.success('Đã gửi thông báo đến nhân viên. Vui lòng đợi trong giây lát!', 3);
    } catch (error) {
      message.error('Lỗi khi gọi nhân viên');
    }
  };

  const handleRequestBill = async () => {
    try {
      await requestBill(tableId);
      message.success('Đã gửi yêu cầu thanh toán / dọn bàn. Vui lòng đợi trong giây lát!', 3);
    } catch (error) {
      message.error('Lỗi khi gửi yêu cầu');
    }
  };

  const handleCancelItem = (detailId, itemName) => {
    Modal.confirm({
      title: 'Xác nhận hủy món',
      content: `Bạn có chắc chắn muốn hủy món "${itemName}" không?`,
      okText: 'Hủy món',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        try {
          await cancelOrderDetail(detailId);
          message.success(`Đã hủy món ${itemName}`);
          fetchTableSummary();
        } catch (error) {
          message.error(error.response?.data?.message || 'Lỗi khi hủy món');
        }
      }
    });
  };

  const handleCancelOrder = () => {
    if (!summary?.activeOrderId) return;
    Modal.confirm({
      title: 'Xác nhận hủy toàn bộ đơn',
      content: 'Bạn có chắc chắn muốn hủy toàn bộ đơn hàng này không? Bàn sẽ được giải phóng.',
      okText: 'Hủy đơn',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        try {
          await cancelOrder(summary.activeOrderId);
          message.success('Đã hủy đơn hàng thành công');
          fetchTableSummary();
        } catch (error) {
          message.error(error.response?.data?.message || 'Lỗi khi hủy đơn');
        }
      }
    });
  };

  const handleSubmitOrder = async () => {
    if (!isOccupied || cartItems.length === 0) return;

    setOrderLoading(true);
    try {
      let orderId = summary?.activeOrderId;

      if (!orderId) {
        const subTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
        const total = Math.round(subTotal * 1.08);
        const orderRes = await createOrder({
          tableId: Number(tableId),
          fatherId: null,
          method: 'DineIn',
          status: 'Active',
          customerId: null,
          totalAmount: total,
          createdBy: 0,
        });
        orderId = orderRes?.data?.id ?? orderRes?.data;
      }

      await Promise.all(
        cartItems.map((item) =>
          createOrderDetail(orderId, {
            productId: item.id,
            recipeId: null,
            quantity: item.qty,
            price: item.price,
            note: item.note || '',
            status: 'CustomerPending',
            cookingStatus: 'Waiting',
          })
        )
      );

      message.success('Đặt món thành công! Nhân viên sẽ ra xác nhận sớm.');
      setCartItems([]);
      setIsCartOpen(false);
      setActiveTab('ordered');
      fetchTableSummary();
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi đặt món');
    } finally {
      setOrderLoading(false);
    }
  };

  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.qty, 0), [cartItems]);

  const activeItems = summary?.items?.filter(i => i.status !== 'Cancelled') || [];
  const canCancelOrder = activeItems.length > 0 && activeItems.every(i => i.cookingStatus === 'Waiting');

  if (loading) return <div className="co-empty-state"><AntSpin size="large" /></div>;
  if (!summary) return <div className="co-empty-state">Không tìm thấy thông tin bàn</div>;

  return (
    <div className="co-page">
      <div className="co-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="co-header-title">{summary.tableName}</div>
          <div className={`co-header-status ${isOccupied ? 'occupied' : 'empty'}`}>
            {getTableStatusText(summary.tableStatus)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOccupied && (
            <button
              onClick={handleCallStaff}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Gọi phục vụ hỗ trợ
            </button>
          )}
          {isOccupied && summary?.items?.length > 0 && (
            <button
              onClick={handleRequestBill}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Thanh toán
            </button>
          )}
        </div>
      </div>

      <div className="co-tabs">
        <button
          className={`co-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Thực đơn
        </button>
        <button
          className={`co-tab-btn ${activeTab === 'ordered' ? 'active' : ''}`}
          onClick={() => setActiveTab('ordered')}
        >
          Món đã gọi {summary.items?.length > 0 && `(${summary.items.length})`}
        </button>
      </div>

      <div className="co-content">
        {!isOccupied && (
          <div className="co-locked-overlay">
            <div className="co-locked-icon">👋</div>
            <div className="co-locked-title">Chào mừng quý khách</div>
            <div className="co-locked-desc">
              Vui lòng gọi nhân viên để mở bàn trước khi bắt đầu gọi món nhé!
            </div>
            <button className="co-btn-call" onClick={handleCallStaff}>
              Gọi nhân viên
            </button>
          </div>
        )}

        {activeTab === 'menu' ? (
          <div className="co-menu-wrap">
            <MenuPanel canOrder={isOccupied} onAddItem={handleAddItem} />
          </div>
        ) : (
          <div className="co-ordered-list">
            {summary.items?.length > 0 ? (
              summary.items.map((item) => (
                <div key={item.orderDetailId} className="co-ordered-item">
                  <div className="co-ordered-info">
                    <div className="co-ordered-name">{item.productName}</div>
                    <div className="co-ordered-meta">
                      <span>SL: {item.quantity}</span>
                      <span className="co-ordered-price">{formatPrice(item.price)}</span>
                    </div>
                  </div>
                  <div className="co-ordered-status">
                    {getStatusBadge(item.status, item.cookingStatus)}
                    <span className="co-ordered-time">
                      {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {item.status !== 'Cancelled' && item.cookingStatus === 'Waiting' && (
                      <button 
                        className="co-btn-cancel-item" 
                        onClick={() => handleCancelItem(item.orderDetailId, item.productName)}
                        style={{ marginTop: '8px', color: '#ef4444', background: 'transparent', border: '1px solid #ef4444', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Hủy món
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="co-empty-state">
                <div className="co-empty-state-icon">🍽️</div>
                <p>Chưa có món nào được gọi</p>
              </div>
            )}
            
            {canCancelOrder && (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <button 
                  onClick={handleCancelOrder}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
                >
                  Hủy toàn bộ đơn hàng
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isOccupied && cartCount > 0 && (
        <button className="co-floating-cart" onClick={() => setIsCartOpen(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🛒</span>
            <div className="co-cart-badge">{cartCount}</div>
          </div>
          <span>Xem giỏ hàng • {formatPrice(cartTotal)}</span>
        </button>
      )}

      <div className={`co-cart-modal ${isCartOpen ? 'open' : ''}`}>
        <div className="co-cart-content">
          <div className="co-cart-header">
            <div className="co-cart-title">Giỏ hàng của bạn</div>
            <button className="co-cart-close" onClick={() => setIsCartOpen(false)}>✕</button>
          </div>

          <div className="co-cart-items">
            {cartItems.length > 0 ? cartItems.map(item => (
              <div key={item.id} className="co-cart-item">
                <div className="co-cart-item-info">
                  <div className="co-cart-item-name">{item.name}</div>
                  <div className="co-cart-item-price">{formatPrice(item.price)}</div>
                </div>
                <div className="co-cart-qty-ctrl">
                  <button className="co-qty-btn" onClick={() => handleUpdateQty(item.id, -1)}>−</button>
                  <span style={{ fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                  <button className="co-qty-btn" onClick={() => handleUpdateQty(item.id, 1)}>+</button>
                </div>
              </div>
            )) : (
              <div className="co-empty-state" style={{ padding: '20px' }}>Giỏ hàng trống</div>
            )}
          </div>

          <div className="co-cart-footer">
            <div className="co-cart-total">
              <span>Tổng cộng (tạm tính)</span>
              <span style={{ color: '#f97316' }}>{formatPrice(cartTotal)}</span>
            </div>
            <button
              className="co-btn-submit"
              onClick={handleSubmitOrder}
              disabled={cartItems.length === 0 || orderLoading}
            >
              {orderLoading ? 'Đang gửi...' : 'GỬI ĐƠN XUỐNG BẾP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderPage;
