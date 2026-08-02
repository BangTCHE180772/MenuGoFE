import React, { useState } from 'react';
import { SearchOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

const RecipeBuilder = ({
  recipe = [],
  setRecipe,
  products = [],
  units = [],
  currentProductId = null,
  allowedProductTypes = null, // Array of allowed types (e.g. ['Regular', 'Ingredient', 'Processed', 'Manufactured'])
  notifyError,
}) => {
  const [searchText, setSearchText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Map units for quick lookup
  const unitMap = new Map(units.map(u => [u.id, u.name]));

  // Filter candidates for search dropdown
  const candidates = products.filter(p => {
    // Exclude current product to prevent self reference
    if (currentProductId && p.id === currentProductId) return false;

    // Filter by allowed product types (e.g. no Tools)
    if (allowedProductTypes && allowedProductTypes.length > 0) {
      const pType = p.productType || p.type;
      if (!allowedProductTypes.includes(pType)) return false;
    }

    // Exclude already added ingredients
    if (recipe.some(r => r.productId === p.id)) return false;

    // Filter by search text
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      const nameMatch = p.name && p.name.toLowerCase().includes(query);
      const codeMatch = p.skuCode && p.skuCode.toLowerCase().includes(query);
      return nameMatch || codeMatch;
    }

    return true;
  });

  const handleAddIngredient = (item) => {
    setRecipe(prev => [
      ...prev,
      { productId: item.id, quantity: 1 }
    ]);
    setSearchText('');
    setIsDropdownOpen(false);
  };

  const handleQuantityChange = (index, val) => {
    setRecipe(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: val };
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setRecipe(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
      {/* HEADER TITLE */}
      <div style={{ marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
          Thành phần nguyên liệu
        </h4>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          Thêm công thức để tự động trừ tồn và tính giá vốn dựa trên nguyên liệu
        </div>
      </div>

      {/* SEARCH BAR WITH DROPDOWN */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 24,
            padding: '8px 14px',
            gap: 8,
          }}
        >
          <SearchOutlined style={{ color: '#94a3b8', fontSize: 16 }} />
          <input
            type="text"
            placeholder="Thêm hàng thành phần / nguyên liệu..."
            value={searchText}
            onChange={e => {
              setSearchText(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              flex: 1,
              fontSize: 13,
              color: '#1e293b',
            }}
          />
        </div>

        {/* SEARCH DROPDOWN LIST */}
        {isDropdownOpen && candidates.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: 220,
              overflowY: 'auto',
              zIndex: 100,
            }}
          >
            {candidates.map(c => {
              const baseUnitName = c.baseUnitName || unitMap.get(c.baseUnitId) || '—';
              return (
                <div
                  key={c.id}
                  onClick={() => handleAddIngredient(c)}
                  style={{
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: 13,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
                    {c.skuCode && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>({c.skuCode})</span>}
                  </div>
                  <span style={{ fontSize: 11, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                    Đơn vị: {baseUnitName}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {isDropdownOpen && searchText.trim() && candidates.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              padding: '12px 14px',
              color: '#94a3b8',
              fontSize: 12,
              textAlign: 'center',
              zIndex: 100,
            }}
          >
            Không tìm thấy thành phần hợp lệ
          </div>
        )}
      </div>

      {/* OVERLAY CLICK CLOSER FOR DROPDOWN */}
      {isDropdownOpen && (
        <div
          onClick={() => setIsDropdownOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 90 }}
        />
      )}

      {/* RECIPE TABLE */}
      {recipe.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: 13,
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px dashed #cbd5e1',
          }}
        >
          Chưa có thành phần nào trong công thức. Vui lòng gõ tên nguyên liệu ở thanh tìm kiếm phía trên.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '8px 12px', width: 50, textAlign: 'center' }}>STT</th>
                <th style={{ padding: '8px 12px' }}>Tên món thành phần</th>
                <th style={{ padding: '8px 12px', width: 140, textAlign: 'center' }}>Số lượng</th>
                <th style={{ padding: '8px 12px', width: 110, textAlign: 'center' }}>Đơn vị</th>
                <th style={{ padding: '8px 12px', width: 60, textAlign: 'center' }}>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {recipe.map((item, idx) => {
                const prod = products.find(p => p.id === item.productId);
                const prodName = prod?.name || `Sản phẩm #${item.productId}`;
                const baseUnitName = prod?.baseUnitName || unitMap.get(prod?.baseUnitId) || '—';

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* 1. STT */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                      {idx + 1}
                    </td>

                    {/* 2. TÊN */}
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>
                      {prodName}
                    </td>

                    {/* 3. SỐ LƯỢNG */}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        max="1000000"
                        value={item.quantity}
                        onChange={e => handleQuantityChange(idx, e.target.value)}
                        style={{
                          width: 100,
                          padding: '5px 8px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          fontSize: 13,
                          textAlign: 'center',
                        }}
                      />
                    </td>

                    {/* 4. ĐƠN VỊ BASE UNIT */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#475569', fontWeight: 500 }}>
                      {baseUnitName}
                    </td>

                    {/* 5. THÙNG RÁC ICON */}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 15,
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecipeBuilder;
