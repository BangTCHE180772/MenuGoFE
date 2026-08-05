/**
 * OrderPanel — Panel đơn hàng (cột phải)
 *
 * 3 trạng thái hiển thị:
 *  1. Không chọn bàn → hướng dẫn chọn bàn
 *  2. Chọn bàn không phải "Có khách" → hiện trạng thái + nút chuyển trạng thái
 *  3. Bàn "Có khách" → hiện giỏ hàng + nút gọi món + nút thanh toán
 */
import { useState } from 'react';
import { Spin, Tooltip } from 'antd';
import { getStatusConfig, TABLE_STATUS } from '../../data/tableConstants';
import '../../styles/pos-order-panel.css';

const formatPrice = (price) => price.toLocaleString('vi-VN') + 'đ';

/* ── Status transition buttons ───────────────────────────────────────────── */
const STATUS_TRANSITIONS = {
  [TABLE_STATUS.EMPTY]: [
    { to: TABLE_STATUS.OCCUPIED, label: 'Khách vào', cls: 'btn-orange' }
  ],
  [TABLE_STATUS.RESERVED]: [
    { to: 'CHECK_IN', label: 'Khách đến', cls: 'btn-orange' },
  ],
  [TABLE_STATUS.OCCUPIED]: [
    { to: TABLE_STATUS.CLEANING, label: 'Dọn dẹp', cls: 'btn-red' },
  ],
  [TABLE_STATUS.CLEANING]: [
    { to: TABLE_STATUS.EMPTY, label: 'Đã sạch', cls: 'btn-green' }
  ],
};

/* ── Cart Item Row ────────────────────────────────────────────────────────── */
const CartItem = ({ item, onUpdateQty, onRemove, onNoteChange }) => {
  const [showNote, setShowNote] = useState(false);
  return (
    <div className="pos-cart-item">
      <div className="pos-cart-item-top">
        <div className="pos-cart-item-emoji">{item.emoji}</div>
        <div className="pos-cart-item-info">
          <div className="pos-cart-item-name">{item.name}</div>
          <div className="pos-cart-item-unit">{formatPrice(item.price)} / phần</div>
        </div>
        <button className="pos-cart-item-remove" onClick={() => onRemove(item.id)} title="Xoá">✕</button>
      </div>

      <div className="pos-cart-item-bottom">
        {/* Qty control */}
        <div className="pos-qty-ctrl">
          <button className="pos-qty-btn pos-qty-btn--minus" onClick={() => onUpdateQty(item.id, item.qty - 1)}>−</button>
          <span className="pos-qty-val">{item.qty}</span>
          <button className="pos-qty-btn pos-qty-btn--plus" onClick={() => onUpdateQty(item.id, item.qty + 1)}>+</button>
        </div>
        {/* Line total */}
        <div className="pos-cart-item-total">{formatPrice(item.price * item.qty)}</div>
        {/* Note toggle */}
        <Tooltip title="Ghi chú cho bếp">
          <button className={`pos-note-btn ${item.note ? 'pos-note-btn--active' : ''}`} onClick={() => setShowNote(v => !v)}>
            Ghi chú
          </button>
        </Tooltip>
      </div>

      {showNote && (
        <input
          className="pos-cart-item-note"
          placeholder="Ghi chú (VD: ít cay, không hành...)"
          value={item.note || ''}
          onChange={(e) => onNoteChange(item.id, e.target.value)}
        />
      )}
    </div>
  );
};

/* ── Ordered Item Row ────────────────────────────────────────────────────────── */
const OrderedItem = ({ item, onMarkAsServed }) => {
  const isReady = item.cookingStatus === 'Ready';
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Waiting': return '#f59e0b'; // amber
      case 'Cooking': return '#3b82f6'; // blue
      case 'Ready': return '#10b981'; // green
      case 'Served': return '#6b7280'; // gray
      case 'Cancelled': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Waiting': return 'Chờ nấu';
      case 'Cooking': return 'Đang nấu';
      case 'Ready': return 'Bếp đã xong';
      case 'Served': return 'Đã phục vụ';
      case 'Cancelled': return 'Đã huỷ';
      default: return status;
    }
  };

  return (
    <div className={`pos-cart-item ${item.status === 'Cancelled' ? 'pos-cart-item--cancelled' : ''}`}>
      <div className="pos-cart-item-top">
        <div className="pos-cart-item-info">
          <div className="pos-cart-item-name">{item.productName} <span style={{fontWeight: 'bold'}}>x{item.quantity}</span></div>
          <div className="pos-cart-item-status-badge" style={{ backgroundColor: getStatusColor(item.cookingStatus) + '20', color: getStatusColor(item.cookingStatus) }}>
            <span style={{ backgroundColor: getStatusColor(item.cookingStatus) }} className="pos-order-status-dot" />
            {getStatusText(item.cookingStatus)}
          </div>
        </div>
        <div className="pos-cart-item-total" style={{alignSelf: 'flex-start'}}>{formatPrice(item.price * item.quantity)}</div>
      </div>

      {(isReady || item.note) && (
        <div className="pos-cart-item-bottom" style={{ marginTop: '8px', justifyContent: 'space-between' }}>
          <div className="pos-cart-item-note-display" style={{ fontStyle: 'italic', color: '#6b7280', fontSize: '12px' }}>
            {item.note && `Ghi chú: ${item.note}`}
          </div>
          {isReady && (
            <button 
              className="pos-action-btn pos-action-btn--serve"
              onClick={() => onMarkAsServed(item.orderDetailId)}
            >
              Đã phục vụ
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ── OrderPanel ───────────────────────────────────────────────────────────── */
const OrderPanel = ({
  table,
  summary,
  cartItems,
  canOrder,
  onUpdateQty,
  onRemoveItem,
  onNoteChange,
  onConfirm,
  onChangeStatus,
  onPayment,
  onMarkAsServed,
  onMerge,
  loading,
  isWaiterMode,
}) => {
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'ordered'

  const subTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subTotal * 0.08);
  const total = subTotal + tax;
  
  const orderedItems = summary?.items?.filter(i => i.status !== 'Cancelled') || [];
  const orderedSubTotal = orderedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const orderedTax = Math.round(orderedSubTotal * 0.08);
  const orderedTotal = orderedSubTotal + orderedTax;

  const cfg = table ? getStatusConfig(table.status) : null;
  const statusKey = table?.status || TABLE_STATUS.EMPTY;
  const transitions = [...(STATUS_TRANSITIONS[statusKey] || [])];
  
  if (statusKey === TABLE_STATUS.OCCUPIED && summary?.activeOrderId) {
    const cleanIndex = transitions.findIndex(t => t.to === TABLE_STATUS.CLEANING);
    if (cleanIndex >= 0 && !isWaiterMode) {
      transitions.splice(cleanIndex, 1, {
        isPayment: true,
        label: 'Thanh toán',
        cls: 'btn-red'
      });
    }
  }

  /* ─── 1. Chưa chọn bàn ────────────────────────────────────────────────── */
  if (!table) {
    return (
      <aside className="pos-order-panel glass-panel">
        <div className="pos-order-empty-state">
          <div className="pos-order-empty-icon"></div>
          <h3>Chưa chọn bàn</h3>
          <p>Chọn một bàn từ danh sách bên trái để bắt đầu phục vụ</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="pos-order-panel glass-panel">
      {/* Table Info Header */}
      <div className="pos-order-header glass-header">
        <div className="pos-order-table-name">{table.name}</div>
        <div
          className="pos-order-status-badge"
          style={{ color: cfg.textColor, background: cfg.bg, borderColor: cfg.border }}
        >
          <span style={{ background: cfg.dotColor }} className="pos-order-status-dot" />
          {cfg.label}
        </div>
      </div>

      {table.status === TABLE_STATUS.RESERVED && summary?.reservationId && (
        <div className="pos-reservation-info">
          <div className="pos-res-row"><strong>Khách hàng:</strong> {summary.customerName} - {summary.customerPhone}</div>
          <div className="pos-res-row"><strong>Giờ đặt:</strong> {summary.reservationTime ? new Date(summary.reservationTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}</div>
        </div>
      )}

      {/* Status Transition Buttons */}
      {(transitions.length > 0 || table.status === TABLE_STATUS.OCCUPIED) && (
        <div className="pos-status-transitions">
          {transitions.map((t, idx) => (
            <button
              key={t.to || idx}
              className={`pos-status-btn pos-status-btn--${t.cls}`}
              onClick={() => t.isPayment ? onPayment() : onChangeStatus(t.to)}
              disabled={loading}
            >
              {t.label}
            </button>
          ))}
          {table.status === TABLE_STATUS.OCCUPIED && (
            <button
              className="pos-status-btn pos-status-btn--merge"
              onClick={onMerge}
              disabled={loading}
            >
              Gộp bàn
            </button>
          )}
        </div>
      )}

      {/* ─── 2. Bàn không phải Có khách → chỉ hiện trạng thái ─────────── */}
      {!canOrder && (
        <div className="pos-order-not-occupied">
          <p>Bàn đang ở trạng thái <strong style={{ color: cfg.textColor }}>{cfg.label}</strong>.</p>
          <p>Chuyển bàn sang <strong style={{ color: '#f97316' }}>Có khách</strong> để bắt đầu gọi món.</p>
        </div>
      )}

      {/* ─── 3. Bàn Có khách → Giỏ hàng & Đã gọi ───────────────────────── */}
      {canOrder && (
        <div className="pos-order-content-area">
          <div className="pos-tabs">
            <button 
              className={`pos-tab ${activeTab === 'cart' ? 'active' : ''}`}
              onClick={() => setActiveTab('cart')}
            >
              Giỏ hàng mới {cartItems.length > 0 && <span className="pos-tab-badge">{cartItems.length}</span>}
            </button>
            <button 
              className={`pos-tab ${activeTab === 'ordered' ? 'active' : ''}`}
              onClick={() => setActiveTab('ordered')}
            >
              Đã gọi {orderedItems.length > 0 && <span className="pos-tab-badge">{orderedItems.length}</span>}
            </button>
          </div>

          {activeTab === 'cart' ? (
            <>
              <div className="pos-cart-list">
                {cartItems.length === 0 ? (
                  <div className="pos-cart-placeholder">
                    <div className="pos-cart-placeholder-icon"></div>
                    <p>Chưa có món mới nào</p>
                    <span>Chọn món từ thực đơn bên trái</span>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQty={onUpdateQty}
                      onRemove={onRemoveItem}
                      onNoteChange={onNoteChange}
                    />
                  ))
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="pos-order-summary glass-summary">
                  <div className="pos-summary-row">
                    <span>Tạm tính</span>
                    <span>{formatPrice(subTotal)}</span>
                  </div>
                  <div className="pos-summary-row">
                    <span>Thuế VAT (8%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="pos-summary-divider" />
                  <div className="pos-summary-row pos-summary-row--total">
                    <span>Tổng cộng</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              )}

              <div className="pos-order-actions">
                <button
                  className="pos-action-btn pos-action-btn--confirm"
                  onClick={onConfirm}
                  disabled={cartItems.length === 0 || loading}
                >
                  {loading ? <Spin size="small" /> : 'Xác nhận gọi món'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="pos-cart-list">
                {orderedItems.length === 0 ? (
                  <div className="pos-cart-placeholder">
                    <div className="pos-cart-placeholder-icon"></div>
                    <p>Bàn chưa gọi món nào</p>
                  </div>
                ) : (
                  orderedItems.map((item) => (
                    <OrderedItem
                      key={item.orderDetailId}
                      item={item}
                      onMarkAsServed={onMarkAsServed}
                    />
                  ))
                )}
              </div>

              {orderedItems.length > 0 && (
                <div className="pos-order-summary glass-summary">
                  <div className="pos-summary-row">
                    <span>Tạm tính</span>
                    <span>{formatPrice(orderedSubTotal)}</span>
                  </div>
                  <div className="pos-summary-row">
                    <span>Thuế VAT (8%)</span>
                    <span>{formatPrice(orderedTax)}</span>
                  </div>
                  <div className="pos-summary-divider" />
                  <div className="pos-summary-row pos-summary-row--total">
                    <span>Tổng thanh toán</span>
                    <span>{formatPrice(orderedTotal)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  );
};

export default OrderPanel;
