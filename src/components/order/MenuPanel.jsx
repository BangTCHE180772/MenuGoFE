/**
 * MenuPanel — Panel danh sách món ăn (cột giữa)
 * Lấy dữ liệu trực tiếp từ BE qua API /api/Menu/{menuId}/products
 * Các tab danh mục được tạo động từ trường GroupName trả về từ DB
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { Spin, message } from 'antd';
import { getAllGroups, searchProductsOData } from '../../api/menuApi';
import { getBInventories } from '../../api/binventoryApi';
import { getAvailableQuantities } from '../../api/orderApi';

const formatPrice = (price) =>
  Number(price).toLocaleString('vi-VN') + 'đ';

const MenuPanel = ({ onAddItem, canOrder, branchId }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Tất cả' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGroup, setActiveGroup] = useState('all');
  const [search, setSearch] = useState('');

  const searchTimeout = useRef(null);

  /* ── Fetch sản phẩm từ API ─────────────────────────────────────────────── */
  /* ── Lấy danh sách danh mục lúc ban đầu ────────────────────────────────── */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getAllGroups(branchId);
        if (res.data) {
          const dynamic = res.data.map(g => ({
            id: String(g.id),
            name: g.name
          }));
          setCategories([{ id: 'all', name: 'Tất cả' }, ...dynamic]);
        }
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      }
    };
    fetchCategories();
  }, [branchId]);

  const fetchProducts = async (searchText, groupId) => {
    setLoading(true);
    setError(null);
    try {
      if (branchId) {
        // Lấy theo BInventory chi nhánh, truyền mode = 0 để lấy TẤT CẢ (bao gồm cả Processed)
        const rawBInventory = await getBInventories(branchId, '', '', 0);
        if (Array.isArray(rawBInventory)) {
          const sellable = rawBInventory.filter(
            p => p.type === 'Processed' || p.type === 'Manufactured' || p.type === 'Regular'
          );
          let mappedProducts = sellable.map(p => ({
            id: p.productId, // ProductId
            bInventoryId: p.bInventoryId,
            name: p.name,
            sellPrice: p.sellPrice || 0,
            description: p.description || '',
            groupId: null,
            groupName: p.groupName || 'Khác',
            imageLink: p.imageLink || ''
          }));

          // Lọc tìm kiếm
          if (searchText.trim()) {
            const q = searchText.toLowerCase().trim();
            mappedProducts = mappedProducts.filter(
              p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
            );
          }

          // Filter by category
          if (groupId && groupId !== 'all') {
            const selectedCat = categories.find(c => c.id === String(groupId));
            if (selectedCat) {
              const catName = selectedCat.name.toLowerCase();
              mappedProducts = mappedProducts.filter(
                p => p.groupName.toLowerCase() === catName
              );
            }
          }

          // Fetch Available Quantities
          try {
            const productIds = mappedProducts.map(p => p.id);
            if (productIds.length > 0) {
              const qtyRes = await getAvailableQuantities(branchId, productIds);
              const qtyMap = qtyRes.data || {};
              mappedProducts = mappedProducts.map(p => ({
                ...p,
                availableQuantity: qtyMap[p.id] !== undefined ? qtyMap[p.id] : 999999
              }));
            }
          } catch (qtyErr) {
            console.error('Lỗi lấy số lượng khả dụng:', qtyErr);
            mappedProducts = mappedProducts.map(p => ({ ...p, availableQuantity: 999999 }));
          }

          setProducts(mappedProducts);
        } else {
          setProducts([]);
        }
      } else {
        // Fallback sang OData cũ nếu chưa xác định được branchId
        const res = await searchProductsOData(searchText, groupId);
        if (res && res.value) {
          const mappedProducts = res.value.map(p => ({
            id: p.Id,
            name: p.Name,
            sellPrice: p.SellPrice,
            description: p.Description,
            groupId: p.GroupId,
            groupName: p.Group ? p.Group.Name : 'Khác',
            imageLink: p.Image ? p.Image.ImageLink : ''
          }));
          setProducts(mappedProducts);
        } else {
          setProducts([]);
        }
      }
    } catch (err) {
      console.error('Lỗi tải thực đơn:', err);
      setError('Không thể tải thực đơn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchProducts(search, activeGroup);
    }, 500);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, activeGroup, branchId, categories]);

  /* ── Loading state ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <section className="pos-menu-panel">
        <div className="pos-menu-loading">
          <Spin size="large" tip="Đang tải thực đơn..." />
        </div>
      </section>
    );
  }

  /* ── Error state ───────────────────────────────────────────────────────── */
  if (error) {
    return (
      <section className="pos-menu-panel">
        <div className="pos-menu-error">
          <span></span>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pos-menu-panel">
      {/* Search */}
      <div className="pos-menu-header">
        <div className="pos-menu-search-wrap">
          <span className="pos-menu-search-icon"></span>
          <input
            className="pos-menu-search"
            placeholder="Tìm món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="pos-menu-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <span className="pos-menu-count">{products.length} món</span>
      </div>

      {/* Category Tabs — tạo động từ DB */}
      <div className="pos-menu-cats">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`pos-cat-btn ${activeGroup === cat.id ? 'pos-cat-btn--active' : ''}`}
            onClick={() => setActiveGroup(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Item Grid — wrapped to allow overlay */}
      <div className="pos-menu-grid-wrap">
        <div className="pos-menu-grid">
          {products.map((item) => (
            <button
              key={item.id}
              className={`pos-menu-item ${canOrder && item.availableQuantity > 0 ? 'pos-menu-item--clickable' : ''}`}
              onClick={() => canOrder && item.availableQuantity > 0 && onAddItem({
                id: item.id,
                name: item.name,
                price: Number(item.sellPrice),
                desc: item.description,
                category: item.groupName,
              })}
              disabled={!canOrder || item.availableQuantity <= 0}
              title={!canOrder ? 'Chọn bàn Có khách để gọi món' : (item.availableQuantity <= 0 ? 'Hết hàng' : `Thêm ${item.name}`)}
              style={{ opacity: item.availableQuantity <= 0 ? 0.6 : 1 }}
            >
              <div style={{ 
                height: '70px', 
                width: '70px', 
                minWidth: '70px', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #f3f4f6',
                background: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                {item.imageLink ? (
                  <img 
                    src={item.imageLink} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; 
                    }}
                  />
                ) : (
                  <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80" 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                )}
              </div>
              <div className="pos-menu-item-info">
                <div className="pos-menu-item-name">{item.name}</div>
                <div className="pos-menu-item-desc">{item.description}</div>
                {item.availableQuantity < 999999 && (
                  <div style={{ fontSize: '11px', color: item.availableQuantity > 0 ? '#10b981' : '#ef4444', fontWeight: '500', marginTop: '2px', marginBottom: '2px' }}>
                    {item.availableQuantity > 0 ? `Còn lại: ${item.availableQuantity}` : 'Hết hàng'}
                  </div>
                )}
                <div className="pos-menu-item-tag">{item.groupName}</div>
              </div>
              <div className="pos-menu-item-price">{formatPrice(item.sellPrice)}</div>
              <div className="pos-menu-item-add">+</div>
            </button>
          ))}

          {products.length === 0 && (
            <div className="pos-menu-no-result">
              <span></span>
              <p>Không tìm thấy món phù hợp</p>
            </div>
          )}
        </div>

        {/* Overlay khi bàn không phải Có khách */}
        {!canOrder && (
          <div className="pos-menu-overlay">
            <div className="pos-menu-overlay-card">
              <div className="pos-menu-overlay-icon">🪑</div>
              <p className="pos-menu-overlay-title">Chưa thể gọi món</p>
              <p className="pos-menu-overlay-sub">
                Chỉ có thể order khi bàn ở trạng thái<br />
                <strong style={{ color: '#f97316' }}>Có khách</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuPanel;
