import React, { useState, useEffect } from 'react';
import { CloseOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { createReturnDocument } from '../../../../api/documentApi';

const ImportReturnDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = [],
  partners = []
}) => {
  const [loading, setLoading] = useState(false);
  const [docCode, setDocCode] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open) {
      setDocCode(`THN${Date.now().toString().slice(-6)}`);
      setPartnerId('');
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
        returnQty: 1,
        unitPrice: prod.price || 30000
      }
    ]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id, field, val) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: Math.max(0, val) } : item))
    );
  };

  const totalValue = items.reduce((acc, item) => acc + item.returnQty * item.unitPrice, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        branchId: Number(branchId),
        code: docCode,
        partnerId: partnerId ? Number(partnerId) : null,
        note: note || 'Phiếu trả hàng nhập',
        type: 4,
        details: items.map((item) => ({
          bInventoryId: item.id,
          quantity: item.returnQty,
          unitPrice: item.unitPrice
        }))
      };
      await createReturnDocument(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi tạo phiếu trả hàng nhập:', err);
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
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Tạo phiếu trả hàng nhập</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Mã phiếu trả
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
                  Nhà cung cấp / Đối tác
                </label>
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '0 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú trả hàng..."
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
                Chọn mặt hàng trả lại nhà cung cấp
              </label>
              <div style={{ position: 'relative' }}>
                <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm để thêm vào phiếu trả..."
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
                      <span style={{ color: '#ea580c' }}>Giá: {(p.price || 30000).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RETURN ITEMS TABLE */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Mặt hàng</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>SL trả</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Đơn giá trả (VNĐ)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thành tiền (VNĐ)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#94a3b8', fontSize: 11.5 }}>
                        Chưa chọn mặt hàng nào để trả
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{item.name}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min={1}
                            value={item.returnQty}
                            onChange={(e) => handleItemChange(item.id, 'returnQty', Number(e.target.value))}
                            style={{
                              width: 60,
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
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                            style={{
                              width: 100,
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
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#ea580c' }}>
                          {(item.returnQty * item.unitPrice).toLocaleString('vi-VN')}đ
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
                    ))
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
              justify: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Tổng tiền trả: <span style={{ color: '#ea580c' }}>{totalValue.toLocaleString('vi-VN')}đ</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
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
                {loading ? 'Đang lưu...' : 'Lưu phiếu trả hàng'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportReturnDocumentModal;
