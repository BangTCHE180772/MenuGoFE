import React, { useState, useEffect, useMemo } from 'react';
import {
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  FullscreenOutlined,
  PrinterOutlined,
  PlusOutlined,
  UserOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { getSuppliers, getExtraPartners } from '../../../../api/partnerApi';
import { getBInventories, getProductsByDate } from '../../../../api/binventoryApi';
import {
  createImportPending,
  createImportCompleted,
  updateImportPending,
  completeImportDocument,
  getImportById
} from '../../../../api/documentApi';
import QuickCreatePartnerModal from './QuickCreatePartnerModal';
import { useAuth } from '../../../../context/AuthContext';

// Native Toast Helper (No antd UI components)
const showToast = (text) => {
  const toast = document.createElement('div');
  toast.innerText = text;
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: #10b981;
    color: #ffffff;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    z-index: 99999;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
    animation: fadeIn 0.2s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2200);
};

const ImportDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = [],
  partners = [],
  editingDocument = null
}) => {
  const auth = useAuth ? useAuth() : {};
  const user = auth?.user;
  const creatorName = user?.name || user?.email || 'Hệ thống';

  const [loading, setLoading] = useState(false);
  const [suppliersList, setSuppliersList] = useState([]);
  const [bInventoryList, setBInventoryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [createPartnerModalOpen, setCreatePartnerModalOpen] = useState(false);
  const [createPartnerDefaultType, setCreatePartnerDefaultType] = useState(1);

  const [formData, setFormData] = useState({
    supplierId: undefined,
    docCode: '',
    paidAmount: 0,
    note: ''
  });

  const [items, setItems] = useState([]);

  // Fetch Suppliers & Product Search List when modal opens
  useEffect(() => {
    if (!open) return;

    setSearchQuery('');
    setShowDropdown(false);

    if (branchId) {
      getSuppliers(branchId)
        .then((res) => {
          const data = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
          setSuppliersList(data.length > 0 ? data : partners);
        })
        .catch((err) => {
          console.error('Failed to load suppliers:', err);
          setSuppliersList(partners);
        });

      getBInventories(branchId)
        .then((res) => {
          const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          setBInventoryList(data);
        })
        .catch(() => setBInventoryList([]));
    }

    if (editingDocument && editingDocument.id) {
      const populateModalData = (doc) => {
        const supplierPartner = (doc.partners || []).find(
          (p) => p.partnerType === 1 || p.partnerType === 'Supplier'
        ) || doc.partner;

        setFormData({
          supplierId: supplierPartner?.partnerId ? Number(supplierPartner.partnerId) : (doc.partnerId ? Number(doc.partnerId) : undefined),
          docCode: doc.code || '',
          paidAmount: supplierPartner?.amountPaid ? Number(supplierPartner.amountPaid) : (doc.amountPaid ? Number(doc.amountPaid) : 0),
          note: doc.note || ''
        });

        const rawDetails = doc.details || doc.documentDetails || [];
        const mappedItems = rawDetails.map((d) => {
          const bInvId = Number(d.bInventoryId || d.bInventory?.id || d.id);

          const matchedInv = (bInventoryList || []).find((b) => Number(b.id) === bInvId) ||
                             (products || []).find((p) => Number(p.id) === bInvId || Number(p.bInventoryId) === bInvId);

          const conversions = d.bInventory?.product?.unitConversions ||
                              d.unitConversions ||
                              d.conversions ||
                              matchedInv?.unitConversions ||
                              matchedInv?.conversions ||
                              matchedInv?.product?.unitConversions || [];

          const pCode = d.productCode || d.currentProductCode || d.snapshotProductCode || d.code || matchedInv?.code || 'SP';
          const pName = d.productName || d.currentProductName || d.snapshotProductName || d.name || matchedInv?.name || 'Sản phẩm';
          const uName = d.unitName || d.currentUnitName || d.snapshotUnitName || (conversions.length > 0 ? conversions[0].unitName : '') || 'Đơn vị';

          return {
            rowId: `${bInvId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            bInventoryId: bInvId,
            code: pCode,
            name: pName,
            stock: d.currentStockQuantity ?? d.bInventory?.quantity ?? matchedInv?.stock ?? 0,
            quantity: Number(d.quantity || 1),
            unitPrice: Math.floor(Number(d.unitPrice || 0)),
            unitConversionId: d.unitConversionId ? Number(d.unitConversionId) : (conversions.length > 0 ? Number(conversions[0].id) : null),
            unitName: uName,
            unitConversions: conversions
          };
        });
        setItems(mappedItems);
      };

      // Populate immediately with initial editingDocument
      populateModalData(editingDocument);

      // If details array is empty on the passed object, fetch full document details
      const hasDetails = (editingDocument.details && editingDocument.details.length > 0) ||
                         (editingDocument.documentDetails && editingDocument.documentDetails.length > 0);

      if (!hasDetails) {
        getImportById(editingDocument.id)
          .then((fullDoc) => {
            if (fullDoc) {
              populateModalData(fullDoc);
            }
          })
          .catch((err) => console.error('Failed to fetch full editing document:', err));
      }
    } else {
      // Create Mode Initialization
      setFormData({
        supplierId: undefined,
        docCode: '',
        paidAmount: 0,
        note: ''
      });
      setItems([]);
    }
  }, [open, branchId, partners, editingDocument, products]);

  // Live Product Search Trigger
  useEffect(() => {
    if (!open || !branchId || !searchQuery) return;
    const timer = setTimeout(() => {
      getProductsByDate(branchId, null, searchQuery)
        .then((res) => {
          const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          if (data.length > 0) setBInventoryList(data);
        })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, open, branchId]);

  if (!open) return null;

  // Filtered Products for Search Dropdown (ONLY ProductType REGULAR, INGREDIENT, TOOL allowed)
  const searchOptions = bInventoryList.length > 0 ? bInventoryList : products;
  const filteredSearchList = searchOptions.filter((b) => {
    const rawType = b.type ?? b.productType ?? b.product?.type;
    const typeStr = String(rawType ?? '').toLowerCase();
    const isAllowedType =
      typeStr === 'regular' ||
      typeStr === 'ingredient' ||
      typeStr === 'tool' ||
      rawType === 3 ||
      rawType === 4 ||
      rawType === 5;

    if (!isAllowedType) return false;

    if (!searchQuery) return true;
    const lower = searchQuery.toLowerCase();
    const matchName = (b.name || b.productName || '').toLowerCase().includes(lower);
    const matchCode = (b.code || b.productCode || '').toLowerCase().includes(lower);
    return matchName || matchCode;
  });

  // Add Item Handler (Preserves existing item selection if already in table)
  const handleAddItem = (prod) => {
    const bInvId = Number(prod.id ?? prod.bInventoryId ?? prod.productId);
    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex((i) => Number(i.bInventoryId) === bInvId);
      if (existingIdx >= 0) {
        const updated = [...prevItems];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1
        };
        return updated;
      }

      const conversions = prod.unitConversions || prod.conversions || prod.product?.unitConversions || [];
      return [
        ...prevItems,
        {
          rowId: `${bInvId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          bInventoryId: bInvId,
          code: prod.code || prod.skuCode || `SP${bInvId}`,
          name: prod.name || 'Sản phẩm',
          stock: prod.quantity ?? prod.stockQuantity ?? 0,
          quantity: 1,
          unitPrice: Math.floor(Number(prod.purchasePrice || prod.avg || prod.sellPrice || 0)),
          unitConversionId: conversions.length > 0 ? Number(conversions[0].id) : null,
          unitName: conversions.length > 0 ? conversions[0].unitName || conversions[0].name : (prod.unitName || 'Đơn vị'),
          unitConversions: conversions
        }
      ];
    });
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveItem = (rowId) => {
    setItems((prev) => prev.filter((i) => i.rowId !== rowId));
  };

  const handleItemChange = (rowId, field, val) => {
    setItems((prev) =>
      prev.map((i) => (i.rowId === rowId ? { ...i, [field]: val } : i))
    );
  };

  const handlePartnerCreated = (newPartner) => {
    if (!newPartner) return;
    if (branchId) {
      getSuppliers(branchId)
        .then((res) => {
          const data = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
          setSuppliersList(data.length > 0 ? data : partners);
        })
        .catch(() => {});
    }
    if (newPartner.id) {
      setFormData((prev) => ({ ...prev, supplierId: Number(newPartner.id) }));
    }
  };

  // Calculations
  const goodsAmount = items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0);

  // Build Payload (Matches ImportDocumentCreateDto and ImportDocumentUpdateDto schema)
  const buildPayload = () => {
    const formattedDetails = items.map((i) => ({
      bInventoryId: Number(i.bInventoryId),
      unitConversionId: i.unitConversionId ? Number(i.unitConversionId) : null,
      quantity: Number(i.quantity || 1),
      unitPrice: Number(i.unitPrice || 0)
    }));

    return {
      branchId: Number(branchId),
      partnerId: formData.supplierId ? Number(formData.supplierId) : null,
      orderDate: new Date().toISOString(),
      note: formData.note || '',
      amountPaid: Number(formData.paidAmount || 0),
      details: formattedDetails
    };
  };

  // ACTION 1: LƯU TẠM (SAVE PENDING)
  const handleSavePending = async () => {
    if (items.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để nhập kho');
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload();
      if (editingDocument && editingDocument.id) {
        await updateImportPending(editingDocument.id, payload);
      } else {
        await createImportPending(payload);
      }
      showToast('Lưu thành công');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu tạm phiếu nhập:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join('\n')
          : null) ||
        err.message ||
        'Không thể lưu tạm phiếu nhập.';
      alert(`Lỗi khi lưu tạm phiếu nhập:\n${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // ACTION 2: HOÀN THÀNH (COMPLETE & POST)
  const handleComplete = async () => {
    if (items.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để nhập kho');
      return;
    }
    if (!formData.supplierId || Number(formData.supplierId) <= 0) {
      alert('Vui lòng chọn Nhà cung cấp trước khi hoàn thành phiếu nhập kho.');
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload();
      if (editingDocument && editingDocument.id) {
        await updateImportPending(editingDocument.id, payload);
        await completeImportDocument(editingDocument.id);
      } else {
        await createImportCompleted(payload);
      }
      showToast('Tạo thành công');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi hoàn thành phiếu nhập:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join('\n')
          : null) ||
        err.message ||
        'Không thể hoàn thành phiếu nhập.';
      alert(`Lỗi khi hoàn thành phiếu nhập:\n${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* ORIGINAL HEADER BAR (BRAND ORANGE GRADIENT) */}
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
            {editingDocument ? `Chỉnh sửa phiếu nhập kho (${editingDocument.code})` : 'Tạo phiếu nhập kho'}
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

      {/* ORIGINAL 2-COLUMN BODY (LEFT: TABLE & SEARCH | RIGHT: SIDEBAR FORM) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT SECTION: SEARCH & PRODUCT TABLE */}
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* SEARCH INPUT WITH DROPDOWN */}
          <div style={{ marginBottom: 10, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }} />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Tìm sản phẩm theo mã hoặc tên (F1)..."
                style={{
                  width: '100%',
                  height: 36,
                  paddingLeft: 34,
                  paddingRight: 12,
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              />
            </div>

            {/* LIVE SEARCH DROPDOWN */}
            {showDropdown && filteredSearchList.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  background: '#ffffff',
                  maxHeight: 220,
                  overflowY: 'auto',
                  marginTop: 4,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  zIndex: 100
                }}
              >
                {filteredSearchList.map((p) => (
                  <div
                    key={p.id ?? p.bInventoryId ?? p.productId}
                    onClick={() => handleAddItem(p)}
                    style={{
                      padding: '9px 14px',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0f172a' }}>{p.name}</strong> <span style={{ color: '#64748b' }}>({p.code || p.skuCode})</span>
                    </div>
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>Tồn: {p.quantity ?? p.stockQuantity ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT ITEMS TABLE */}
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
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
                  <th style={{ width: 40, padding: '8px 6px', textAlign: 'center' }}>STT</th>
                  <th style={{ width: 110, padding: '8px 8px', textAlign: 'left' }}>MÃ HÀNG</th>
                  <th style={{ padding: '8px 8px', textAlign: 'left' }}>TÊN HÀNG</th>
                  <th style={{ width: 110, padding: '8px 8px', textAlign: 'center' }}>ĐVT</th>
                  <th style={{ width: 80, padding: '8px 8px', textAlign: 'center' }}>TỒN KHO</th>
                  <th style={{ width: 90, padding: '8px 8px', textAlign: 'center' }}>SỐ LƯỢNG</th>
                  <th style={{ width: 110, padding: '8px 8px', textAlign: 'right' }}>ĐƠN GIÁ NHẬP</th>
                  <th style={{ width: 120, padding: '8px 8px', textAlign: 'right' }}>THÀNH TIỀN</th>
                  <th style={{ width: 36, padding: '8px 6px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>
                      Chưa có sản phẩm nào được chọn. Hãy gõ tìm kiếm để chọn sản phẩm nhập kho.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const rowTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);

                    return (
                      <tr key={item.rowId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', color: '#64748b', padding: '6px' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#2563eb', padding: '6px 8px' }}>{item.code}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a', padding: '6px 8px' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                          {item.unitConversions && item.unitConversions.length > 0 ? (
                            <select
                              value={item.unitConversionId || ''}
                              onChange={(e) => handleItemChange(item.rowId, 'unitConversionId', e.target.value ? Number(e.target.value) : null)}
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
                              {item.unitConversions.map((uc) => (
                                <option key={uc.id} value={uc.id}>
                                  {uc.unitName || uc.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ color: '#475569' }}>{item.unitName || 'Cái'}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', color: '#64748b', padding: '6px 8px' }}>{item.stock}</td>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.rowId, 'quantity', Math.max(1, Number(e.target.value)))}
                            style={{
                              width: 60,
                              height: 26,
                              textAlign: 'center',
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 8px' }}>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.rowId, 'unitPrice', Math.max(0, Number(e.target.value)))}
                            style={{
                              width: 90,
                              height: 26,
                              textAlign: 'right',
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#e8442a', padding: '6px 8px' }}>
                          {rowTotal.toLocaleString('vi-VN')} đ
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.rowId)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <DeleteOutlined />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT SECTION: SIDEBAR FORM & SUMMARY (WIDTH 330PX MATCHING ORIGINAL DESIGNS) */}
        <div
          style={{
            width: 330,
            background: '#ffffff',
            borderLeft: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}
        >
          {/* USER & AUDIT HEADER CARD */}
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155', fontWeight: 600 }}>
              <UserOutlined style={{ color: '#e8442a' }} />
              <span>Người tạo: <strong style={{ color: '#0f172a' }}>{creatorName}</strong></span>
            </div>
            <div style={{ color: '#64748b', fontSize: 10.5, marginTop: 4 }}>
              Thời gian khởi tạo: {dayjs().format('DD/MM/YYYY HH:mm')}
            </div>
          </div>

          {/* FORM FIELDS */}
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {/* SUPPLIER SELECT WITH QUICK CREATE BUTTON */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                  Nhà cung cấp <span style={{ color: '#e8442a' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCreatePartnerDefaultType(1);
                    setCreatePartnerModalOpen(true);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#2563eb',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <PlusOutlined /> Thêm mới
                </button>
              </div>
              <select
                value={formData.supplierId || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, supplierId: e.target.value ? Number(e.target.value) : undefined }))}
                style={{
                  width: '100%',
                  height: 32,
                  padding: '0 8px',
                  fontSize: 11.5,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliersList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.partnerName}
                  </option>
                ))}
              </select>
            </div>

            {/* DOCUMENT CODE */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 4 }}>
                Mã phiếu nhập
              </label>
              <input
                type="text"
                value={formData.docCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, docCode: e.target.value }))}
                placeholder="Mã tự động..."
                style={{
                  width: '100%',
                  height: 32,
                  padding: '0 8px',
                  fontSize: 11.5,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  outline: 'none'
                }}
              />
            </div>

            {/* NOTE */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 4 }}>
                Ghi chú
              </label>
              <textarea
                rows={2}
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Ghi chú thêm..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: 11.5,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {/* FINANCIAL SUMMARY BOX (DISCOUNT & OTHER COST OMITTED AS REQUESTED) */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Tổng số lượng:</span>
                <strong style={{ color: '#0f172a' }}>
                  {items.reduce((sum, i) => sum + Number(i.quantity || 0), 0).toLocaleString('vi-VN')}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#334155', fontWeight: 600 }}>Tổng tiền hàng:</span>
                <strong style={{ color: '#e8442a', fontSize: 15 }}>{goodsAmount.toLocaleString('vi-VN')} đ</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ color: '#475569', fontSize: 11.5, fontWeight: 600 }}>Tiền trả NCC:</span>
                <input
                  type="number"
                  min={0}
                  value={formData.paidAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paidAmount: Math.max(0, Number(e.target.value)) }))}
                  style={{
                    width: 120,
                    height: 28,
                    padding: '0 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: 'right',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS AT SIDEBAR FOOTER ([LƯU TẠM] & [HOÀN THÀNH]) */}
          <div style={{ padding: 16, borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', gap: 10 }}>
            <button
              type="button"
              disabled={loading || items.length === 0}
              onClick={handleSavePending}
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
              onClick={handleComplete}
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

      {/* QUICK CREATE PARTNER MODAL */}
      <QuickCreatePartnerModal
        open={createPartnerModalOpen}
        onClose={() => setCreatePartnerModalOpen(false)}
        onPartnerCreated={handlePartnerCreated}
        branchId={branchId}
        defaultType={createPartnerDefaultType}
      />
    </div>
  );
};

export default ImportDocumentModal;
