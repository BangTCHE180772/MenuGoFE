import React, { useState } from 'react';
import { SearchOutlined, SaveOutlined } from '@ant-design/icons';
import { updateProduct } from '../../api/productApi';

const PriceManagementTab = ({ products = [], groups = [], onRefreshData, notifySuccess, notifyError }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [editedPrices, setEditedPrices] = useState({}); // { productId: { basePrice, costPrice } }
  const [saving, setSaving] = useState(false);

  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGroup = !selectedGroupId || p.groupId === Number(selectedGroupId);
    return matchesSearch && matchesGroup;
  });

  const handlePriceChange = (productId, field, value) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const currentEdit = editedPrices[productId] || {
      basePrice: p.basePrice || 0,
      costPrice: p.costPrice || 0,
    };
    setEditedPrices({
      ...editedPrices,
      [productId]: {
        ...currentEdit,
        [field]: Number(value),
      },
    });
  };

  const handleSavePrices = async () => {
    const changedProductIds = Object.keys(editedPrices);
    if (changedProductIds.length === 0) return;

    setSaving(true);
    try {
      for (const idStr of changedProductIds) {
        const id = Number(idStr);
        const orig = products.find((p) => p.id === id);
        if (orig) {
          const edits = editedPrices[id];
          await updateProduct({
            ...orig,
            basePrice: edits.basePrice !== undefined ? edits.basePrice : orig.basePrice,
            costPrice: edits.costPrice !== undefined ? edits.costPrice : orig.costPrice,
          });
        }
      }
      if (notifySuccess) notifySuccess('Cập nhật bảng giá thành công!');
      setEditedPrices({});
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Lỗi khi cập nhật giá:', err);
      if (notifyError) notifyError('Không thể cập nhật bảng giá.');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(editedPrices).length > 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', overflow: 'hidden' }}>
      {/* FILTER & TOOLBAR */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* SEARCH */}
          <div style={{ position: 'relative', width: 240 }}>
            <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                fontSize: 12,
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                outline: 'none',
                background: '#ffffff',
              }}
            />
          </div>

          {/* GROUP FILTER */}
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              outline: 'none',
              background: '#ffffff',
            }}
          >
            <option value="">-- Tất cả nhóm hàng --</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* SAVE BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasChanges && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ea580c' }}>
              Có {Object.keys(editedPrices).length} sản phẩm thay đổi giá
            </span>
          )}
          <button
            onClick={handleSavePrices}
            disabled={!hasChanges || saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: '#ffffff',
              background: !hasChanges || saving ? '#94a3b8' : '#15803d',
              border: 'none',
              borderRadius: 6,
              cursor: !hasChanges || saving ? 'not-allowed' : 'pointer',
              boxShadow: hasChanges ? '0 1px 3px rgba(21, 128, 61, 0.3)' : 'none',
            }}
          >
            <SaveOutlined style={{ fontSize: 12 }} />
            {saving ? 'Đang lưu...' : 'Lưu bảng giá'}
          </button>
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr
              style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                color: '#475569',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                position: 'sticky',
                top: 0,
                zIndex: 5,
              }}
            >
              <th style={{ padding: '10px 14px', textAlign: 'left', width: 110 }}>Mã hàng</th>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>Tên sản phẩm</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', width: 140 }}>Nhóm hàng</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', width: 160 }}>Giá bán niêm yết (₫)</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', width: 160 }}>Giá vốn nhập (₫)</th>
              <th style={{ padding: '10px 14px', textAlign: 'center', width: 100 }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                  Không tìm thấy sản phẩm nào trong danh sách giá
                </td>
              </tr>
            ) : (
              filteredProducts.map((p, idx) => {
                const edits = editedPrices[p.id] || {};
                const currentBasePrice = edits.basePrice !== undefined ? edits.basePrice : (p.basePrice || 0);
                const currentCostPrice = edits.costPrice !== undefined ? edits.costPrice : (p.costPrice || 0);
                const isModified = edits.basePrice !== undefined || edits.costPrice !== undefined;

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isModified ? '#fffbe7' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                    }}
                  >
                    <td style={{ padding: '8px 14px', fontWeight: 600, color: '#0284c7' }}>
                      {p.code || `SP${String(p.id).padStart(4, '0')}`}
                    </td>
                    <td style={{ padding: '8px 14px', fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                    <td style={{ padding: '8px 14px', color: '#475569' }}>
                      {groupMap.get(p.groupId) || '—'}
                    </td>

                    {/* BASE PRICE INPUT */}
                    <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={currentBasePrice}
                        onChange={(e) => handlePriceChange(p.id, 'basePrice', e.target.value)}
                        style={{
                          width: 130,
                          padding: '4px 8px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#15803d',
                          border: isModified ? '1.5px solid #eab308' : '1px solid #cbd5e1',
                          borderRadius: 4,
                          outline: 'none',
                          textAlign: 'right',
                        }}
                      />
                    </td>

                    {/* COST PRICE INPUT */}
                    <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={currentCostPrice}
                        onChange={(e) => handlePriceChange(p.id, 'costPrice', e.target.value)}
                        style={{
                          width: 130,
                          padding: '4px 8px',
                          fontSize: 12,
                          color: '#475569',
                          border: isModified ? '1.5px solid #eab308' : '1px solid #cbd5e1',
                          borderRadius: 4,
                          outline: 'none',
                          textAlign: 'right',
                        }}
                      />
                    </td>

                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      {isModified ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>Đã sửa</span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#166534' }}>Chuẩn</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceManagementTab;
