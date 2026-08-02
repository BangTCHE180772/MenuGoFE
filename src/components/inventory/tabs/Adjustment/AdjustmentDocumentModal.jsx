import React, { useState, useEffect } from 'react';
import { CloseOutlined, SearchOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { createCheckDocument } from '../../../../api/documentApi';

const AdjustmentDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = []
}) => {
  const [loading, setLoading] = useState(false);
  const [docCode, setDocCode] = useState('');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open) {
      setDocCode(`PDC${Date.now().toString().slice(-6)}`);
      setNote('');
      setSearchQuery('');
      setItems([]);
    }
  }, [open]);

  if (!open) return null;

  const handleAddItem = (prod) => {
    if (items.some((i) => i.id === prod.id)) return;
    setItems((prev) => [
      ...prev,
      {
        id: prod.id,
        code: prod.code || `SP${prod.id}`,
        name: prod.name || prod.title,
        currentStock: prod.stock || 10,
        adjustedStock: prod.stock || 10,
        reason: 'Điều chỉnh kiểm kê'
      }
    ]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleStockChange = (id, newQty) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, adjustedStock: Math.max(0, newQty) } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        branchId: Number(branchId),
        code: docCode,
        note: note || 'Phiếu điều chỉnh kho',
        type: 5,
        details: items.map((item) => ({
          bInventoryId: item.id,
          systemQuantity: item.currentStock,
          actualQuantity: item.adjustedStock,
          note: item.reason
        }))
      };
      await createCheckDocument(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi tạo phiếu điều chỉnh:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tồn hiện tại</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tồn thực tế mới</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Chênh lệch</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#94a3b8', fontSize: 11.5 }}>
                        Chưa chọn mặt hàng nào để điều chỉnh
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const diff = Number(item.adjustedStock) - Number(item.currentStock);
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{item.name}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{item.currentStock}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min={0}
                              value={item.adjustedStock}
                              onChange={(e) => handleStockChange(item.id, Number(e.target.value))}
                              style={{
                                width: 70,
                                height: 28,
                                padding: '0 6px',
                                fontSize: 12,
                                textAlign: 'center',
                                borderRadius: 4,
                                border: '1px solid #cbd5e1',
                                outline: 'none'
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: diff < 0 ? '#ef4444' : (diff > 0 ? '#10b981' : '#64748b') }}>
                            {diff > 0 ? `+${diff}` : diff}
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
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 32,
                padding: '0 14px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              style={{
                height: 32,
                padding: '0 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                background: loading || items.length === 0 ? '#cbd5e1' : '#e8442a',
                color: '#ffffff',
                cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Đang lưu...' : 'Lưu phiếu điều chỉnh giá vốn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustmentDocumentModal;
