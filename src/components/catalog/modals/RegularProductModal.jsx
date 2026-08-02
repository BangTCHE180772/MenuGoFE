import React, { useState, useEffect } from 'react';
import {
  CloseOutlined,
  PlusOutlined,
  PictureOutlined,
  ShoppingOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { createRegularProduct, updateRegularProduct } from '../../../api/productApi';
import { uploadImage } from '../../../api/imageApi';
import UnitConversionBuilder from './UnitConversionBuilder';

const RegularProductModal = ({
  open,
  onCancel,
  editingProduct = null,
  groups = [],
  units = [],
  menus = [],
  onSuccess,
  notifySuccess,
  notifyError,
  onOpenAddGroup,
  onOpenAddUnit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    skuCode: '',
    groupId: '',
    sellPrice: 0,
    isSellable: true,
    isManageQuantity: false,
    minStorage: 0,
    maxStorage: 1000000000,
    description: '',
    imageUrl: '',
    imageId: null,
    menuIds: [],
    unitConversions: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setFormData({
          id: editingProduct.id,
          name: editingProduct.name || '',
          skuCode: editingProduct.skuCode || '',
          groupId: editingProduct.groupId || (groups.length > 0 ? groups[0].id : ''),
          sellPrice: editingProduct.sellPrice || 0,
          isSellable: editingProduct.isSellable !== undefined ? editingProduct.isSellable : true,
          isManageQuantity: editingProduct.isManageQuantity || false,
          minStorage: editingProduct.minStorage || 0,
          maxStorage: editingProduct.maxStorage || 1000000000,
          description: editingProduct.description || '',
          imageUrl: editingProduct.imageUrl || '',
          imageId: editingProduct.imageId || null,
          menuIds: editingProduct.menuIds || [],
          unitConversions: editingProduct.unitConversions || [],
        });
      } else {
        setFormData({
          name: '',
          skuCode: '',
          groupId: groups.length > 0 ? groups[0].id : '',
          sellPrice: 0,
          isSellable: true,
          isManageQuantity: false,
          minStorage: 0,
          maxStorage: 1000000000,
          description: '',
          imageUrl: '',
          imageId: null,
          menuIds: [],
          unitConversions: [],
        });
      }
    }
  }, [open, editingProduct, groups]);

  if (!open) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadImage(file);
      if (res.data && res.data.imageLink) {
        setFormData(prev => ({
          ...prev,
          imageUrl: res.data.imageLink,
          imageId: res.data.id || null,
        }));
        notifySuccess('Tải ảnh lên thành công!');
      }
    } catch (err) {
      notifyError('Tải ảnh lên thất bại.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notifyError('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (!formData.groupId) {
      notifyError('Vui lòng chọn nhóm hàng.');
      return;
    }
    if (formData.sellPrice <= 0) {
      notifyError('Giá bán phải lớn hơn 0.');
      return;
    }
    if (formData.sellPrice > 10000000000) {
      notifyError('Giá bán không được vượt quá 10 tỷ.');
      return;
    }
    if (formData.unitConversions.length > 0) {
      const hasBase = formData.unitConversions.some(u => u.isBase);
      if (!hasBase) {
        notifyError('Bắt buộc phải chọn 1 đơn vị tính gốc.');
        return;
      }
      for (const u of formData.unitConversions) {
        if (!u.isBase) {
          const cp = Number(u.conversionPoint);
          if (!Number.isInteger(cp) || cp < 2 || cp > 1000000) {
            notifyError('Đơn vị quy đổi phải là số nguyên từ 2 đến 1.000.000.');
            return;
          }
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        chainId: 1,
        groupId: Number(formData.groupId),
        imageId: formData.imageId,
        imageUrl: formData.imageUrl,
        name: formData.name.trim(),
        skuCode: formData.skuCode.trim(),
        description: formData.description,
        isSellable: formData.isSellable,
        isManageQuantity: formData.isManageQuantity,
        minStorage: Number(formData.minStorage),
        maxStorage: Number(formData.maxStorage),
        sellPrice: Number(formData.sellPrice),
        menuIds: formData.menuIds.map(Number),
        unitConversions: formData.unitConversions.map(u => ({
          unitId: Number(u.unitId),
          conversionPoint: u.isBase ? 1 : Number(u.conversionPoint),
          isBase: Boolean(u.isBase),
        })),
      };

      if (editingProduct && editingProduct.id) {
        payload.id = editingProduct.id;
        await updateRegularProduct(payload);
        notifySuccess('Cập nhật món thường thành công!');
      } else {
        await createRegularProduct(payload);
        notifySuccess('Tạo mới món thường thành công!');
      }
      onSuccess();
      onCancel();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu món thường.';
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          width: 780,
          maxWidth: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f0fdf4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                fontSize: 18,
              }}
            >
              <ShoppingOutlined />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#14532d' }}>
                {editingProduct ? 'Cập Nhật Món Thường' : 'Thêm Món Thường Mới'}
              </h3>
              <span style={{ fontSize: 12, color: '#15803d' }}>REGULAR - Món thường / hàng đóng gói bán lẻ (Không có công thức)</span>
            </div>
          </div>
          <button onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#64748b' }}>
            <CloseOutlined />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* THÔNG TIN CƠ BẢN */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 20 }}>
              {/* IMAGE UPLOAD */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>Hình ảnh</label>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    border: '2px dashed #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#f8fafc',
                  }}
                >
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <PictureOutlined style={{ fontSize: 24, marginBottom: 4 }} />
                      <div style={{ fontSize: 11 }}>Tải ảnh lên</div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* FORM FIELDS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>
                    Tên hàng hóa <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Lon Coca Cola, Nước suối Aquafina"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>
                    Nhóm hàng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select
                      value={formData.groupId}
                      onChange={e => setFormData({ ...formData, groupId: e.target.value })}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: '#ffffff' }}
                    >
                      <option value="">-- Chọn nhóm --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    {onOpenAddGroup && (
                      <button type="button" onClick={onOpenAddGroup} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>
                        <PlusOutlined />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>
                    Giá bán (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000000000"
                    placeholder="15000"
                    value={formData.sellPrice}
                    onChange={e => setFormData({ ...formData, sellPrice: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>Mã SKU</label>
                  <input
                    type="text"
                    placeholder="Tự động tạo nếu trống"
                    value={formData.skuCode}
                    onChange={e => setFormData({ ...formData, skuCode: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={formData.isSellable}
                      onChange={e => setFormData({ ...formData, isSellable: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: '#16a34a' }}
                    />
                    Cho phép bán trực tiếp trên POS
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={formData.isManageQuantity}
                      onChange={e => setFormData({ ...formData, isManageQuantity: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: '#16a34a' }}
                    />
                    Quản lý tồn kho
                  </label>
                </div>
              </div>
            </div>

            {/* TỒN KHO & ĐỊNH MỨC */}
            {formData.isManageQuantity && (
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>Tồn kho tối thiểu</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStorage}
                    onChange={e => setFormData({ ...formData, minStorage: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>Tồn kho tối đa</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxStorage}
                    onChange={e => setFormData({ ...formData, maxStorage: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
              </div>
            )}

            {/* ĐƠN VỊ QUY ĐỔI */}
            <UnitConversionBuilder
              unitConversions={formData.unitConversions}
              setUnitConversions={ucs => setFormData({ ...formData, unitConversions: ucs })}
              units={units}
              onOpenAddUnit={onOpenAddUnit}
              notifyError={notifyError}
            />

            {/* MÔ TẢ */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>Mô tả sản phẩm</label>
              <textarea
                rows={3}
                placeholder="Nhập mô tả sản phẩm..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f8fafc' }}>
            <button type="button" onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer' }}>
              Hủy
            </button>
            <button type="submit" disabled={loading} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}>
              {loading ? 'Đang lưu...' : editingProduct ? 'Cập Nhật' : 'Tạo Mới món thường'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegularProductModal;
