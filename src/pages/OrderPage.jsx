/**
 * OrderPage
 *
 * Layout 3 cột theo phong cách :
 *  [TablePanel] | [MenuPanel] | [OrderPanel]
 *
 * Tích hợp:
 *  - GET  /api/Table        → danh sách bàn (fallback mock nếu lỗi)
 *  - PUT  /api/Table        → cập nhật trạng thái bàn
 *  - POST /api/Order        → tạo đơn hàng
 *  - POST /api/Order/:id/details → tạo chi tiết món
 *
 * Quy tắc: Chỉ được gọi món khi bàn status = "Occupied" (kiểm tra ở BE)
 */
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { getAllTables, getTablesByBranch, updateTable } from '../api/tableApi';
import { useAuth } from '../context/AuthContext';
import { createOrder, createOrderDetail } from '../api/orderApi';
import { TABLE_STATUS } from '../data/tableConstants';
import TablePanel from '../components/order/TablePanel';
import MenuPanel from '../components/order/MenuPanel';
import OrderPanel from '../components/order/OrderPanel';

const CashierPage = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const { user } = useAuth();

  /* ── Load tables ─────────────────────────────────────────────────────── */
  const loadTables = useCallback(async () => {
    setTableLoading(true);
    try {
      const branchIds = user?.branchIds || [];
      const res = branchIds.length > 0 
        ? await getTablesByBranch(branchIds)
        : await getAllTables();
      const data = res?.data;
      setTables(Array.isArray(data) ? data : []);
    } catch {
      message.error('Không thể tải danh sách bàn. Kiểm tra kết nối server.');
      setTables([]);
    } finally {
      setTableLoading(false);
    }
  }, [user]);

  useEffect(() => { loadTables(); }, [loadTables]);

  /* ── Chọn bàn ─────────────────────────────────────────────────────────── */
  const handleSelectTable = (table) => {
    if (selectedTable?.id === table.id) return;
    setSelectedTable(table);
    setCartItems([]); // clear giỏ khi đổi bàn
  };

  /* ── Thêm / sửa / xóa món trong giỏ ─────────────────────────────────── */
  const handleAddItem = useCallback((item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1, note: '' }];
    });
  }, []);

  const handleUpdateQty = useCallback((id, qty) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setCartItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
    }
  }, []);

  const handleRemoveItem = useCallback((id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleNoteChange = useCallback((id, note) => {
    setCartItems((prev) => prev.map((i) => i.id === id ? { ...i, note } : i));
  }, []);

  /* ── Cập nhật trạng thái bàn ─────────────────────────────────────────── */
  const handleChangeTableStatus = async (newStatus) => {
    if (!selectedTable) return;
    try {
      await updateTable({
        id: selectedTable.id,
        areaId: selectedTable.areaId,
        name: selectedTable.name,
        status: newStatus,
        isActive: selectedTable.isActive ?? true,
      });
      const updated = { ...selectedTable, status: newStatus };
      setSelectedTable(updated);
      setTables((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      // Xoá giỏ nếu bàn không còn là Có khách
      if (newStatus !== TABLE_STATUS.OCCUPIED) setCartItems([]);
      message.success('Đã cập nhật trạng thái bàn');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái bàn';
      message.error(msg);
    }
  };

  /* ── Xác nhận gọi món → tạo Order + OrderDetails trên BE ─────────────── */
  const handleConfirmOrder = async () => {
    if (!selectedTable || cartItems.length === 0) return;

    const isOccupied = selectedTable.status?.toLowerCase() === 'occupied';
    if (!isOccupied) {
      message.warning('Bàn phải ở trạng thái Có khách để gọi món');
      return;
    }

    const subTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const total = Math.round(subTotal * 1.08); // + VAT 8%

    setOrderLoading(true);
    try {
      /* 1. Tạo Order */
      const orderRes = await createOrder({
        tableId: selectedTable.id,
        fatherId: null,
        method: 'DineIn',
        status: 'Pending',
        customerId: null,
        totalAmount: total,
        createdBy: 1,
      });
      const orderId = orderRes?.data?.id ?? orderRes?.data;

      /* 2. Tạo từng OrderDetail */
      await Promise.all(
        cartItems.map((item) =>
          createOrderDetail(orderId, {
            productId: item.id,
            recipeId: null,
            quantity: item.qty,
            price: item.price,
            note: item.note || '',
            status: 'Pending',
            cookingStatus: 'Waiting',
          })
        )
      );

      message.success(`Gọi món thành công! Mã đơn: #${orderId}`);
      setCartItems([]); // clear giỏ sau khi gọi thành công
    } catch (err) {
      const msg = err?.response?.data?.message || 'Lỗi khi tạo đơn hàng';
      message.error(msg);
    } finally {
      setOrderLoading(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  const isOccupied = selectedTable?.status?.toLowerCase() === 'occupied';

  return (
    <div className="pos-page">
      {/* Thanh info trên cùng */}
      <div className="pos-top-bar">
        <div className="pos-top-bar-left">
          <span className="pos-top-bar-icon"></span>
          <span className="pos-top-bar-title">MenuGo POS</span>
          <span className="pos-top-bar-divider">|</span>
          <span className="pos-top-bar-sub">Thu ngân</span>
        </div>
        <div className="pos-top-bar-right">
          <span className="pos-top-bar-time" suppressHydrationWarning>
            {new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
          <button className="pos-top-bar-refresh" onClick={loadTables} title="Làm mới danh sách bàn">
            🔄
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="pos-layout">
        <TablePanel
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={handleSelectTable}
          loading={tableLoading}
        />

        <MenuPanel
          canOrder={isOccupied}
          onAddItem={handleAddItem}
        />

        <OrderPanel
          table={selectedTable}
          cartItems={cartItems}
          canOrder={isOccupied}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onNoteChange={handleNoteChange}
          onConfirm={handleConfirmOrder}
          onChangeStatus={handleChangeTableStatus}
          loading={orderLoading}
        />
      </div>
    </div>
  );
};

export default CashierPage;
