import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  FullscreenOutlined,
  PrinterOutlined,
  RightOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { getProductsByDate, getPreviousLedgerSnapshots } from '../../../../api/binventoryApi';
import { createCheckDocument } from '../../../../api/documentApi';
import KiotDateTimePicker from '../Import/KiotDateTimePicker';
import { useAuth } from '../../../../context/AuthContext';

const CheckDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = []
}) => {
  const auth = useAuth ? useAuth() : {};
  const user = auth?.user;
  const creatorName = user?.name || user?.email || 'Mno';

  const [loading, setLoading] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(dayjs());
  const [openTimeFormatted, setOpenTimeFormatted] = useState('');
  const [openTimeISO, setOpenTimeISO] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [bInventoryList, setBInventoryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    docCode: '',
    note: ''
  });
  const [items, setItems] = useState([]);
  const [recentChecks, setRecentChecks] = useState([]);

  // Fetch BInventories by branch, date & searchQuery as user types
  const fetchBInventories = useCallback((bId, date, query = '') => {
    if (!bId) return;
    getProductsByDate(bId, date, query)
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setBInventoryList(data);
      })
      .catch((err) => {
        console.error('Failed to load BInventories by date:', err);
        setBInventoryList([]);
      });
  }, []);

  useEffect(() => {
    if (open) {
      const now = dayjs();
      setSelectedDateTime(now);
      setOpenTimeFormatted(now.format('DD/MM/YYYY HH:mm'));
      setOpenTimeISO(now.toISOString());
      setShowDatePicker(false);
      setSearchQuery('');
      setShowDropdown(false);

      setFormData({
        docCode: '',
        note: ''
      });
      setItems([]);
      setRecentChecks([]);

      if (branchId) {
        fetchBInventories(branchId, now.toISOString(), '');
      }
    }
  }, [open, branchId, fetchBInventories]);

  // Trigger search on user typing
  useEffect(() => {
    if (!open || !branchId) return;
    const timer = setTimeout(() => {
      fetchBInventories(branchId, openTimeISO || new Date().toISOString(), searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, open, branchId, openTimeISO, fetchBInventories]);

  // Handle date change bi-directionally
  const handleDateChange = async (newDate) => {
    setSelectedDateTime(newDate);
    const formattedStr = newDate.format('DD/MM/YYYY HH:mm');
    const isoStr = newDate.toISOString();
    setOpenTimeFormatted(formattedStr);
    setOpenTimeISO(isoStr);

    if (branchId) {
      fetchBInventories(branchId, isoStr, searchQuery);
    }

    if (items.length > 0) {
      try {
        const bInvIds = items.map((i) => Number(i.bInventoryId)).filter(Boolean);
        const snapshots = await getPreviousLedgerSnapshots(isoStr, bInvIds);
        const snapshotMap = new Map();
        if (Array.isArray(snapshots)) {
          snapshots.forEach((s) => snapshotMap.set(Number(s.bInventoryId || s.binventoryId), s));
        }

        setItems((prevItems) =>
          prevItems.map((item) => {
            const snap = snapshotMap.get(Number(item.bInventoryId));
            const newStock = snap ? Number(snap.runningQuantity || 0) : 0;
            const newCost = snap ? Number(snap.runningAverageCost || 0) : 0;
            return {
              ...item,
              systemStock: newStock,
              costPrice: newCost
            };
          })
        );
        message.info(`Đã cập nhật tồn kho & giá vốn hệ thống theo mốc thời gian ${formattedStr}`);
      } catch (err) {
        console.error('Failed to update ledger snapshots on date change:', err);
      }
    }
  };

  const searchOptions = useMemo(() => {
    const rawList = bInventoryList.length > 0 ? bInventoryList : products;
    return rawList
      .filter((b) => b && (b.id != null || b.bInventoryId != null || b.productId != null))
      .map((b) => ({
        id: b.id ?? b.bInventoryId ?? b.productId,
        code: b.code || b.skuCode || `SP${b.id ?? b.productId}`,
        name: b.name || 'Sản phẩm',
        systemStock: b.runningQuantity ?? b.quantity ?? b.stockQuantity ?? 0,
        costPrice: b.runningAverageCost ?? b.purchasePrice ?? b.avg ?? b.sellPrice ?? 0,
        unitName: b.baseUnit?.unitName || b.unitConversions?.[0]?.unitName || ''
      }));
  }, [bInventoryList, products]);

  // Filter options strictly following search query AND EXCLUDING ALREADY ADDED ITEMS (No duplicates!)
  const filteredOptions = useMemo(() => {
    const existingIds = new Set(items.map((i) => Number(i.bInventoryId)));
    const unselected = searchOptions.filter((opt) => !existingIds.has(Number(opt.id)));

    if (!searchQuery.trim()) return unselected;
    const q = searchQuery.toLowerCase();
    return unselected.filter(
      (opt) => opt.code.toLowerCase().includes(q) || opt.name.toLowerCase().includes(q)
    );
  }, [searchOptions, searchQuery, items]);

  const handleSelectProduct = (opt) => {
    const existingIndex = items.findIndex((i) => Number(i.bInventoryId) === Number(opt.id));
    if (existingIndex >= 0) {
      message.warning(`${opt.name} đã có trong danh sách kiểm kho.`);
      setShowDropdown(false);
      setSearchQuery('');
      return;
    }

    const newItem = {
      rowId: `${opt.id}-${Date.now()}`,
      bInventoryId: opt.id,
      code: opt.code,
      name: opt.name,
      unitName: opt.unitName,
      systemStock: opt.systemStock,
      actualQuantity: opt.systemStock,
      costPrice: opt.costPrice
    };
    setItems((prev) => [...prev, newItem]);
    addRecentCheck(opt.name, opt.systemStock);

    setSearchQuery('');
    setShowDropdown(false);
  };

  const addRecentCheck = (itemName, actualQty) => {
    setRecentChecks((prev) => [
      { id: `${Date.now()}-${Math.random()}`, name: itemName, qty: actualQty },
      ...prev.slice(0, 9)
    ]);
  };

  const handleActualQtyChange = (index, val) => {
    const qty = val !== '' && val != null ? Math.max(0, Number(val) || 0) : 0;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      actualQuantity: qty
    };
    setItems(updated);
    addRecentCheck(updated[index].name, qty);
  };

  const totalActualQuantity = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.actualQuantity) || 0), 0);
  }, [items]);

  const handleSubmit = async (isDraft = false) => {
    if (items.length === 0) {
      message.error('Vui lòng chọn ít nhất 1 sản phẩm để kiểm kho.');
      return;
    }

    setLoading(true);
    try {
      const dto = {
        branchId: Number(branchId),
        businessDate: openTimeISO || new Date().toISOString(),
        createdByAccountId: Number(user?.id || user?.accountId || 1),
        note: formData.note || '',
        details: items.map((i) => ({
          bInventoryId: Number(i.bInventoryId),
          actualQuantity: Number(i.actualQuantity),
          unitPrice: i.costPrice && Number(i.costPrice) >= 1 ? Math.floor(Number(i.costPrice)) : null,
          note: ''
        }))
      };
      await createCheckDocument(dto);
      message.success(`${isDraft ? 'Lưu tạm' : 'Hoàn thành'} Kiểm kho thành công!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg =
        err.response?.data?.message || err.response?.data?.title || err.message || 'Lỗi khi tạo phiếu kiểm kho.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 12
      }}
    >
      {/* HEADER BAR - ORANGE GRADIENT */}
      <div
        style={{
          height: 48,
          background: 'linear-gradient(135deg, #e8442a 0%, #d9381e 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxShadow: '0 2px 8px rgba(232, 68, 42, 0.25)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#ffffff', letterSpacing: '0.3px' }}>
            Kiểm kho
          </span>

          {/* SEARCH PRODUCT DROPDOWN CONTAINER */}
          <div style={{ position: 'relative', width: 420 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 16,
                padding: '3px 12px',
                border: '1px solid rgba(255,255,255,0.4)'
              }}
            >
              <SearchOutlined style={{ color: '#e8442a', marginRight: 6 }} />
              <input
                type="text"
                placeholder="Tìm theo mã hoặc tên hàng hóa..."
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: 11,
                  background: 'transparent',
                  color: '#0f172a'
                }}
              />
            </div>

            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 32,
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  maxHeight: 240,
                  overflowY: 'auto',
                  zIndex: 1001
                }}
              >
                {filteredOptions.length === 0 ? (
                  <div style={{ padding: 10, color: '#94a3b8', textAlign: 'center' }}>
                    {searchQuery.trim() ? 'Không tìm thấy hàng hóa' : 'Tất cả hàng hóa hợp lệ đã được thêm vào danh sách'}
                  </div>
                ) : (
                  filteredOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectProduct(opt)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fff7ed')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{opt.name}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>
                          {opt.code} {opt.unitName ? `(${opt.unitName})` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: '#e8442a', fontWeight: 600 }}>
                        Tồn: {opt.systemStock}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            title="Toàn màn hình"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.85)',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            <FullscreenOutlined />
          </button>
          <button
            type="button"
            title="In phiếu"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.85)',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            <PrinterOutlined />
          </button>
          <button
            type="button"
            title="Đóng"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              borderRadius: 6,
              padding: '5px 8px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 15,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CloseOutlined />
          </button>
        </div>
      </div>

      {/* BODY CONTENT - HTML TABLE */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: TABLE AREA */}
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 8px', width: 30, textAlign: 'center' }}></th>
                  <th style={{ padding: '8px 8px', width: 40, textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', width: 140 }}>MÃ HÀNG HÓA</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>TÊN HÀNG</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>TỒN KHO</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: 130 }}>THỰC TẾ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>SL LỆCH</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 130 }}>GIÁ TRỊ LỆCH</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                      Chưa có sản phẩm nào được chọn để kiểm kho.
                    </td>
                  </tr>
                ) : (
                  items.map((record, index) => {
                    const diff = (record.actualQuantity || 0) - (record.systemStock || 0);
                    const diffColor = diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#64748b';
                    const diffVal = diff * (record.costPrice || 0);
                    const diffValColor = diffVal > 0 ? '#059669' : diffVal < 0 ? '#dc2626' : '#64748b';

                    return (
                      <tr key={record.rowId || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...items];
                              updated.splice(index, 1);
                              setItems(updated);
                            }}
                            title="Xóa dòng"
                            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                          >
                            <DeleteOutlined style={{ fontSize: 14 }} />
                          </button>
                        </td>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                        <td style={{ fontWeight: 600, color: '#334155', padding: '6px 10px' }}>{record.code}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{record.name}</span>
                          {record.unitName && (
                            <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                              ({record.unitName})
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 10px', color: '#64748b' }}>
                          {(record.systemStock != null ? record.systemStock : 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                          <input
                            type="number"
                            min={0}
                            value={record.actualQuantity ?? 0}
                            onChange={(e) => handleActualQtyChange(index, e.target.value)}
                            style={{
                              width: 80,
                              textAlign: 'center',
                              borderRadius: 16,
                              border: '1px solid #cbd5e1',
                              padding: '3px 6px',
                              fontSize: 11,
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 700, color: diffColor }}>
                          {diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 600, color: diffValColor }}>
                          {diffVal > 0 ? '+' : ''}{diffVal.toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: SUMMARY SIDEBAR */}
        <div
          style={{
            width: 340,
            background: '#ffffff',
            borderLeft: '1px solid #cbd5e1',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {/* KIOTVIET TIME & CREATOR HEADER */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#334155',
                fontSize: 11
              }}
            >
              <div
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: 4,
                  background: showDatePicker ? '#f1f5f9' : 'transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {creatorName}-{openTimeFormatted || dayjs().format('DD/MM/YYYY HH:mm')}
                </span>
                <RightOutlined style={{ fontSize: 10, color: '#64748b' }} />
              </div>

              <span
                style={{
                  background: '#fff7ed',
                  color: '#ea580c',
                  border: '1px solid #ffedd5',
                  borderRadius: 12,
                  padding: '1px 8px',
                  fontSize: 10,
                  fontWeight: 600
                }}
              >
                Phiếu tạm
              </span>

              {/* DATE-TIME PICKER POPOVER */}
              {showDatePicker && (
                <KiotDateTimePicker
                  value={selectedDateTime}
                  onChange={handleDateChange}
                  onClose={() => setShowDatePicker(false)}
                />
              )}
            </div>

            <div>
              <div style={{ marginBottom: 4, color: '#64748b', fontSize: 11 }}>Mã kiểm kho</div>
              <input
                type="text"
                value={formData.docCode}
                onChange={(e) => setFormData({ ...formData, docCode: e.target.value })}
                placeholder="Mã phiếu tự động"
                style={{
                  width: '100%',
                  borderRadius: 6,
                  padding: '6px 10px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: 11
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
              <span style={{ color: '#475569', fontSize: 11 }}>Tổng Sl. thực tế</span>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                {totalActualQuantity.toLocaleString('vi-VN')}
              </span>
            </div>

            <div>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                placeholder="Ghi chú"
                style={{
                  width: '100%',
                  borderRadius: 6,
                  padding: '8px 10px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: 11,
                  resize: 'none'
                }}
              />
            </div>

            {/* KIỂM GẦN ĐÂY SECTION */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#334155', fontSize: 11, marginBottom: 8 }}>
                Kiểm gần đây
              </div>

              {recentChecks.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>
                  Chưa có thao tác kiểm nào.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                  {recentChecks.map((rc) => (
                    <div
                      key={rc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#475569',
                        fontSize: 11
                      }}
                    >
                      <EditOutlined style={{ color: '#ea580c', fontSize: 12 }} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rc.name}
                      </span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>- {rc.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid #e8442a',
                color: '#e8442a',
                fontWeight: 600,
                borderRadius: 6,
                padding: '8px 0',
                cursor: 'pointer'
              }}
            >
              Lưu tạm
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              style={{
                flex: 1,
                background: '#e8442a',
                border: '1px solid #e8442a',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: 6,
                padding: '8px 0',
                cursor: 'pointer'
              }}
            >
              HOÀN THÀNH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckDocumentModal;
