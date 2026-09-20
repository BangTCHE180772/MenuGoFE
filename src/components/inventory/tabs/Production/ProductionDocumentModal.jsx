import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CloseOutlined,
  SearchOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { getProductsByDate } from '../../../../api/binventoryApi';
import {
  createProductionPending,
  createProductionCompleted,
  updateProductionPending,
  completeProductionDocument,
  deleteProductionPendingDocument,
  getProductionById
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

const ProductionDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = [],
  editDocumentId = null
}) => {
  const auth = useAuth ? useAuth() : {};
  const user = auth?.user;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'materials'

  const [selectedDateTime, setSelectedDateTime] = useState(dayjs());
  const [openTimeFormatted, setOpenTimeFormatted] = useState('');
  const [openTimeISO, setOpenTimeISO] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Search list for Manufactured products ONLY
  const [manufacturedList, setManufacturedList] = useState([]);
  const [manufacturedQuery, setManufacturedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedManufactured, setSelectedManufactured] = useState(null);
  const [finishedQuantity, setFinishedQuantity] = useState(1);

  const [formData, setFormData] = useState({
    docCode: '',
    note: '',
    autoDeductSecondary: true
  });

  // Fetch Manufactured products ONLY (Mode 3)
  const fetchManufacturedProducts = useCallback((bId, date, query = '') => {
    if (!bId) return;
    getProductsByDate(bId, date, query, 'Manufactured', 3)
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (data.length > 0 || !query) {
          setManufacturedList(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load Manufactured products:', err);
      });
  }, []);

  useEffect(() => {
    if (open) {
      if (editDocumentId) {
        setLoading(true);
        getProductionById(editDocumentId)
          .then((res) => {
            if (res) {
              const dt = res.businessDate ? dayjs(res.businessDate) : dayjs();
              setSelectedDateTime(dt);
              setOpenTimeFormatted(dt.format('DD/MM/YYYY HH:mm'));
              setOpenTimeISO(dt.toISOString());
              setFormData({
                docCode: res.code || '',
                note: res.note || '',
                autoDeductSecondary: true
              });
              const finishedDetail = (res.details || []).find((d) => d.isFinishedProduct || d.fatherId == null) || res.details?.[0];
              if (finishedDetail) {
                setSelectedManufactured({
                  id: finishedDetail.bInventoryId,
                  name: finishedDetail.productName || finishedDetail.bInventoryName || 'Thành phẩm',
                  code: finishedDetail.code || '',
                  unitName: finishedDetail.unitName || 'Đơn vị'
                });
                setFinishedQuantity(finishedDetail.quantity || 1);
              }
            }
          })
          .catch((err) => {
            console.error('Lỗi khi tải chi tiết sản xuất:', err);
            showToast('Không thể tải chi tiết phiếu sản xuất', 'error');
          })
          .finally(() => setLoading(false));
      } else {
        const now = dayjs();
        setSelectedDateTime(now);
        setOpenTimeFormatted(now.format('DD/MM/YYYY HH:mm'));
        setOpenTimeISO(now.toISOString());
        setShowDatePicker(false);
        setActiveTab('info');

        setManufacturedQuery('');
        setShowDropdown(false);
        setSelectedManufactured(null);
        setFinishedQuantity(1);

        setFormData({
          docCode: '',
          note: '',
          autoDeductSecondary: true
        });

        if (branchId) {
          fetchManufacturedProducts(branchId, now.toISOString(), '');
        }
      }
    } else {
      setSelectedManufactured(null);
      setManufacturedQuery('');
      setFinishedQuantity(1);
      setFormData({
        docCode: '',
        note: '',
        autoDeductSecondary: true
      });
      setShowDropdown(false);
      setLoading(false);
    }
  }, [open, editDocumentId, branchId, fetchManufacturedProducts]);

  // Dynamic search on user typing for Manufactured products
  useEffect(() => {
    if (!open || !branchId) return;
    const timer = setTimeout(() => {
      fetchManufacturedProducts(branchId, openTimeISO || new Date().toISOString(), manufacturedQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [manufacturedQuery, open, branchId, openTimeISO, fetchManufacturedProducts]);

  const handleDateChange = (newDate) => {
    setSelectedDateTime(newDate);
    setOpenTimeFormatted(newDate.format('DD/MM/YYYY HH:mm'));
    setOpenTimeISO(newDate.toISOString());

    if (branchId) {
      fetchManufacturedProducts(branchId, newDate.toISOString(), manufacturedQuery);
    }
  };

  const manufacturedOptions = useMemo(() => {
    const raw = manufacturedList.length > 0 ? manufacturedList : products;
    return raw
      .filter((b) => {
        if (!b || (b.id == null && b.bInventoryId == null)) return false;
        const rawType = b.type ?? b.productType ?? b.product?.type;
        const typeStr = String(rawType ?? '').toLowerCase();
        return typeStr === 'manufactured' || rawType === 2;
      })
      .map((b) => ({
        id: b.id ?? b.bInventoryId,
        code: b.code || b.skuCode || `SP${b.id}`,
        name: b.name || 'Thành phẩm sản xuất',
        unitName: b.baseUnit?.unitName || b.unitConversions?.[0]?.unitName || '',
        ingredients: b.recipeItems || b.ingredients || []
      }));
  }, [manufacturedList, products]);

  const filteredOptions = useMemo(() => {
    if (!manufacturedQuery.trim()) return manufacturedOptions;
    const q = manufacturedQuery.toLowerCase().trim();
    const qNorm = removeVietnameseTones(q);

    return manufacturedOptions.filter((opt) => {
      const name = (opt.name || '').toLowerCase();
      const code = (opt.code || '').toLowerCase();
      const nameNorm = removeVietnameseTones(opt.name || '');
      const codeNorm = removeVietnameseTones(opt.code || '');

      return (
        name.includes(q) ||
        code.includes(q) ||
        nameNorm.includes(qNorm) ||
        codeNorm.includes(qNorm)
      );
    });
  }, [manufacturedOptions, manufacturedQuery]);

  const handleSelectManufactured = (opt) => {
    setSelectedManufactured(opt);
    setManufacturedQuery('');
    setShowDropdown(false);
  };

  // Preview ingredients list with branch inventory stock check
  const ingredientsList = useMemo(() => {
    if (!selectedManufactured) return [];
    const rawIngredients = selectedManufactured.ingredients || selectedManufactured.recipeDetailes || [];
    if (!Array.isArray(rawIngredients) || rawIngredients.length === 0) return [];

    const qty = Number(finishedQuantity) || 1;
    return rawIngredients.map((ing, idx) => {
      const ingProdId = ing.ingredientProductId || ing.productId || ing.ingredientId || ing.id;
      const matched = products.find((p) => Number(p.productId || p.id) === Number(ingProdId) || (p.code && p.code === ing.code));
      const currentStock = Number(matched?.quantity ?? matched?.stockQuantity ?? 0);
      const norm = Number(ing.quantity || ing.normQty || 0);
      const required = norm * qty;
      const unit = ing.unitName || matched?.baseUnit?.unitName || matched?.unitName || 'Đơn vị';
      const isInsufficient = currentStock < required;

      return {
        key: ingProdId || idx,
        id: ingProdId,
        name: ing.name || ing.ingredientName || matched?.name || 'Nguyên liệu',
        code: ing.code || ing.ingredientCode || matched?.code || `NL${ingProdId}`,
        norm,
        required,
        currentStock,
        unit,
        isInsufficient,
        diff: required - currentStock
      };
    });
  }, [selectedManufactured, finishedQuantity, products]);

  const hasInsufficient = useMemo(() => {
    return ingredientsList.some((i) => i.isInsufficient);
  }, [ingredientsList]);

  const handleSubmit = async (isDraft = false) => {
    if (!selectedManufactured) {
      showToast('Vui lòng chọn 1 mặt hàng sản xuất.', 'error');
      return;
    }

    if (hasInsufficient) {
      showToast('Kho không đủ nguyên liệu để sản xuất. Vui lòng kiểm tra lại tồn kho.', 'error');
      return;
    }

    const qty = Math.min(10000000000, Math.max(0.001, Number(finishedQuantity) || 1));

    setLoading(true);
    try {
      const dto = {
        branchId: Number(branchId),
      code: formData.docCode ? formData.docCode.trim() : undefined,
        orderDate: new Date().toISOString(),
        note: formData.note || '',
        details: [
          {
            bInventoryId: Number(selectedManufactured.id),
            quantity: qty,
            fatherId: null,
            unitConversionId: null
          }
        ]
      };

      if (editDocumentId) {
        if (isDraft) {
          await updateProductionPending(editDocumentId, dto);
          showToast('Cập nhật phiếu sản xuất nháp thành công!');
        } else {
          await updateProductionPending(editDocumentId, dto);
          await completeProductionDocument(editDocumentId);
          showToast('Hoàn thành phiếu sản xuất thành công!');
        }
      } else {
        if (isDraft) {
          await createProductionPending(dto);
          showToast('Lưu tạm phiếu sản xuất thành công!');
        } else {
          await createProductionCompleted(dto);
          showToast('Tạo và Hoàn thành phiếu sản xuất thành công!');
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = extractErrorMessage(err, 'Lỗi khi lưu phiếu sản xuất.');
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPending = async () => {
    if (!editDocumentId) return;
    if (!window.confirm('Bạn có chắc chắn muốn hủy phiếu sản xuất nháp này?')) return;
    setLoading(true);
    try {
      await deleteProductionPendingDocument(editDocumentId, 'Hủy phiếu nháp từ giao diện');
      showToast('Đã chuyển phiếu sản xuất sang trạng thái Canceled!');
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
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      {/* DIALOG POPUP BOX */}
      <div
        style={{
          width: 720,
          maxWidth: '100%',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          fontSize: 12
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER WITH TABS */}
        <div style={{ padding: '16px 24px 0 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
              Tạo phiếu sản xuất
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: 16,
                padding: 4
              }}
            >
              <CloseOutlined />
            </button>
          </div>

          {/* HEADER TITLE */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e8442a', paddingBottom: 4 }}>
            Thông tin sản xuất
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '20px 24px', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          {/* TAB 1: THÔNG TIN FORM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* ROW 1: SẢN XUẤT MẶT HÀNG & SỐ LƯỢNG */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ marginBottom: 6, fontWeight: 500, color: '#475569', fontSize: 11 }}>
                    Sản xuất mặt hàng
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#ffffff',
                      borderRadius: 18,
                      padding: '6px 14px',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    <SearchOutlined style={{ color: '#94a3b8', marginRight: 8 }} />
                    <input
                      type="text"
                      placeholder="Chọn mặt hàng sản xuất"
                      value={selectedManufactured ? `${selectedManufactured.code} - ${selectedManufactured.name}` : manufacturedQuery}
                      onFocus={() => {
                        if (selectedManufactured) {
                          setSelectedManufactured(null);
                          setManufacturedQuery('');
                        }
                        setShowDropdown(true);
                      }}
                      onChange={(e) => {
                        setSelectedManufactured(null);
                        setManufacturedQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        fontSize: 12,
                        background: 'transparent',
                        color: '#0f172a',
                        fontWeight: selectedManufactured ? 600 : 400
                      }}
                    />
                  </div>

                  {showDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 60,
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxHeight: 200,
                        overflowY: 'auto',
                        zIndex: 2000
                      }}
                    >
                      {filteredOptions.length === 0 ? (
                        <div style={{ padding: 10, color: '#94a3b8', textAlign: 'center' }}>
                          Không tìm thấy mặt hàng sản xuất
                        </div>
                      ) : (
                        filteredOptions.map((opt) => (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectManufactured(opt)}
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
                              <div style={{ fontSize: 10, color: '#64748b' }}>{opt.code}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div style={{ width: 200 }}>
                  <div style={{ marginBottom: 6, fontWeight: 500, color: '#475569', fontSize: 11 }}>Số lượng</div>
                  <input
                    type="number"
                    min={0.001}
                    max={10000000000}
                    step="any"
                    value={finishedQuantity}
                    onChange={(e) => setFinishedQuantity(Math.min(10000000000, Math.max(0.001, Number(e.target.value) || 1)))}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      borderRadius: 18,
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* DANH SÁCH NGUYÊN LIỆU THEO CÔNG THỨC */}
              {selectedManufactured && (
                <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 11, color: '#334155', textTransform: 'uppercase' }}>
                      📋 Nguyên liệu tiêu hao theo công thức ({ingredientsList.length})
                    </span>
                    {hasInsufficient && (
                      <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
                        ⚠️ Có nguyên liệu không đủ tồn kho
                      </span>
                    )}
                  </div>

                  {ingredientsList.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>
                      Mặt hàng này chưa được cấu hình danh sách nguyên liệu công thức (Recipe).
                    </div>
                  ) : (
                    <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 600 }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Nguyên liệu</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', width: 90 }}>Định mức/sp</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', width: 90 }}>Cần dùng</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', width: 90 }}>Tồn kho</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center', width: 100 }}>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ingredientsList.map((ing, idx) => (
                            <tr key={ing.key || idx} style={{ borderBottom: '1px solid #f1f5f9', background: ing.isInsufficient ? '#fef2f2' : 'transparent' }}>
                              <td style={{ padding: '6px 8px' }}>
                                <div style={{ fontWeight: 600, color: ing.isInsufficient ? '#dc2626' : '#0f172a' }}>{ing.name}</div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>{ing.code}</div>
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#475569' }}>
                                {ing.norm.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} {ing.unit}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                {ing.required.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} {ing.unit}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: ing.isInsufficient ? '#dc2626' : '#16a34a' }}>
                                {ing.currentStock.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} {ing.unit}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                {ing.isInsufficient ? (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: 4, border: '1px solid #fecaca' }}>
                                    Thiếu {ing.diff.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: 4, border: '1px solid #bbf7d0' }}>
                                    Đủ hàng
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {hasInsufficient && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: '#fee2e2', borderRadius: 6, color: '#b91c1c', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⚠️ Không đủ nguyên liệu để sản xuất! Không thể hoàn thành hoặc lưu tạm khi kho thiếu nguyên liệu.
                    </div>
                  )}
                </div>
              )}

              {/* ROW 2: MÃ SẢN XUẤT */}
              <div>
                <div style={{ marginBottom: 6, fontWeight: 500, color: '#475569', fontSize: 11 }}>Mã sản xuất</div>
                <input
                  type="text"
                  value={formData.docCode}
                  onChange={(e) => setFormData({ ...formData, docCode: e.target.value })}
                  placeholder="Tự động"
                  style={{
                    width: '100%',
                    borderRadius: 18,
                    padding: '6px 14px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: 12
                  }}
                />
              </div>

              {/* ROW 3: GHI CHÚ */}
              <div>
                <div style={{ marginBottom: 6, fontWeight: 500, color: '#475569', fontSize: 11 }}>Ghi chú</div>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  placeholder="Nhập ghi chú"
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '8px 14px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: 12,
                    resize: 'none'
                  }}
                />
              </div>
            </div>
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#475569',
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Bỏ qua
          </button>
          {editDocumentId && (
            <button
              type="button"
              disabled={loading}
              onClick={handleCancelPending}
              style={{
                background: '#ffffff',
                border: '1px solid #dc2626',
                color: '#dc2626',
                fontWeight: 600,
                padding: '8px 18px',
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Hủy phiếu nháp
            </button>
          )}
          <button
            type="button"
            disabled={loading || hasInsufficient}
            onClick={() => handleSubmit(true)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: hasInsufficient ? '#94a3b8' : '#334155',
              fontWeight: 600,
              borderRadius: 20,
              padding: '8px 22px',
              cursor: hasInsufficient ? 'not-allowed' : 'pointer',
              fontSize: 12
            }}
          >
            Lưu tạm
          </button>
          <button
            type="button"
            disabled={loading || hasInsufficient}
            onClick={() => handleSubmit(false)}
            style={{
              background: hasInsufficient ? '#cbd5e1' : '#e8442a',
              border: `1px solid ${hasInsufficient ? '#cbd5e1' : '#e8442a'}`,
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: 20,
              padding: '8px 24px',
              cursor: hasInsufficient ? 'not-allowed' : 'pointer',
              fontSize: 12,
              boxShadow: hasInsufficient ? 'none' : '0 2px 6px rgba(232, 68, 42, 0.25)'
            }}
          >
            Hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionDocumentModal;
