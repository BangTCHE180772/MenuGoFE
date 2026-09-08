import React, { useState, useEffect } from 'react';
import { CloseOutlined, GiftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { createPromotion, updatePromotion, deletePromotion } from '../../../api/promotionApi';
import { getAllBranches } from '../../../api/branchApi';
import { useAuth, ROLES } from '../../../context/AuthContext';

const ProductDiscountModal = ({ product, existingPromotion, onClose, onSuccess, notifySuccess, notifyError }) => {
  const { hasRole } = useAuth();
  const isOwnerOrAdmin = hasRole(ROLES.OWNER, ROLES.ADMIN);
  
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(isOwnerOrAdmin);

  const [formValues, setFormValues] = useState({
    discountType: 'Percentage',
    discountValue: 0,
    maxDiscount: 0,
    startDate: dayjs().format('YYYY-MM-DDTHH:mm'),
    endDate: dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm'),
    scope: 0, // 0 = AllBranches, 1 = SpecificBranches
    branchIds: []
  });

  useEffect(() => {
    if (isOwnerOrAdmin) {
      getAllBranches()
        .then(res => {
          setBranches(res.data || []);
        })
        .catch(err => console.error("Error fetching branches:", err))
        .finally(() => setLoadingBranches(false));
    }
  }, [isOwnerOrAdmin]);

  useEffect(() => {
    if (existingPromotion) {
      setFormValues({
        discountType: existingPromotion.discountType || 'Percentage',
        discountValue: existingPromotion.discountValue || 0,
        maxDiscount: existingPromotion.maxDiscount || 0,
        startDate: dayjs(existingPromotion.startDate).format('YYYY-MM-DDTHH:mm'),
        endDate: dayjs(existingPromotion.endDate).format('YYYY-MM-DDTHH:mm'),
        scope: existingPromotion.scope || 0,
        branchIds: existingPromotion.branches?.map(b => b.branchId) || []
      });
    }
  }, [existingPromotion]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (formValues.discountValue <= 0) {
      notifyError('Vui lòng nhập mức giảm giá lớn hơn 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: `Khuyến mãi: ${product.name}`,
        description: `Chương trình giảm giá riêng cho món ${product.name}`,
        discountType: formValues.discountType,
        discountValue: formValues.discountValue,
        maxDiscount: formValues.maxDiscount,
        startDate: new Date(formValues.startDate).toISOString(),
        endDate: new Date(formValues.endDate).toISOString(),
        scope: isOwnerOrAdmin ? formValues.scope : 1, // Manager defaults to their branch (scope 1 is handled by BE if empty, or we pass 1)
        isActive: true,
        productIds: [product.id],
        branchIds: isOwnerOrAdmin && formValues.scope === 1 ? formValues.branchIds : []
      };

      if (existingPromotion) {
        await updatePromotion({ ...payload, id: existingPromotion.id });
        notifySuccess('Cập nhật khuyến mãi thành công');
      } else {
        await createPromotion(payload);
        notifySuccess('Thiết lập khuyến mãi thành công');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      notifyError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu khuyến mãi');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!existingPromotion) return;
    
    if (!window.confirm("Bạn có chắc chắn muốn xóa khuyến mãi của món này?")) return;
    
    setSaving(true);
    try {
      await deletePromotion(existingPromotion.id);
      notifySuccess('Đã xóa khuyến mãi');
      onSuccess();
    } catch (err) {
      console.error(err);
      notifyError('Không thể xóa khuyến mãi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#ffffff', borderRadius: 12, width: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GiftOutlined style={{ color: '#ea580c' }} />
            Giảm giá: {product.name}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <CloseOutlined style={{ fontSize: 16 }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Loại giảm giá</label>
              <select
                value={formValues.discountType}
                onChange={(e) => setFormValues({ ...formValues, discountType: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}
              >
                <option value="Percentage">Phần trăm (%)</option>
                <option value="FixedAmount">Số tiền (VNĐ)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Mức giảm</label>
              <input
                type="number" required min="0"
                value={formValues.discountValue}
                onChange={(e) => setFormValues({ ...formValues, discountValue: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}
              />
            </div>

            {formValues.discountType === 'Percentage' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Giảm tối đa (VNĐ)</label>
                <input
                  type="number" min="0"
                  value={formValues.maxDiscount}
                  onChange={(e) => setFormValues({ ...formValues, maxDiscount: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}
                />
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Thời gian bắt đầu</label>
              <input
                type="datetime-local" required
                value={formValues.startDate}
                onChange={(e) => setFormValues({ ...formValues, startDate: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Thời gian kết thúc</label>
              <input
                type="datetime-local" required
                value={formValues.endDate}
                onChange={(e) => setFormValues({ ...formValues, endDate: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}
              />
            </div>

            {isOwnerOrAdmin && (
              <>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Phạm vi áp dụng</label>
                  <select
                    value={formValues.scope}
                    onChange={(e) => setFormValues({ ...formValues, scope: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}
                  >
                    <option value={0}>Tất cả chi nhánh</option>
                    <option value={1}>Chi nhánh cụ thể</option>
                  </select>
                </div>

                {formValues.scope === 1 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Chọn chi nhánh</label>
                    {loadingBranches ? (
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Đang tải danh sách chi nhánh...</div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}>
                        {branches.map(b => (
                          <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                            <input
                              type="checkbox"
                              checked={formValues.branchIds.includes(b.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormValues(prev => ({
                                  ...prev,
                                  branchIds: checked ? [...prev.branchIds, b.id] : prev.branchIds.filter(id => id !== b.id)
                                }));
                              }}
                            />
                            {b.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {existingPromotion && (
              <button
                type="button"
                onClick={handleRemoveDiscount}
                disabled={saving}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                Xóa khuyến mãi
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#ffffff', background: saving ? '#94a3b8' : '#ea580c', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDiscountModal;
