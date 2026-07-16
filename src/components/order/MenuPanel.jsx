/**
 * MenuPanel — Panel danh sách món ăn (cột giữa)
 * Lấy dữ liệu trực tiếp từ BE qua API /api/Menu/{menuId}/products
 * Các tab danh mục được tạo động từ trường GroupName trả về từ DB
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { Spin, message } from 'antd';
import { getAllGroups, searchProductsOData } from '../../api/menuApi';

const formatPrice = (price) =>
  Number(price).toLocaleString('vi-VN') + 'đ';

const MenuPanel = ({ onAddItem, canOrder }) => {
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
        const res = await getAllGroups();
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
  }, []);

  const fetchProducts = async (searchText, groupId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchProductsOData(searchText, groupId);
      if (res && res.value) {
        const mappedProducts = res.value.map(p => ({
          id: p.Id,
          name: p.Name,
          sellPrice: p.SellPrice,
          description: p.Description,
          groupId: p.GroupId,
          groupName: p.Group ? p.Group.Name : 'Khác'
        }));
        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Lỗi tải thực đơn (OData):', err);
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
  }, [search, activeGroup]);

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
              className={`pos-menu-item ${canOrder ? 'pos-menu-item--clickable' : ''}`}
              onClick={() => canOrder && onAddItem({
                id: item.id,
                name: item.name,
                price: Number(item.sellPrice),
                desc: item.description,
                category: item.groupName,
              })}
              disabled={!canOrder}
              title={canOrder ? `Thêm ${item.name}` : 'Chọn bàn Có khách để gọi món'}
            >
              <div className="pos-menu-item-emoji"></div>
              <div className="pos-menu-item-info">
                <div className="pos-menu-item-name">{item.name}</div>
                <div className="pos-menu-item-desc">{item.description}</div>
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
