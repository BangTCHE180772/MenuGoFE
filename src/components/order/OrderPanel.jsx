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

const formatPrice = (price) => price.toLocaleString('vi-VN') + 'đ';

/* ── Status transition buttons ───────────────────────────────────────────── */
const STATUS_TRANSITIONS = {
  empty: [
    { to: TABLE_STATUS.RESERVED, label: 'Đặt bàn', cls: 'btn-blue' },
    { to: TABLE_STATUS.OCCUPIED, label: 'Có khách', cls: 'btn-orange' },
  ],
  reserved: [
    { to: TABLE_STATUS.OCCUPIED, label: 'Khách đến', cls: 'btn-orange' },
    { to: TABLE_STATUS.EMPTY, label: 'Huỷ đặt', cls: 'btn-gray' },
  ],
  occupied: [
    { to: TABLE_STATUS.CLEANING, label: 'Dọn dẹp', cls: 'btn-red' },
  ],
  cleaning: [
    { to: TABLE_STATUS.EMPTY, label: 'Đã sạch', cls: 'btn-green' },
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

/* ── OrderPanel ───────────────────────────────────────────────────────────── */
const OrderPanel = ({
  table,
  cartItems,
  canOrder,
  onUpdateQty,
  onRemoveItem,
  onNoteChange,
  onConfirm,
  onChangeStatus,
  loading,
}) => {
  const subTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subTotal * 0.08);
  const total = subTotal + tax;
  const cfg = table ? getStatusConfig(table.status) : null;
  const statusKey = table?.status?.toLowerCase() || 'empty';
  const transitions = STATUS_TRANSITIONS[statusKey] || [];

  /* ─── 1. Chưa chọn bàn ────────────────────────────────────────────────── */
  if (!table) {
    return (
      <aside className="pos-order-panel">
        <div className="pos-order-empty-state">
          <div className="pos-order-empty-icon"></div>
          <h3>Chưa chọn bàn</h3>
          <p>Chọn một bàn từ danh sách bên trái để bắt đầu phục vụ</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="pos-order-panel">
      {/* Table Info Header */}
      <div className="pos-order-header">
        <div className="pos-order-table-name">{table.name}</div>
        <div
          className="pos-order-status-badge"
          style={{ color: cfg.textColor, background: cfg.bg, borderColor: cfg.border }}
        >
          <span style={{ background: cfg.dotColor }} className="pos-order-status-dot" />
          {cfg.label}
        </div>
      </div>

      {/* Status Transition Buttons */}
      {transitions.length > 0 && (
        <div className="pos-status-transitions">
          {transitions.map((t) => (
            <button
              key={t.to}
              className={`pos-status-btn pos-status-btn--${t.cls}`}
              onClick={() => onChangeStatus(t.to)}
              disabled={loading}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ─── 2. Bàn không phải Có khách → chỉ hiện trạng thái ─────────── */}
      {!canOrder && (
        <div className="pos-order-not-occupied">
          <p>Bàn đang ở trạng thái <strong style={{ color: cfg.textColor }}>{cfg.label}</strong>.</p>
          <p>Chuyển bàn sang <strong style={{ color: '#f97316' }}>Có khách</strong> để bắt đầu gọi món.</p>
        </div>
      )}

      {/* ─── 3. Bàn Có khách → Giỏ hàng đầy đủ ───────────────────────── */}
      {canOrder && (
        <>
          {/* Cart items */}
          <div className="pos-cart-list">
            {cartItems.length === 0 ? (
              <div className="pos-cart-placeholder">
                <div className="pos-cart-placeholder-icon"></div>
                <p>Chưa có món nào</p>
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

          {/* Totals */}
          {cartItems.length > 0 && (
            <div className="pos-order-summary">
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

          {/* Action Buttons */}
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
      )}
    </aside>
  );
};

export default OrderPanel;
