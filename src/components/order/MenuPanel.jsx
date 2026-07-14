/**
 * MenuPanel — Panel danh sách món ăn (cột giữa)
 * Lấy dữ liệu trực tiếp từ BE qua API /api/Menu/{menuId}/products
 * Các tab danh mục được tạo động từ trường GroupName trả về từ DB
 */
import { useState, useEffect, useMemo } from 'react';
import { Spin } from 'antd';
import { getMenuProducts } from '../../api/menuApi';

// ID của menu chính — khớp với seed data: Menu Id = 1 "Thực đơn chính"
const DEFAULT_MENU_ID = 1;

const formatPrice = (price) =>
  Number(price).toLocaleString('vi-VN') + 'đ';

const MenuPanel = ({ onAddItem, canOrder }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGroup, setActiveGroup] = useState('all');
  const [search, setSearch] = useState('');

  /* ── Fetch sản phẩm từ API ─────────────────────────────────────────────── */
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMenuProducts(DEFAULT_MENU_ID);
        setProducts(res.data || []);
      } catch (err) {
        console.error('Lỗi tải menu:', err);
        setError('Không thể tải thực đơn. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /* ── Tạo danh sách danh mục động từ DB ────────────────────────────────── */
  const categories = useMemo(() => {
    const groupMap = new Map();
    products.forEach((p) => {
      if (p.groupId && !groupMap.has(p.groupId)) {
        groupMap.set(p.groupId, p.groupName || 'Khác');
      }
    });
    const dynamic = Array.from(groupMap.entries()).map(([id, name]) => ({
      id: String(id),
      name,
    }));
    return [{ id: 'all', name: 'Tất cả' }, ...dynamic];
  }, [products]);

  /* ── Lọc sản phẩm theo danh mục + tìm kiếm ────────────────────────────── */
  const filteredItems = useMemo(() => {
    return products.filter((p) => {
      const matchGroup =
        activeGroup === 'all' || String(p.groupId) === activeGroup;
      const matchSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [products, activeGroup, search]);

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
        <span className="pos-menu-count">{filteredItems.length} món</span>
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
          {filteredItems.map((item) => (
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

          {filteredItems.length === 0 && (
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
