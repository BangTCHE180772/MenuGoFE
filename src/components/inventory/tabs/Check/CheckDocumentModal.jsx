import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  createCheckPending,
  createCheckCompleted,
  updateCheckPending,
  completeCheckDocument,
  deleteCheckPendingDocument,
  getCheckById
} from '../../../../api/documentApi';
import KiotDateTimePicker from '../Import/KiotDateTimePicker';
import { useAuth } from '../../../../context/AuthContext';
import { extractErrorMessage } from '../../utils/errorHelper';

const showToast = (text, type = 'success') => {
  const toast = document.createElement('div');
  toast.innerText = text;
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: ${type === 'error' ? '#ef4444' : '#10b981'};
    color: #ffffff;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    z-index: 99999;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
};

const CheckDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = [],
  editDocumentId = null
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

  // Fetch BInventories by branch, date & searchQuery as user types (Mode 2: Exclude Processed)
  const fetchBInventories = useCallback((bId, date, query = '') => {
    if (!bId) return;
    getProductsByDate(bId, date, query, null, 2)
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
      if (editDocumentId) {
        setLoading(true);
        Promise.all([
          getCheckById(editDocumentId),
          branchId ? getProductsByDate(branchId, new Date().toISOString(), '', null, 2) : Promise.resolve([])
        ])
          .then(([res, bInvRes]) => {
            if (res) {
              const dt = res.businessDate ? dayjs(res.businessDate) : dayjs();
              setSelectedDateTime(dt);
              setOpenTimeFormatted(dt.format('DD/MM/YYYY HH:mm'));
              setOpenTimeISO(dt.toISOString());
              setFormData({
                docCode: res.code || '',
                note: res.note || ''
              });

              const fetchedInventories = Array.isArray(bInvRes?.data) ? bInvRes.data : (Array.isArray(bInvRes) ? bInvRes : []);
              if (fetchedInventories.length > 0) {
                setBInventoryList(fetchedInventories);
              }

              const inventoryOptions = fetchedInventories.length > 0 ? fetchedInventories : (products || []);
              const mapDetails = (res.details || []).map((d) => {
                const matchP = (inventoryOptions || []).find((b) => Number(b.id ?? b.bInventoryId) === Number(d.bInventoryId))
                  || (products || []).find((p) => Number(p.id ?? p.bInventoryId) === Number(d.bInventoryId));
                const conversions = matchP?.unitConversions || d.unitConversions || [];
                const selectedUc = conversions.find((uc) => Number(uc.id) === Number(d.unitConversionId))
                  || conversions.find((uc) => (uc.unitName || uc.name) === (d.currentUnitName || d.unitName))
                  || (conversions.length > 0 ? conversions[0] : null);
                const conversionPoint = selectedUc?.conversionPoint > 0 ? selectedUc.conversionPoint : (d.conversionRate > 0 ? d.conversionRate : 1);
                const costPriceVal = d.snapshotAvgCost || d.unitPrice || matchP?.runningAverageCost || matchP?.avg || matchP?.purchasePrice || 0;

                return {
                  rowId: `${d.bInventoryId}-${Date.now()}-${Math.random()}`,
                  bInventoryId: d.bInventoryId,
                  code: d.snapshotProductCode || d.currentProductCode || d.code || matchP?.code || `SP${d.bInventoryId}`,
                  name: d.snapshotProductName || d.currentProductName || d.productName || d.bInventoryName || matchP?.name || 'Sản phẩm',
                  baseStock: d.currentStockQuantity ?? d.systemQuantity ?? d.currentStock ?? matchP?.runningQuantity ?? matchP?.quantity ?? 0,
                  systemStock: d.currentStockQuantity ?? d.systemQuantity ?? d.currentStock ?? matchP?.runningQuantity ?? matchP?.quantity ?? 0,
                  baseAvgCost: costPriceVal,
                  costPrice: costPriceVal,
                  unitConversionId: selectedUc ? Number(selectedUc.id) : (d.unitConversionId ? Number(d.unitConversionId) : null),
                  unitName: selectedUc ? (selectedUc.unitName || selectedUc.name) : (d.currentUnitName || d.unitName || matchP?.unitName || 'Đơn vị'),
                  unitConversions: conversions,
                  conversionPoint: conversionPoint,
                  actualQuantity: d.quantity ?? (conversionPoint > 0 ? (d.actualQuantity / conversionPoint) : d.actualQuantity) ?? 0,
                  note: d.note || ''
                };
              });
              setItems(mapDetails);
            }
          })
          .catch((err) => {
            console.error('Lỗi khi tải chi tiết kiểm kho:', err);
            showToast('Không thể tải chi tiết phiếu kiểm kho', 'error');
          })
          .finally(() => setLoading(false));
      } else {
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
    }
  }, [open, editDocumentId, branchId, fetchBInventories]);

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
  };

  const searchOptions = useMemo(() => {
    const rawList = bInventoryList.length > 0 ? bInventoryList : products;
    return rawList
      .filter((b) => {
        if (!b || (b.id == null && b.bInventoryId == null && b.productId == null)) return false;
        const rawType = b.type ?? b.productType ?? b.product?.type;
        const typeStr = String(rawType ?? '').toLowerCase();
        if (typeStr === 'processed' || rawType === 1) return false;
        return true;
      })
      .map((b) => {
        const conversions = b.unitConversions || b.product?.unitConversions || [];
        const baseUnitName = b.baseUnit?.unitName || b.unitName || conversions[0]?.unitName || 'Đơn vị';
        const stockVal = b.runningQuantity ?? b.quantity ?? b.stockQuantity ?? 0;
        const avgVal = (b.runningAverageCost > 0 ? b.runningAverageCost : (b.avg > 0 ? b.avg : (b.purchasePrice > 0 ? b.purchasePrice : (b.sellPrice || 0))));
        return {
          id: b.id ?? b.bInventoryId ?? b.productId,
          code: b.code || b.skuCode || `SP${b.id ?? b.productId}`,
          name: b.name || 'Sản phẩm',
          baseStock: stockVal,
          baseAvgCost: avgVal,
          systemStock: stockVal,
          costPrice: avgVal,
          unitName: baseUnitName,
          unitConversions: conversions
        };
      });
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

    const conversions = opt.unitConversions || [];
    const defaultUc = conversions.length > 0 ? conversions[0] : null;
    const conversionPoint = defaultUc?.conversionPoint > 0 ? defaultUc.conversionPoint : 1;
    const convertedStock = (opt.baseStock || 0) / conversionPoint;

    const newItem = {
      rowId: `${opt.id}-${Date.now()}`,
      bInventoryId: opt.id,
      code: opt.code,
      name: opt.name,
      baseStock: opt.baseStock,
      baseAvgCost: opt.baseAvgCost,
      unitConversionId: defaultUc ? defaultUc.id : null,
      unitName: defaultUc ? defaultUc.unitName : opt.unitName,
      unitConversions: conversions,
      conversionPoint: conversionPoint,
      actualQuantity: convertedStock
    };
    setItems((prev) => [...prev, newItem]);
    addRecentCheck(opt.name, convertedStock);

    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleUnitChange = (index, ucId) => {
    const updated = [...items];
    const item = updated[index];
    const conversions = item.unitConversions || [];
    const selectedUc = conversions.find((c) => Number(c.id) === Number(ucId));
    const conversionPoint = selectedUc?.conversionPoint > 0 ? selectedUc.conversionPoint : 1;
    const unitName = selectedUc ? selectedUc.unitName : item.unitName;

    const convertedStock = (item.baseStock || 0) / conversionPoint;

    updated[index] = {
      ...item,
      unitConversionId: selectedUc ? Number(selectedUc.id) : null,
      unitName: unitName,
      conversionPoint: conversionPoint,
      actualQuantity: convertedStock
    };
    setItems(updated);
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

  const totalDiffValue = useMemo(() => {
    return items.reduce((sum, i) => {
      const conversionPoint = i.conversionPoint || 1;
      const convertedSystemStock = (i.baseStock ?? i.systemStock ?? 0) / conversionPoint;
      const convertedUnitPrice = conversionPoint * (i.baseAvgCost ?? i.costPrice ?? 0);
      const diffQty = (i.actualQuantity || 0) - convertedSystemStock;
      return sum + diffQty * convertedUnitPrice;
    }, 0);
  }, [items]);

  const handleSubmit = async (isDraft = false) => {
    if (items.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 sản phẩm để kiểm kho.', 'error');
      return;
    }

    setLoading(true);
    try {
      const dto = {
        branchId: Number(branchId),
        orderDate: openTimeISO || new Date().toISOString(),
        note: formData.note || '',
        details: items.map((i) => ({
          bInventoryId: Number(i.bInventoryId),
          unitConversionId: i.unitConversionId ? Number(i.unitConversionId) : null,
          actualQuantity: Number(i.actualQuantity),
          note: ''
        }))
      };

      if (editDocumentId) {
        if (isDraft) {
          await updateCheckPending(editDocumentId, dto);
          showToast('Cập nhật phiếu kiểm kho nháp thành công!');
        } else {
          await updateCheckPending(editDocumentId, dto);
          await completeCheckDocument(editDocumentId);
          showToast('Hoàn thành phiếu kiểm kho thành công!');
        }
      } else {
        if (isDraft) {
          await createCheckPending(dto);
          showToast('Lưu tạm phiếu kiểm kho thành công!');
        } else {
          await createCheckCompleted(dto);
          showToast('Tạo và Hoàn thành phiếu kiểm kho thành công!');
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = extractErrorMessage(err, 'Lỗi khi lưu phiếu kiểm kho.');
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPending = async () => {
    if (!editDocumentId) return;
    if (!window.confirm('Bạn có chắc chắn muốn hủy phiếu kiểm kho nháp này?')) return;
    setLoading(true);
    try {
      await deleteCheckPendingDocument(editDocumentId, 'Hủy phiếu nháp từ giao diện');
      showToast('Đã chuyển phiếu kiểm kho sang trạng thái Canceled!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      showToast(extractErrorMessage(err, 'Không thể hủy phiếu nháp.'), 'error');
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
            {editDocumentId ? `Chỉnh sửa phiếu kiểm kho (${formData.docCode || ''})` : 'Tạo phiếu kiểm kho'}
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
                        Tồn: {Number(opt.systemStock ?? opt.baseStock ?? 0).toLocaleString('vi-VN')}
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
                  <th style={{ padding: '8px 8px', width: 35, textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '8px 8px', textAlign: 'left', width: 110 }}>MÃ HÀNG HÓA</th>
                  <th style={{ padding: '8px 8px', textAlign: 'left' }}>TÊN HÀNG</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', width: 110 }}>ĐVT</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', width: 90 }}>TỒN KHO</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', width: 110 }}>THỰC TẾ</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', width: 90 }}>SL LỆCH</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', width: 110 }}>GIÁ TRỊ LỆCH</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                      Chưa có sản phẩm nào được chọn để kiểm kho.
                    </td>
                  </tr>
                ) : (
                  items.map((record, index) => {
                    const conversionPoint = record.conversionPoint || 1;
                    const convertedSystemStock = (record.baseStock ?? record.systemStock ?? 0) / conversionPoint;
                    const convertedUnitPrice = conversionPoint * (record.baseAvgCost ?? record.costPrice ?? 0);
                    const diff = (record.actualQuantity || 0) - convertedSystemStock;
                    const diffColor = diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#64748b';
                    const diffVal = diff * convertedUnitPrice;
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
                        <td style={{ fontWeight: 600, color: '#334155', padding: '6px 8px' }}>{record.code}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{record.name}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                          {record.unitConversions && record.unitConversions.length > 0 ? (
                            <select
                              value={record.unitConversionId || ''}
                              onChange={(e) => handleUnitChange(index, e.target.value)}
                              style={{
                                height: 26,
                                padding: '0 4px',
                                fontSize: 11,
                                borderRadius: 4,
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                outline: 'none'
                              }}
                            >
                              {record.unitConversions.map((uc) => (
                                <option key={uc.id} value={uc.id}>
                                  {uc.unitName || uc.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ color: '#475569' }}>{record.unitName || 'Đơn vị'}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', color: '#64748b' }}>
                          {convertedSystemStock.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                          <input
                            type="number"
                            min={0}
                            max={10000000000}
                            step="any"
                            value={record.actualQuantity ?? 0}
                            onChange={(e) => handleActualQtyChange(index, e.target.value)}
                            style={{
                              width: 75,
                              textAlign: 'center',
                              borderRadius: 16,
                              border: '1px solid #cbd5e1',
                              padding: '3px 6px',
                              fontSize: 11,
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700, color: diffColor }}>
                          {diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: diffValColor }}>
                          {diffVal > 0 ? '+' : ''}{Math.round(diffVal).toLocaleString('vi-VN')} đ
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569', fontSize: 11, fontWeight: 600 }}>Tổng Sl. thực tế:</span>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                {items.reduce((sum, i) => sum + (Number(i.actualQuantity) || 0), 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#334155', fontSize: 11.5, fontWeight: 700 }}>Chênh lệch giá trị:</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: totalDiffValue > 0 ? '#059669' : totalDiffValue < 0 ? '#dc2626' : '#64748b' }}>
                {totalDiffValue > 0 ? '+' : ''}{Math.round(totalDiffValue).toLocaleString('vi-VN')} đ
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

          {/* ACTION BUTTONS AT SIDEBAR FOOTER ([LƯU TẠM] & [HOÀN THÀNH]) */}
          <div style={{ padding: 16, borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', gap: 10 }}>
            <button
              type="button"
              disabled={loading || items.length === 0}
              onClick={() => handleSubmit(true)}
              style={{
                flex: 1,
                height: 38,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                border: '1px solid #fde68a',
                background: loading || items.length === 0 ? '#fef3c7' : '#f59e0b',
                color: '#ffffff',
                cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Đang lưu...' : 'Lưu tạm'}
            </button>

            <button
              type="button"
              disabled={loading || items.length === 0}
              onClick={() => handleSubmit(false)}
              style={{
                flex: 1,
                height: 38,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                background: loading || items.length === 0 ? '#cbd5e1' : '#e8442a',
                color: '#ffffff',
                cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(232, 68, 42, 0.25)'
              }}
            >
              {loading ? 'Đang xử lý...' : 'Hoàn thành'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckDocumentModal;
