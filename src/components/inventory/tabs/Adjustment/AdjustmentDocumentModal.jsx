import React, { useState, useEffect } from 'react';
import { CloseOutlined, SearchOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  createCostAdjustmentPending,
  createCostAdjustmentCompleted,
  updateCostAdjustmentPending,
  completeCostAdjustmentDocument,
  deleteCostAdjustmentPendingDocument,
  getCostAdjustmentById
} from '../../../../api/documentApi';

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

const AdjustmentDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = [],
  editDocumentId = null
}) => {
  const [loading, setLoading] = useState(false);
  const [docCode, setDocCode] = useState('');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open) {
      if (editDocumentId) {
        setLoading(true);
        getCostAdjustmentById(editDocumentId)
          .then((res) => {
            if (res) {
              setDocCode(res.code || '');
              setNote(res.note || '');
              const mapDetails = (res.details || []).map((d) => ({
                id: d.bInventoryId,
                code: d.code || d.productCode || `SP${d.bInventoryId}`,
                name: d.productName || d.bInventoryName || 'Sản phẩm',
                currentCost: d.unitPrice || 0,
                newAvgCost: d.newAvgCost || d.unitPrice || 0,
                reason: d.note || ''
              }));
              setItems(mapDetails);
            }
          })
          .catch((err) => {
            console.error('Lỗi khi tải chi tiết điều chỉnh giá vốn:', err);
            showToast('Không thể tải chi tiết phiếu điều chỉnh giá vốn', 'error');
          })
          .finally(() => setLoading(false));
      } else {
        setDocCode(`PDC${Date.now().toString().slice(-6)}`);
        setNote('');
        setSearchQuery('');
        setItems([]);
      }
    }
  }, [open, editDocumentId]);

  if (!open) return null;

  const handleAddItem = (prod) => {
    if (items.some((i) => i.id === prod.id)) return;
    setItems((prev) => [
      ...prev,
      {
        id: prod.id,
        code: prod.code || `SP${prod.id}`,
        name: prod.name || prod.title,
        currentCost: prod.costPrice || prod.avgCost || 0,
        newAvgCost: prod.costPrice || prod.avgCost || 0,
        reason: 'Điều chỉnh giá vốn'
      }
    ]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCostChange = (id, newCost) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, newAvgCost: Math.max(0, Number(newCost) || 0) } : item))
    );
  };

  const handleSubmit = async (isDraft = false) => {
    if (items.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 sản phẩm để điều chỉnh giá vốn.', 'error');
      return;
    }

    setLoading(true);
    try {
      const dto = {
        branchId: Number(branchId),
        orderDate: new Date().toISOString(),
        note: note || '',
        details: items.map((item) => ({
          bInventoryId: Number(item.id),
          newAvgCost: Number(item.newAvgCost),
          note: item.reason || ''
        }))
      };

      if (editDocumentId) {
        if (isDraft) {
          await updateCostAdjustmentPending(editDocumentId, dto);
          showToast('Cập nhật phiếu điều chỉnh giá vốn nháp thành công!');
        } else {
          await updateCostAdjustmentPending(editDocumentId, dto);
          await completeCostAdjustmentDocument(editDocumentId);
          showToast('Hoàn thành phiếu điều chỉnh giá vốn thành công!');
        }
      } else {
        if (isDraft) {
          await createCostAdjustmentPending(dto);
          showToast('Lưu tạm phiếu điều chỉnh giá vốn thành công!');
        } else {
          await createCostAdjustmentCompleted(dto);
          showToast('Tạo và Hoàn thành phiếu điều chỉnh giá vốn thành công!');
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu phiếu điều chỉnh giá vốn:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.title || err.message || 'Lỗi khi lưu phiếu.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPending = async () => {
    if (!editDocumentId) return;
    if (!window.confirm('Bạn có chắc chắn muốn hủy phiếu điều chỉnh giá vốn nháp này?')) return;
    setLoading(true);
    try {
      await deleteCostAdjustmentPendingDocument(editDocumentId, 'Hủy phiếu nháp từ giao diện');
      showToast('Đã chuyển phiếu điều chỉnh giá vốn sang trạng thái Canceled!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Không thể hủy phiếu nháp', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!p) return false;
    const rawType = p.type ?? p.productType ?? p.product?.type;
    const typeStr = String(rawType ?? '').toLowerCase();
    if (typeStr === 'processed' || rawType === 1) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 780,
          background: '#ffffff',
          borderRadius: 10,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Tạo phiếu điều chỉnh giá vốn</div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontSize: 14 }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
            {/* FORM META FIELDS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Mã phiếu điều chỉnh
                </label>
                <input
                  type="text"
                  value={docCode}
                  onChange={(e) => setDocCode(e.target.value)}
                  placeholder="Mã tự động"
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '0 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú điều chỉnh..."
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '0 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* PRODUCT SEARCH & SELECTION */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Chọn mặt hàng / nguyên liệu cần điều chỉnh
              </label>
              <div style={{ position: 'relative' }}>
                <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm để thêm vào phiếu..."
                  style={{
                    width: '100%',
                    height: 34,
                    paddingLeft: 30,
                    paddingRight: 10,
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none'
                  }}
                />
              </div>

              {/* SEARCH DROPDOWN SUGGESTIONS */}
              {searchQuery && filteredProducts.length > 0 && (
                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    background: '#ffffff',
                    maxHeight: 140,
                    overflowY: 'auto',
                    marginTop: 4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        handleAddItem(p);
                        setSearchQuery('');
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        justify: 'space-between',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.name} ({p.code})</span>
                      <span style={{ color: '#2563eb' }}>Tồn: {p.stock || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ADJUSTMENT ITEMS TABLE */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Tên mặt hàng</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Giá vốn hiện tại (đ)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Giá vốn mới (đ)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Chênh lệch (đ)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#94a3b8', fontSize: 11.5 }}>
                        Chưa chọn mặt hàng nào để điều chỉnh giá vốn
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const diff = Number(item.newAvgCost) - Number(item.currentCost);
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{item.name}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>
                            {Number(item.currentCost || 0).toLocaleString('vi-VN')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min={0}
                              value={item.newAvgCost}
                              onChange={(e) => handleCostChange(item.id, e.target.value)}
                              style={{
                                width: 110,
                                height: 28,
                                padding: '0 6px',
                                fontSize: 12,
                                textAlign: 'right',
                                borderRadius: 4,
                                border: '1px solid #cbd5e1',
                                outline: 'none'
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: diff < 0 ? '#ef4444' : (diff > 0 ? '#10b981' : '#64748b') }}>
                            {diff > 0 ? `+${diff.toLocaleString('vi-VN')}` : diff.toLocaleString('vi-VN')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
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

          {/* MODAL FOOTER */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justify: 'flex-end',
              gap: 8,
              background: '#f8fafc'
            }}
          >
            {editDocumentId && (
              <button
                type="button"
                disabled={loading}
                onClick={handleCancelPending}
                style={{
                  height: 32,
                  padding: '0 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: '1px solid #dc2626',
                  background: '#ffffff',
                  color: '#dc2626',
                  cursor: 'pointer'
                }}
              >
                Hủy phiếu nháp
              </button>
            )}
            <button
              type="button"
              disabled={loading || items.length === 0}
              onClick={() => handleSubmit(true)}
              style={{
                height: 32,
                padding: '0 14px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: '1px solid #e8442a',
                background: '#ffffff',
                color: '#e8442a',
                cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Lưu tạm
            </button>
            <button
              type="button"
              disabled={loading || items.length === 0}
              onClick={() => handleSubmit(false)}
              style={{
                height: 32,
                padding: '0 16px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                background: loading || items.length === 0 ? '#cbd5e1' : '#e8442a',
                color: '#ffffff',
                cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              HOÀN THÀNH
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustmentDocumentModal;
