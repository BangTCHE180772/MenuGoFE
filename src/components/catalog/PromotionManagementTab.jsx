import React, { useState, useEffect } from 'react';
import { GiftOutlined, SearchOutlined, PlusOutlined, DeleteOutlined, CheckSquareOutlined, StopOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllPromotions, createPromotion, updatePromotion, deletePromotion } from '../../api/promotionApi';
import { getAllProducts } from '../../api/productApi';
import { getAllBranches } from '../../api/branchApi';
import { useAuth, ROLES } from '../../context/AuthContext';
import { Spin, Switch } from 'antd';

const PromotionManagementTab = () => {
  const { hasRole } = useAuth();
  const isOwnerOrAdmin = hasRole(ROLES.OWNER, ROLES.ADMIN);

  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [formValues, setFormValues] = useState({
    name: '',
    discountType: 'Percentage',
    discountValue: 0,
    maxDiscount: 0,
    startDate: dayjs().add(5, 'minute').format('YYYY-MM-DDTHH:mm'),
    endDate: dayjs().add(7, 'day').add(5, 'minute').format('YYYY-MM-DDTHH:mm'),
    scope: 0,
    branchIds: [],
    productIds: [],
    isActive: true,
    hasBeenUsed: false
  });

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const processedPromotions = React.useMemo(() => {
    let list = [...promotions];

    // Filter Branch
    if (filterBranch !== 'All') {
      list = list.filter(p => p.scope === 0 || p.branches?.some(b => b.branchId === Number(filterBranch)));
    }

    // Filter Status
    if (filterStatus !== 'All') {
      list = list.filter(p => p.status === filterStatus);
    }

    // Sort by status priority: Active (1), Upcoming (2), Disabled (3), Expired (4)
    const statusPriority = { 'Active': 1, 'Upcoming': 2, 'Disabled': 3, 'Expired': 4 };
    list.sort((a, b) => {
      const pA = statusPriority[a.status] || 99;
      const pB = statusPriority[b.status] || 99;
      if (pA !== pB) return pA - pB;
      return dayjs(b.createdAt || b.startDate).valueOf() - dayjs(a.createdAt || a.startDate).valueOf();
    });

    return list;
  }, [promotions, filterStatus, filterBranch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [promoRes, prodRes, branchRes] = await Promise.all([
        getAllPromotions(),
        getAllProducts(),
        isOwnerOrAdmin ? getAllBranches() : Promise.resolve({ data: [] })
      ]);
      // API trả về response.data đã unwrap qua axiosInstance
      const promoData = Array.isArray(promoRes) ? promoRes : (promoRes?.data || []);
      setPromotions(promoData);
      const prodData = Array.isArray(prodRes) ? prodRes : (prodRes?.data || []);
      const sellableProducts = prodData.filter(p =>
        p.type === 'Processed' || p.type === 'Regular' || p.type === 'Manufactured'
      );
      setProducts(sellableProducts);
      if (isOwnerOrAdmin) {
        setBranches(branchRes?.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu khuyến mãi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormValues({
      name: '',
      discountType: 'Percentage',
      discountValue: 0,
      maxDiscount: 0,
      startDate: dayjs().add(5, 'minute').format('YYYY-MM-DDTHH:mm'),
      endDate: dayjs().add(7, 'day').add(5, 'minute').format('YYYY-MM-DDTHH:mm'),
      scope: 0,
      branchIds: [],
      productIds: [],
      isActive: true,
      hasBeenUsed: false
    });
    setProductSearch('');
    setEditingId(null);
    setIsCreating(true);
  };

  const handleEdit = (promo) => {
    setFormValues({
      name: promo.name,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscount: promo.maxDiscount || 0,
      startDate: dayjs(promo.startDate).format('YYYY-MM-DDTHH:mm'),
      endDate: dayjs(promo.endDate).format('YYYY-MM-DDTHH:mm'),
      scope: promo.scope,
      branchIds: promo.branches?.map(b => b.branchId) || [],
      productIds: promo.products?.map(p => p.productId) || [],
      isActive: promo.isActive !== false,
      hasBeenUsed: promo.hasBeenUsed || false
    });
    setProductSearch('');
    setEditingId(promo.id);
    setIsCreating(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formValues.name.trim()) return alert('Vui lòng nhập tên khuyến mãi');
    if (formValues.discountValue <= 0) return alert('Mức giảm phải lớn hơn 0');

    if (isOwnerOrAdmin && formValues.scope === 1 && formValues.branchIds.length === 0) {
      return alert('Vui lòng chọn ít nhất 1 chi nhánh');
    }

    const now = dayjs();
    const start = dayjs(formValues.startDate);
    const end = dayjs(formValues.endDate);

    if (start.isAfter(end) || start.isSame(end)) {
      return alert('Thời gian kết thúc phải lớn hơn thời gian bắt đầu');
    }

    if (!editingId && start.isBefore(now.subtract(2, 'minute'))) {
      return alert('Thời gian bắt đầu không được ở trong quá khứ');
    }

    setSaving(true);
    try {
      const payload = {
        name: formValues.name,
        discountType: formValues.discountType,
        discountValue: formValues.discountValue,
        maxDiscount: formValues.maxDiscount,
        startDate: new Date(formValues.startDate).toISOString(),
        endDate: new Date(formValues.endDate).toISOString(),
        isActive: formValues.isActive,
        scope: isOwnerOrAdmin ? formValues.scope : 1,
        productIds: formValues.productIds,
        branchIds: isOwnerOrAdmin && formValues.scope === 1 ? formValues.branchIds : []
      };

      if (editingId) {
        payload.id = editingId;
        await updatePromotion(payload);
        alert('Cập nhật chương trình khuyến mãi thành công!');
      } else {
        await createPromotion(payload);
        alert('Tạo chương trình khuyến mãi thành công!');
      }
      setIsCreating(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu khuyến mãi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;
    try {
      await deletePromotion(id);
      alert('Đã xóa khuyến mãi');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Không thể xóa khuyến mãi');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.skuCode && p.skuCode.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const toggleProductSelection = (productId) => {
    if (formValues.hasBeenUsed) return;
    setFormValues(prev => {
      const isSelected = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: isSelected
          ? prev.productIds.filter(id => id !== productId)
          : [...prev.productIds, productId]
      };
    });
  };

  const selectAllFiltered = () => {
    if (formValues.hasBeenUsed) return;
    setFormValues(prev => {
      const filteredIds = filteredProducts.map(p => p.id);
      const newIds = new Set([...prev.productIds, ...filteredIds]);
      return { ...prev, productIds: Array.from(newIds) };
    });
  };

  const deselectAllFiltered = () => {
    if (formValues.hasBeenUsed) return;
    setFormValues(prev => {
      const filteredIds = new Set(filteredProducts.map(p => p.id));
      return { ...prev, productIds: prev.productIds.filter(id => !filteredIds.has(id)) };
    });
  };

  if (loading && !isCreating) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  /* ── Form tạo KM ─────────────────────────────────────────────────────── */
  if (isCreating) {
    return (
      <div style={{ background: '#ffffff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>{editingId ? 'Cập nhật chương trình khuyến mãi' : 'Tạo chương trình khuyến mãi'}</h3>
          <button onClick={() => { setIsCreating(false); setEditingId(null); }} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Quay lại</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* CỘT TRÁI: Thông tin KM */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            {formValues.hasBeenUsed && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16, border: '1px solid #f87171' }}>
                <strong>Lưu ý:</strong> Chương trình này đã được khách hàng sử dụng trong giao dịch. Bạn chỉ có thể thay đổi Tên, Ngày kết thúc và Trạng thái.
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Tên chương trình *</label>
              <input type="text" value={formValues.name} onChange={e => setFormValues({ ...formValues, name: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }} placeholder="VD: Giảm giá hè 2024" />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Loại giảm giá</label>
                <select value={formValues.discountType} disabled={formValues.hasBeenUsed} onChange={e => setFormValues({ ...formValues, discountType: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, background: formValues.hasBeenUsed ? '#f1f5f9' : '#fff' }}>
                  <option value="Percentage">Phần trăm (%)</option>
                  <option value="Fixed">Số tiền (VNĐ)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Mức giảm *</label>
                <input type="number" min="0" disabled={formValues.hasBeenUsed} value={formValues.discountValue} onChange={e => setFormValues({ ...formValues, discountValue: Number(e.target.value) })} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, boxSizing: 'border-box', background: formValues.hasBeenUsed ? '#f1f5f9' : '#fff' }} />
              </div>
            </div>

            {formValues.discountType === 'Percentage' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Giảm tối đa (VNĐ)</label>
                <input type="number" min="0" disabled={formValues.hasBeenUsed} value={formValues.maxDiscount} onChange={e => setFormValues({ ...formValues, maxDiscount: Number(e.target.value) })} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, boxSizing: 'border-box', background: formValues.hasBeenUsed ? '#f1f5f9' : '#fff' }} placeholder="0 = Không giới hạn" />
              </div>
            )}

            {/* Thời gian: cùng 1 hàng */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Từ ngày *</label>
                <input type="datetime-local" disabled={formValues.hasBeenUsed} value={formValues.startDate} onChange={e => setFormValues({ ...formValues, startDate: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, boxSizing: 'border-box', background: formValues.hasBeenUsed ? '#f1f5f9' : '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Đến ngày *</label>
                <input type="datetime-local" value={formValues.endDate} onChange={e => setFormValues({ ...formValues, endDate: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>

            {editingId && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa" checked={formValues.isActive} onChange={checked => setFormValues({ ...formValues, isActive: checked })} />
                  Đang hoạt động (Hiển thị cho khách hàng)
                </label>
              </div>
            )}

            {isOwnerOrAdmin && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Phạm vi áp dụng</label>
                <select value={formValues.scope} disabled={formValues.hasBeenUsed} onChange={e => setFormValues({ ...formValues, scope: Number(e.target.value) })} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, marginBottom: 8, background: formValues.hasBeenUsed ? '#f1f5f9' : '#fff' }}>
                  <option value={0}>Tất cả chi nhánh</option>
                  <option value={1}>Chi nhánh cụ thể</option>
                </select>

                {formValues.scope === 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8, background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0', opacity: formValues.hasBeenUsed ? 0.6 : 1 }}>
                    {branches.map(b => (
                      <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: formValues.hasBeenUsed ? 'not-allowed' : 'pointer' }}>
                        <input type="checkbox" disabled={formValues.hasBeenUsed} checked={formValues.branchIds.includes(b.id)} onChange={e => {
                          const checked = e.target.checked;
                          setFormValues(prev => ({
                            ...prev,
                            branchIds: checked ? [...prev.branchIds, b.id] : prev.branchIds.filter(id => id !== b.id)
                          }));
                        }} /> {b.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button onClick={handleSave} disabled={saving} style={{ background: '#ea580c', color: 'white', padding: '8px 20px', borderRadius: 6, border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                {saving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Lưu chương trình')}
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: Chọn sản phẩm */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', maxHeight: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Sản phẩm áp dụng ({formValues.productIds.length} đã chọn)</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={selectAllFiltered} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CheckSquareOutlined /> Chọn hết
                </button>
                <button onClick={deselectAllFiltered} style={{ background: '#fef2f2', color: '#b91c1c', border: 'none', padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <StopOutlined /> Bỏ hết
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6 }}>
              <SearchOutlined style={{ color: '#94a3b8', marginRight: 6 }} />
              <input
                type="text"
                placeholder="Tìm kiếm món ăn..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13 }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
              {filteredProducts.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Không tìm thấy sản phẩm</div>
              ) : (
                filteredProducts.map(p => (
                  <label key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                    background: formValues.productIds.includes(p.id) ? '#fff7ed' : 'transparent',
                    opacity: formValues.hasBeenUsed ? 0.6 : 1
                  }}>
                    <input type="checkbox" checked={formValues.productIds.includes(p.id)} disabled={formValues.hasBeenUsed} onChange={() => toggleProductSelection(p.id)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{Number(p.sellPrice || 0).toLocaleString('vi-VN')}đ</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Danh sách KM ─────────────────────────────────────────────────────── */
  return (
    <div style={{ background: '#ffffff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Chương trình khuyến mãi</h3>
        <button onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
          <PlusOutlined /> Thêm chương trình
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Tình trạng:</span>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}>
            <option value="All">Tất cả</option>
            <option value="Active">Đang diễn ra</option>
            <option value="Upcoming">Sắp tới</option>
            <option value="Disabled">Đã khóa (Tắt)</option>
            <option value="Expired">Đã kết thúc</option>
          </select>
        </div>

        {isOwnerOrAdmin && branches.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Chi nhánh:</span>
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}>
              <option value="All">Tất cả chi nhánh</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#475569' }}>Tên chương trình</th>
              <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#475569' }}>Mức giảm</th>
              <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#475569' }}>Thời gian</th>
              <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#475569' }}>Tình trạng</th>
              <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#475569' }}>Số món</th>
              <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {processedPromotions.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chưa có chương trình khuyến mãi nào</td></tr>
            ) : (
              processedPromotions.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GiftOutlined style={{ color: '#ea580c', fontSize: 12 }} />
                      {p.name}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>
                    {p.discountType === 'Percentage' ? `${p.discountValue}%` : `${Number(p.discountValue).toLocaleString('vi-VN')}đ`}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>
                    {dayjs(p.startDate).format('DD/MM/YY HH:mm')} → {dayjs(p.endDate).format('DD/MM/YY HH:mm')}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: p.status === 'Active' ? '#dcfce7' : p.status === 'Upcoming' ? '#fef9c3' : '#f1f5f9',
                      color: p.status === 'Active' ? '#166534' : p.status === 'Upcoming' ? '#854d0e' : '#475569'
                    }}>
                      {p.status === 'Active' ? 'Đang diễn ra' : p.status === 'Upcoming' ? 'Sắp tới' : p.status === 'Disabled' ? 'Đã tắt' : 'Đã kết thúc'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>
                    {p.products?.length || 0} món
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    {p.status !== 'Expired' ? (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14 }}>
                          <EditOutlined />
                        </button>
                        <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>
                          <DeleteOutlined />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromotionManagementTab;
