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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { getAllTables, getTablesByBranch, updateTable } from '../api/tableApi';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { createOrder, createOrderDetail } from '../api/orderApi';
import { getTableOrderSummary } from '../api/tableMapApi';
import { checkInReservation } from '../api/reservationApi';
import { TABLE_STATUS } from '../data/tableConstants';
import TablePanel from '../components/order/TablePanel';
import MenuPanel from '../components/order/MenuPanel';
import OrderPanel from '../components/order/OrderPanel';
import PaymentModal from '../components/payment/PaymentModal';
import MergeTableModal from '../components/tablemap/MergeTableModal';

const OrderPage = ({ isWaiterMode }) => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);

  const [searchParams] = useSearchParams();
  const tableIdParam = searchParams.get('tableId');

  const { user } = useAuth();
  const { deviceInfo } = useDevice();

  const loadTables = useCallback(async () => {
    setTableLoading(true);
    try {
      let res;
      const shiftBranchId = localStorage.getItem('activeShiftBranchId');
      
      if (deviceInfo) {
        res = await getTablesByBranch(deviceInfo.branchId);
      } else if (shiftBranchId) {
        res = await getTablesByBranch(shiftBranchId);
      } else {
        const isAdminOrOwner = user?.roles?.some(r => r === 'Admin' || r === 'Owner');
        const branchIds = user?.branchIds || [];
        res = (!isAdminOrOwner && branchIds.length > 0)
          ? await getTablesByBranch(branchIds)
          : await getAllTables();
      }
      const data = res?.data;
      const loadedTables = Array.isArray(data) ? data : [];
      setTables(loadedTables);

      if (tableIdParam && loadedTables.length > 0) {
        const t = loadedTables.find(x => x.id.toString() === tableIdParam);
        if (t) {
          setSelectedTable(t);
        }
      }
    } catch {
      message.error('Không thể tải danh sách bàn. Kiểm tra kết nối server.');
      setTables([]);
    } finally {
      setTableLoading(false);
    }
  }, [user, tableIdParam]);

  useEffect(() => { loadTables(); }, [loadTables]);

  const [orderSummary, setOrderSummary] = useState(null);

  const handleSelectTable = (table) => {
    if (selectedTable?.id === table.id) return;
    setSelectedTable(table);
    setCartItems([]);
  };

  useEffect(() => {
    if (!selectedTable) {
      setOrderSummary(null);
      return;
    }
    getTableOrderSummary(selectedTable.id)
      .then(res => setOrderSummary(res.data))
      .catch(err => {
        console.error(err);
        setOrderSummary(null);
      });
  }, [selectedTable]);

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

  const actionRef = useRef(false);

  const handleChangeTableStatus = async (newStatus) => {
    if (!selectedTable) return;
    if (actionRef.current) return;
    actionRef.current = true;

      if (newStatus === 'CHECK_IN') {
        if (!orderSummary?.reservationId) {
          message.error("Không tìm thấy thông tin đặt bàn!");
          actionRef.current = false;
          return;
        }
        try {
          await checkInReservation(orderSummary.reservationId);
          message.success("Đã xác nhận khách đến!");
          const updated = { ...selectedTable, status: TABLE_STATUS.OCCUPIED };
          setSelectedTable(updated);
          setTables((prev) => prev.map((t) => String(t.id) === String(updated.id) ? updated : t));
          const summaryRes = await getTableOrderSummary(selectedTable.id);
          setOrderSummary(summaryRes.data);
        } catch (err) {
          console.error(err);
          message.error("Xác nhận khách đến thất bại!");
        } finally {
          actionRef.current = false;
        }
        return;
      }

      if (newStatus === TABLE_STATUS.CLEANING) {
      try {
        const summaryRes = await getTableOrderSummary(selectedTable.id);
        if (summaryRes.data?.activeOrderId) {
          message.warning('Bàn đang có hoá đơn chưa thanh toán. Vui lòng thanh toán hoá đơn trước khi dọn bàn!');
          return;
        }
      } catch (err) {
        console.error('Lỗi kiểm tra hoá đơn của bàn:', err);
      }
    }

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
      setTables((prev) => prev.map((t) => String(t.id) === String(updated.id) ? updated : t));

      if (newStatus !== TABLE_STATUS.OCCUPIED) setCartItems([]);
      message.success('Đã cập nhật trạng thái bàn');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái bàn';
      message.error(msg);
    } finally {
      actionRef.current = false;
    }
  };


  const isConfirmingRef = useRef(false);

  const handleConfirmOrder = async () => {
    if (!selectedTable || cartItems.length === 0) return;
    if (isConfirmingRef.current) return;

    const isOccupied = selectedTable.status?.toLowerCase() === 'occupied';
    if (!isOccupied) {
      message.warning('Bàn phải ở trạng thái Có khách để gọi món');
      return;
    }

    const subTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const total = Math.round(subTotal * 1.08);

    isConfirmingRef.current = true;
    setOrderLoading(true);
    try {
      const summaryRes = await getTableOrderSummary(selectedTable.id);
      let orderId = summaryRes.data?.originalOrderId || summaryRes.data?.activeOrderId;

      if (!orderId) {
        const orderRes = await createOrder({
          tableId: selectedTable.id,
          fatherId: null,
          method: 'DineIn',
          status: 'Active',
          customerId: null,
          totalAmount: total,
          createdBy: 1,
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
            status: 'Confirmed',
            cookingStatus: 'Waiting',
          })
        )
      );

      message.success(`Gọi thêm món thành công!`);
      setCartItems([]);
      
      const newSummaryRes = await getTableOrderSummary(selectedTable.id);
      setOrderSummary(newSummaryRes.data);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Lỗi khi tạo/gọi thêm đơn hàng';
      message.error(msg);
    } finally {
      setOrderLoading(false);
      isConfirmingRef.current = false;
    }
  };

  const isOccupied = selectedTable?.status?.toLowerCase() === 'occupied';

  return (
    <div className="pos-page">
      <div className="pos-top-bar">
        <div className="pos-top-bar-left">
          <span className="pos-top-bar-icon"></span>
          <span className="pos-top-bar-title">MenuGo POS</span>
          <span className="pos-top-bar-divider">|</span>
          <span className="pos-top-bar-sub">Phục vụ</span>
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
          summary={orderSummary}
          cartItems={cartItems}
          canOrder={isOccupied}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onNoteChange={handleNoteChange}
          onConfirm={handleConfirmOrder}
          onChangeStatus={handleChangeTableStatus}
          onPayment={() => setIsPaymentModalVisible(true)}
          onMerge={() => setIsMergeModalVisible(true)}
          loading={orderLoading}
          isWaiterMode={isWaiterMode}
        />
      </div>

      <PaymentModal
        visible={isPaymentModalVisible}
        orderId={orderSummary?.activeOrderId}
        items={orderSummary?.items}
        onCancel={() => setIsPaymentModalVisible(false)}
        onSuccess={() => {
          setIsPaymentModalVisible(false);
          loadTables();
          if (selectedTable) {
            getTableOrderSummary(selectedTable.id)
              .then(res => setOrderSummary(res.data))
              .catch(() => setOrderSummary(null));
          }
        }}
      />

      {isMergeModalVisible && (
        <MergeTableModal
          visible={isMergeModalVisible}
          onClose={() => setIsMergeModalVisible(false)}
          tables={tables}
          currentTable={selectedTable}
          onMerged={() => {
            loadTables();
            if (selectedTable) {
              getTableOrderSummary(selectedTable.id)
                .then(res => setOrderSummary(res.data))
                .catch(() => setOrderSummary(null));
            }
          }}
        />
      )}
    </div>
  );
};

export default OrderPage;
