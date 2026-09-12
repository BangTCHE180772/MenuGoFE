import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  FullscreenOutlined,
  PrinterOutlined,
  RightOutlined,
  EditOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { getProductsByDate, getPreviousLedgerSnapshots } from '../../../../api/binventoryApi';
import { getBatches } from '../../../../api/batchApi';
import {
  createExportDeletePending,
  createExportDeleteCompleted,
  updateExportDeletePending,
  completeExportDeleteDocument,
  deleteExportDeletePendingDocument,
  getExportDeleteById
} from '../../../../api/documentApi';
import KiotDateTimePicker from '../Import/KiotDateTimePicker';
import { useAuth } from '../../../../context/AuthContext';
import { extractErrorMessage } from '../../utils/errorHelper';
import { removeVietnameseTones } from '../../../../utils/stringHelper';

const showToast = (text, type = 'success') => {
  const toast = document.createElement('div');
  toast.innerText = text;
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'info' ? '#3b82f6' : '#10b981'};
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

const DisposalDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = [],
  editDocumentId = null,
  initialData = null
}) => {
  const auth = useAuth ? useAuth() : {};
  const user = auth?.user;
  const creatorName = user?.name || user?.email || 'Mno';

  const [loading, setLoading] = useState(false);
  const [loadingExpiredInModal, setLoadingExpiredInModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(dayjs());
  const [openTimeFormatted, setOpenTimeFormatted] = useState('');
  const [openTimeISO, setOpenTimeISO] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [bInventoryList, setBInventoryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [formData, setFormData] = useState({
    docCode: '',
    note: ''
  });
  const [items, setItems] = useState([]);

  // Fetch BInventories by branch, date & searchQuery as user types (Mode 2: Exclude Processed)
  const fetchBInventories = useCallback((bId, date, query = '') => {
    if (!bId) return;
    getProductsByDate(bId, date, query, null, 2)
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (data.length > 0 || !query) {
          setBInventoryList((prev) => {
            if (!query) return data;
            const prevMap = new Map(prev.map((item) => [item.id ?? item.bInventoryId, item]));
            data.forEach((item) => {
              prevMap.set(item.id ?? item.bInventoryId, item);
            });
            return Array.from(prevMap.values());
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load BInventories by date:', err);
      });
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut F1 to focus search, ESC to close dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowDropdown(true);
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      if (editDocumentId) {
        setLoading(true);
        Promise.all([
          getExportDeleteById(editDocumentId),
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
                const baseAvgCostVal = d.snapshotAvgCost > 0
                  ? d.snapshotAvgCost
                  : (d.unitPrice > 0 && conversionPoint > 0 ? d.unitPrice / conversionPoint : (matchP?.runningAverageCost || matchP?.avg || matchP?.purchasePrice || 0));

                return {
                  rowId: `${d.bInventoryId}-${Date.now()}-${Math.random()}`,
                  bInventoryId: d.bInventoryId,
                  code: d.snapshotProductCode || d.currentProductCode || d.code || matchP?.code || `SP${d.bInventoryId}`,
                  name: d.snapshotProductName || d.currentProductName || d.productName || d.bInventoryName || matchP?.name || 'Sản phẩm',
                  baseStock: d.currentStockQuantity ?? d.systemQuantity ?? d.currentStock ?? matchP?.runningQuantity ?? matchP?.quantity ?? 0,
                  stock: d.currentStockQuantity ?? d.systemQuantity ?? d.currentStock ?? matchP?.runningQuantity ?? matchP?.quantity ?? 0,
                  baseAvgCost: baseAvgCostVal,
                  costPrice: baseAvgCostVal,
                  unitConversionId: selectedUc ? Number(selectedUc.id) : (d.unitConversionId ? Number(d.unitConversionId) : null),
                  unitName: selectedUc ? (selectedUc.unitName || selectedUc.name) : (d.currentUnitName || d.unitName || matchP?.unitName || 'Đơn vị'),
                  unitConversions: conversions,
                  conversionPoint: conversionPoint,
                  quantity: d.quantity || 1,
                  note: d.note || '',
                  editingNote: false
                };
              });
              setItems(mapDetails);
            }
          })
          .catch((err) => {
            console.error('Lỗi khi tải chi tiết xuất hủy:', err);
            showToast('Không thể tải chi tiết phiếu xuất hủy', 'error');
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
          note: initialData?.note || ''
        });
        setItems(initialData?.items || []);

        if (branchId) {
          fetchBInventories(branchId, now.toISOString(), '');
        }
      }
    }
  }, [open, editDocumentId, branchId, fetchBInventories, initialData]);

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

  // Tự động tìm và chọn các nguyên liệu đã hết hạn ngay trong modal
  const handleSelectAllExpiredInModal = async () => {
    if (!branchId) return;
    setLoadingExpiredInModal(true);
    try {
      const batchesRes = await getBatches({
        branchId: branchId,
        expiryStatus: 'expired',
        pageSize: 1000
      });

      const batches = Array.isArray(batchesRes?.items) ? batchesRes.items : [];
      const expiredBatches = batches.filter(
        (b) => Number(b.quantityRemaining) > 0 && b.status !== 2 && b.status !== 'Depleted'
      );

      if (expiredBatches.length === 0) {
        showToast('Không tìm thấy nguyên liệu nào đã hết hạn còn tồn kho trong chi nhánh.', 'info');
        return;
      }

      const existingIds = new Set(items.map((i) => Number(i.bInventoryId)));
      const rawList = bInventoryList.length > 0 ? bInventoryList : products;

      const groupedByInv = {};
      expiredBatches.forEach((batch) => {
        const invId = Number(batch.bInventoryId);
        if (!groupedByInv[invId]) groupedByInv[invId] = [];
        groupedByInv[invId].push(batch);
      });

      const newItemsToAdd = [];
      Object.entries(groupedByInv).forEach(([invIdStr, bList]) => {
        const invId = Number(invIdStr);
        if (existingIds.has(invId)) return;

        const matchP = (rawList || []).find((b) => Number(b.id ?? b.bInventoryId) === invId);
        const totalExpiredQty = bList.reduce((sum, b) => sum + Number(b.quantityRemaining || 0), 0);
        const baseStockVal = Number(matchP?.runningQuantity ?? matchP?.quantity ?? matchP?.stockQuantity ?? 0);

        // Nếu tồn kho sản phẩm đã hết (<= 0) hoặc lượng hết hạn <= 0 thì đã xuất hủy hết
        if (baseStockVal <= 0 || totalExpiredQty <= 0) return;

        const conversions = matchP?.unitConversions || matchP?.product?.unitConversions || [];
        const defaultUc = conversions.length > 0 ? conversions[0] : null;
        const conversionPoint = defaultUc?.conversionPoint > 0 ? defaultUc.conversionPoint : 1;
        const avgVal = matchP?.runningAverageCost > 0 ? matchP.runningAverageCost : (matchP?.avg > 0 ? matchP.avg : (bList[0].unitCost || 0));

        const batchDesc = bList.map((b) => {
          const exp = b.expiryDate ? dayjs(b.expiryDate).format('DD/MM/YYYY') : '---';
          return `${b.batchCode} (${b.quantityRemaining} ${b.unitName}, HSD: ${exp})`;
        }).join('; ');

        newItemsToAdd.push({
          rowId: `expired-${invId}-${Date.now()}-${Math.random()}`,
          bInventoryId: invId,
          code: matchP?.code || bList[0].productCode || `SP${invId}`,
          name: matchP?.name || bList[0].productName || 'Nguyên liệu',
          baseStock: baseStockVal,
          stock: baseStockVal,
          baseAvgCost: avgVal,
          costPrice: avgVal,
          unitConversionId: defaultUc ? defaultUc.id : null,
          unitName: defaultUc ? (defaultUc.unitName || defaultUc.name) : (matchP?.unitName || bList[0].unitName || 'Đơn vị'),
          unitConversions: conversions,
          conversionPoint: conversionPoint,
          quantity: Math.min(totalExpiredQty, baseStockVal),
          note: `Lô hết hạn: ${batchDesc}`,
          isExpiredAutoSelected: true,
          editingNote: false
        });
      });

      if (newItemsToAdd.length === 0) {
        showToast('Tất cả các nguyên liệu hết hạn đã có trong danh sách xuất hủy.', 'warning');
        return;
      }

      setItems((prev) => [...prev, ...newItemsToAdd]);
      if (!formData.note) {
        setFormData((prev) => ({ ...prev, note: `Xuất hủy nguyên liệu hết hạn sử dụng (${expiredBatches.length} lô hết hạn)` }));
      }
      showToast(`Đã thêm ${newItemsToAdd.length} mặt hàng hết hạn vào danh sách xuất hủy.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi lấy hàng hết hạn.', 'error');
    } finally {
      setLoadingExpiredInModal(false);
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
        const conversions = b.unitConversions || b.conversions || b.product?.unitConversions || [];
        const baseUnitName = b.baseUnit?.unitName || b.unitName || conversions[0]?.unitName || 'Đơn vị';
        const stockVal = b.runningQuantity ?? b.quantity ?? b.stockQuantity ?? b.stock ?? 0;
        const avgVal = (b.runningAverageCost > 0 ? b.runningAverageCost : (b.avg > 0 ? b.avg : (b.purchasePrice > 0 ? b.purchasePrice : (b.sellPrice || 0))));
        return {
          id: b.id ?? b.bInventoryId ?? b.productId,
          code: b.code || b.skuCode || b.productCode || `SP${b.id ?? b.productId}`,
          name: b.name || b.productName || 'Sản phẩm',
          baseStock: stockVal,
          baseAvgCost: avgVal,
          stock: stockVal,
          costPrice: avgVal,
          unitName: baseUnitName,
          unitConversions: conversions
        };
      });
  }, [bInventoryList, products]);

  // Filter options strictly following search query AND EXCLUDING ALREADY ADDED ITEMS (No duplicates!)
  const filteredOptions = useMemo(() => {
    const existingIds = new Set(items.map((i) => Number(i.bInventoryId)));
    // Exclude items already present in the table below
    const unselected = searchOptions.filter((opt) => !existingIds.has(Number(opt.id)));

    if (!searchQuery.trim()) return unselected;
    const qRaw = searchQuery.toLowerCase().trim();
    const qNorm = removeVietnameseTones(searchQuery).trim();
    return unselected.filter((opt) => {
      const nameRaw = (opt.name || '').toLowerCase();
      const nameNorm = removeVietnameseTones(opt.name);
      const codeRaw = (opt.code || '').toLowerCase();
      return (
        nameRaw.includes(qRaw) ||
        nameNorm.includes(qNorm) ||
        codeRaw.includes(qRaw)
      );
    });
  }, [searchOptions, searchQuery, items]);

  const handleSelectProduct = (opt) => {
    // Double check duplicate prevention
    const existingIndex = items.findIndex((i) => Number(i.bInventoryId) === Number(opt.id));
    if (existingIndex >= 0) {
      showToast(`${opt.name} đã có trong danh sách xuất hủy.`, 'warning');
      setShowDropdown(false);
      setSearchQuery('');
      return;
    }

    const conversions = opt.unitConversions || [];
    const defaultUc = conversions.length > 0 ? conversions[0] : null;
    const conversionPoint = defaultUc?.conversionPoint > 0 ? defaultUc.conversionPoint : 1;

    setItems((prev) => [
      ...prev,
      {
        rowId: `${opt.id}-${Date.now()}`,
        bInventoryId: opt.id,
        code: opt.code,
        name: opt.name,
        baseStock: opt.baseStock,
        baseAvgCost: opt.baseAvgCost,
        stock: opt.stock,
        costPrice: opt.costPrice,
        unitConversionId: defaultUc ? defaultUc.id : null,
        unitName: defaultUc ? defaultUc.unitName : opt.unitName,
        unitConversions: conversions,
        conversionPoint: conversionPoint,
        quantity: 1,
        note: '',
        editingNote: false
      }
    ]);
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

    updated[index] = {
      ...item,
      unitConversionId: selectedUc ? Number(selectedUc.id) : null,
      unitName: unitName,
      conversionPoint: conversionPoint
    };
    setItems(updated);
  };

  const handleQtyChange = (index, val) => {
    const qty = val !== '' && val != null ? Math.max(0.001, Number(val) || 1) : 1;
    const updated = [...items];
    const item = updated[index];
    updated[index] = { ...item, quantity: qty };
    setItems(updated);

    const conversionPoint = item.conversionPoint || 1;
    const convertedStock = (item.baseStock ?? item.stock ?? 0) / conversionPoint;
    if (qty > convertedStock) {
      showToast(
        `Cảnh báo: Số lượng hủy (${qty}) vượt quá tồn kho hiện tại (${convertedStock.toLocaleString('vi-VN')}) tại kho.`,
        'warning'
      );
    }
  };

  const totalDisposalAmount = useMemo(() => {
    return items.reduce((sum, i) => {
      const conversionPoint = i.conversionPoint || 1;
      const convertedCostPrice = conversionPoint * (i.baseAvgCost ?? i.costPrice ?? 0);
      return sum + (Number(i.quantity) || 0) * convertedCostPrice;
    }, 0);
  }, [items]);

  const handleSubmit = async (isDraft = false) => {
    if (items.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 sản phẩm để xuất hủy.', 'error');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.quantity || item.quantity <= 0) {
        showToast(`Số lượng sản phẩm ${item.name} không hợp lệ.`, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const dto = {
        branchId: Number(branchId),
        orderDate: openTimeISO || new Date().toISOString(),
        note: formData.note || 'Xuất hủy hàng hóa',
        details: items.map((i) => ({
          bInventoryId: Number(i.bInventoryId),
          unitConversionId: i.unitConversionId ? Number(i.unitConversionId) : null,
          quantity: Number(i.quantity),
          note: i.note || ''
        }))
      };

      if (editDocumentId) {
        if (isDraft) {
          await updateExportDeletePending(editDocumentId, dto);
          showToast('Cập nhật phiếu xuất hủy nháp thành công!');
        } else {
          await updateExportDeletePending(editDocumentId, dto);
          await completeExportDeleteDocument(editDocumentId);
          showToast('Hoàn thành phiếu xuất hủy thành công!');
        }
      } else {
        if (isDraft) {
          await createExportDeletePending(dto);
          showToast('Lưu tạm phiếu xuất hủy thành công!');
        } else {
          await createExportDeleteCompleted(dto);
          showToast('Tạo và Hoàn thành phiếu xuất hủy thành công!');
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = extractErrorMessage(err, 'Lỗi khi lưu phiếu xuất hủy.');
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPending = async () => {
    if (!editDocumentId) return;
    if (!window.confirm('Bạn có chắc chắn muốn hủy phiếu xuất hủy nháp này?')) return;
    setLoading(true);
    try {
      await deleteExportDeletePendingDocument(editDocumentId, 'Hủy phiếu nháp từ giao diện');
      showToast('Đã chuyển phiếu xuất hủy sang trạng thái Canceled!');
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
            {editDocumentId ? `Chỉnh sửa phiếu xuất hủy (${formData.docCode || ''})` : 'Tạo phiếu xuất hủy'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <button
            type="button"
            title="Toàn màn hình"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: 'none',
              borderRadius: 6,
              padding: '5px 8px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FullscreenOutlined />
          </button>
          <button
            type="button"
            title="In phiếu"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: 'none',
              borderRadius: 6,
              padding: '5px 8px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center'
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

      {/* BODY CONTENT - HTML TABLE WITHOUT ANTD COMPONENTS */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: TABLE AREA & SEARCH */}
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* SEARCH BAR & EXPIRED BUTTON ROW */}
          <div style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div ref={searchContainerRef} style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm sản phẩm theo mã hoặc tên (F1)..."
                  value={searchQuery}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  style={{
                    width: '100%',
                    height: 36,
                    paddingLeft: 34,
                    paddingRight: searchQuery ? 30 : 12,
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    background: '#ffffff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                />
                {searchQuery && (
                  <CloseOutlined
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    title="Xóa tìm kiếm"
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  />
                )}
              </div>

              {/* LIVE SEARCH DROPDOWN */}
              {showDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    background: '#ffffff',
                    maxHeight: 240,
                    overflowY: 'auto',
                    marginTop: 4,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    zIndex: 100
                  }}
                >
                  {filteredOptions.length === 0 ? (
                    <div style={{ padding: 12, color: '#94a3b8', textAlign: 'center', fontSize: 12 }}>
                      {searchQuery.trim() ? 'Không tìm thấy hàng hóa' : 'Tất cả hàng hóa hợp lệ đã được thêm vào danh sách'}
                    </div>
                  ) : (
                    filteredOptions.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectProduct(opt)}
                        style={{
                          padding: '9px 14px',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fff7ed')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{opt.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {opt.code} {opt.unitName ? `(${opt.unitName})` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                            Tồn: {Number(opt.stock ?? opt.baseStock ?? 0).toLocaleString('vi-VN')} {opt.unitName}
                          </div>
                          <div style={{ fontSize: 11, color: '#e8442a', fontWeight: 600 }}>
                            Giá vốn: {Number(opt.costPrice ?? opt.baseAvgCost ?? 0).toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* NÚT CHỌN HÀNG HẾT HẠN */}
            <button
              type="button"
              onClick={handleSelectAllExpiredInModal}
              disabled={loadingExpiredInModal}
              title="Tự động tìm và chọn các nguyên liệu đã hết hạn"
              style={{
                height: 36,
                background: '#fff1f2',
                color: '#e11d48',
                border: '1px solid #fecdd3',
                borderRadius: 6,
                padding: '0 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: loadingExpiredInModal ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 2px rgba(225, 29, 72, 0.08)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!loadingExpiredInModal) e.currentTarget.style.background = '#ffe4e6';
              }}
              onMouseLeave={(e) => {
                if (!loadingExpiredInModal) e.currentTarget.style.background = '#fff1f2';
              }}
            >
              <WarningOutlined />
              <span>{loadingExpiredInModal ? 'Đang tìm...' : 'Chọn hàng hết hạn'}</span>
            </button>
          </div>

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
                  <th style={{ padding: '8px 8px', textAlign: 'center', width: 110 }}>SL HỦY</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', width: 110 }}>GIÁ VỐN HỦY</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', width: 120 }}>THÀNH TIỀN HỦY</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                      Chưa có sản phẩm nào được chọn để xuất hủy.
                    </td>
                  </tr>
                ) : (
                  items.map((record, index) => {
                    const conversionPoint = record.conversionPoint || 1;
                    const convertedStock = (record.baseStock ?? record.stock ?? 0) / conversionPoint;
                    const convertedCostPrice = conversionPoint * (record.baseAvgCost ?? record.costPrice ?? 0);
                    const isExceed = (record.quantity || 0) > convertedStock;
                    const total = (Number(record.quantity) || 0) * convertedCostPrice;

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
                          <div>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{record.name}</span>
                            {(record.isExpiredAutoSelected || record.note?.includes('Lô hết hạn')) && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 9.5,
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  border: '1px solid #fca5a5',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  fontWeight: 700
                                }}
                              >
                                Hết hạn
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <EditOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                            {record.editingNote ? (
                              <input
                                type="text"
                                value={record.note || ''}
                                autoFocus
                                onBlur={() => {
                                  const updated = [...items];
                                  updated[index] = { ...updated[index], editingNote: false };
                                  setItems(updated);
                                }}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[index] = { ...updated[index], note: e.target.value };
                                  setItems(updated);
                                }}
                                placeholder="Nhập ghi chú..."
                                style={{
                                  fontSize: 10,
                                  padding: '1px 4px',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 4,
                                  outline: 'none'
                                }}
                              />
                            ) : (
                              <span
                                onClick={() => {
                                  const updated = [...items];
                                  updated[index] = { ...updated[index], editingNote: true };
                                  setItems(updated);
                                }}
                                style={{
                                  fontSize: 10,
                                  color: record.note ? '#475569' : '#94a3b8',
                                  cursor: 'pointer',
                                  fontStyle: record.note ? 'normal' : 'italic'
                                }}
                              >
                                {record.note || 'Ghi chú'}
                              </span>
                            )}
                          </div>
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
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number"
                              min={0.001}
                              step="any"
                              value={record.quantity ?? 1}
                              onChange={(e) => handleQtyChange(index, e.target.value)}
                              style={{
                                width: 75,
                                textAlign: 'center',
                                borderRadius: 16,
                                border: isExceed ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                                padding: '3px 6px',
                                fontSize: 11,
                                outline: 'none'
                              }}
                            />
                            {isExceed && (
                              <span title={`Số lượng xuất hủy (${record.quantity}) vượt quá tồn kho hiện tại trong kho (${convertedStock.toLocaleString('vi-VN')})`}>
                                <WarningOutlined style={{ color: '#f59e0b', fontSize: 14, cursor: 'pointer' }} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', color: '#475569' }}>
                          {Math.round(convertedCostPrice).toLocaleString('vi-VN')} đ
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#dc2626' }}>
                          {Math.round(total).toLocaleString('vi-VN')} đ
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
            {/* TIME & CREATOR HEADER */}
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
              <div style={{ marginBottom: 4, color: '#64748b', fontSize: 11 }}>Mã xuất hủy</div>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', padding: 10, borderRadius: 6, border: '1px solid #fecaca' }}>
              <span style={{ color: '#991b1b', fontSize: 11.5, fontWeight: 700 }}>Tổng tiền tổn thất / hủy:</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#dc2626' }}>
                {Math.round(totalDisposalAmount).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={4}
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

export default DisposalDocumentModal;
