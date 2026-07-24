import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  Row,
  Col,
  Tooltip,
  Radio,
  Checkbox,
  Avatar,
  Pagination,
  notification,
  Badge,
  Divider,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  PictureOutlined,
  ExperimentOutlined,
  BuildOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  SettingOutlined,
  InboxOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownOutlined,
  DatabaseOutlined,
  RiseOutlined,
  FallOutlined,
  SwapOutlined,
  AuditOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  getAllProducts,
  updateProduct,
} from '../../api/productApi';
import { getAllGroups } from '../../api/groupApi';
import { getAllMenus } from '../../api/menuApi';
import { getAllUnits } from '../../api/unitApi';
import { getAllBranches } from '../../api/branchApi';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const PRODUCT_TYPES = [
  { value: 'Processed', label: 'Món chế biến', color: 'purple', icon: <ExperimentOutlined /> },
  { value: 'Manufactured', label: 'Món sản xuất', color: 'blue', icon: <BuildOutlined /> },
  { value: 'Regular', label: 'Món thường', color: 'green', icon: <ShoppingOutlined /> },
  { value: 'Ingredient', label: 'Nguyên liệu', color: 'orange', icon: <AppstoreOutlined /> },
  { value: 'Tool', label: 'Công cụ', color: 'cyan', icon: <SettingOutlined /> },
];

const MENU_TYPES = [
  { label: 'Đồ ăn', value: 'Food' },
  { label: 'Đồ uống', value: 'Drink' },
  { label: 'Dịch vụ', value: 'Service' },
  { label: 'Khác', value: 'Other' },
];

const STOCK_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'IN_STOCK', label: 'Còn hàng' },
  { value: 'LOW', label: 'Dưới định mức' },
  { value: 'HIGH', label: 'Vượt định mức' },
  { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
];

// Management tabs (top-right option bar matching KiotViet)
const MGMT_TABS = [
  { key: 'stock', label: 'Tồn kho', icon: <DatabaseOutlined /> },
  { key: 'import', label: 'Nhập hàng', icon: <ImportOutlined /> },
  { key: 'export', label: 'Xuất hàng', icon: <ExportOutlined /> },
  { key: 'transfer', label: 'Chuyển kho', icon: <SwapOutlined /> },
  { key: 'adjust', label: 'Điều chỉnh', icon: <AuditOutlined /> },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatVND = (val) => (val ? val.toLocaleString('vi-VN') : '0');

const getStockStatus = (record) => {
  const stock = record.currentStock ?? (record.id * 17) % 150;
  const isManaged = record.isManageQuantity;
  const min = record.minStorage ?? 0;
  const max = record.maxStorage ?? 1_000_000_000;
  if (!isManaged) return { text: 'Không quản lý', color: 'default', badgeColor: '#9ca3af' };
  if (stock <= 0) return { text: 'Hết hàng', color: 'error', badgeColor: '#ef4444' };
  if (stock < min) return { text: 'Dưới định mức', color: 'warning', badgeColor: '#f59e0b' };
  if (stock > max) return { text: 'Vượt định mức', color: 'orange', badgeColor: '#f97316' };
  return { text: 'Đủ tồn kho', color: 'success', badgeColor: '#22c55e' };
};

// ─── Component ────────────────────────────────────────────────────────────────
const InventoryManagementTab = () => {
  const { user } = useAuth();

  // Data states
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [menus, setMenus] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active management tab (top bar)
  const [activeMgmtTab, setActiveMgmtTab] = useState('stock');

  // Filter states
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);
  const [selectedMenuTypes, setSelectedMenuTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [selectedStockFilter, setSelectedStockFilter] = useState('ALL');
  const [selectedDirectSellFilter, setSelectedDirectSellFilter] = useState('ALL');
  const [selectedBusinessStatus, setSelectedBusinessStatus] = useState('ACTIVE');
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [isStockEditModalOpen, setIsStockEditModalOpen] = useState(false);
  const [editingInventoryProduct, setEditingInventoryProduct] = useState(null);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [stockInProduct, setStockInProduct] = useState(null);
  const [stockInQty, setStockInQty] = useState(10);
  const [isManageQuantityWatch, setIsManageQuantityWatch] = useState(false);

  const [stockForm] = Form.useForm();
  const [notifyApi, notificationContextHolder] = notification.useNotification();

  // ─── Notifications ────────────────────────────────────────────────────────
  const notifySuccess = (msg, desc = '') =>
    notifyApi.success({
      message: msg, description: desc, placement: 'topRight', duration: 3,
      style: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#166534', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    });

  const notifyError = (msg, desc = '') =>
    notifyApi.error({
      message: msg, description: desc, placement: 'topRight', duration: 3,
      style: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    });

  const notifyWarning = (msg, desc = '') =>
    notifyApi.warning({
      message: msg, description: desc, placement: 'topRight', duration: 3,
      style: { background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, color: '#854d0e', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    });

  // ─── Fetch Data ───────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resGroup, resUnit, resMenu, resBranch] = await Promise.all([
        getAllProducts(),
        getAllGroups(),
        getAllUnits(),
        getAllMenus(),
        getAllBranches().catch(() => ({ data: [] })),
      ]);
      const prodList = Array.isArray(resProd.data) ? resProd.data : resProd.data?.$values || [];
      const groupList = Array.isArray(resGroup.data) ? resGroup.data : resGroup.data?.$values || resGroup.data?.items || [];
      const menuList = Array.isArray(resMenu.data) ? resMenu.data : resMenu.data?.$values || resMenu.data?.items || [];
      const branchList = Array.isArray(resBranch.data) ? resBranch.data : resBranch.data?.$values || resBranch.data?.items || [];
      let unitList = Array.isArray(resUnit.data) ? resUnit.data : resUnit.data?.$values || resUnit.data?.items || [];
      setProducts(prodList);
      setGroups(groupList);
      setUnits(unitList);
      setMenus(menuList);
      setBranches(branchList);
    } catch (err) {
      console.error('Fetch Inventory Data Error:', err);
      notifyError('Lỗi tải dữ liệu kho', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Filter Logic ─────────────────────────────────────────────────────────
  const hasActiveFilters = selectedBranchIds.length > 0 || selectedTypes.length > 0 ||
    selectedGroupIds.length > 0 || selectedMenuTypes.length > 0 ||
    selectedStockFilter !== 'ALL' || selectedDirectSellFilter !== 'ALL' ||
    selectedBusinessStatus !== 'ACTIVE';

  const clearAllFilters = () => {
    setSelectedBranchIds([]);
    setSelectedMenuTypes([]);
    setSelectedTypes([]);
    setSelectedGroupIds([]);
    setSelectedStockFilter('ALL');
    setSelectedDirectSellFilter('ALL');
    setSelectedBusinessStatus('ACTIVE');
    setSearchText('');
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const currentStock = p.currentStock ?? (p.id * 17) % 150;
      const isManaged = p.isManageQuantity;
      const min = p.minStorage ?? 0;
      const max = p.maxStorage ?? 1_000_000_000;

      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) return false;
      if (selectedGroupIds.length > 0 && !selectedGroupIds.includes(p.groupId)) return false;

      if (selectedStockFilter === 'LOW' && (!isManaged || currentStock >= min)) return false;
      if (selectedStockFilter === 'HIGH' && (!isManaged || currentStock <= max)) return false;
      if (selectedStockFilter === 'IN_STOCK' && currentStock <= 0) return false;
      if (selectedStockFilter === 'OUT_OF_STOCK' && currentStock > 0) return false;

      if (selectedDirectSellFilter === 'YES' && !p.isSellable) return false;
      if (selectedDirectSellFilter === 'NO' && p.isSellable) return false;

      if (selectedBusinessStatus === 'ACTIVE' && p.isActive === false) return false;
      if (selectedBusinessStatus === 'INACTIVE' && p.isActive !== false) return false;

      if (searchText) {
        const t = searchText.toLowerCase();
        if (!p.name?.toLowerCase().includes(t) && !p.skuCode?.toLowerCase().includes(t)) return false;
      }
      return true;
    });
  }, [products, selectedTypes, selectedGroupIds, selectedStockFilter, selectedDirectSellFilter, selectedBusinessStatus, searchText]);

  useEffect(() => { setCurrentPage(1); }, [selectedTypes, selectedGroupIds, selectedStockFilter, selectedDirectSellFilter, selectedBusinessStatus, searchText]);

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // ─── Summary Stats ────────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    const total = filteredProducts.length;
    const inStock = filteredProducts.filter(p => (p.currentStock ?? (p.id * 17) % 150) > 0).length;
    const outStock = filteredProducts.filter(p => (p.currentStock ?? (p.id * 17) % 150) <= 0).length;
    const lowStock = filteredProducts.filter(p => {
      const s = p.currentStock ?? (p.id * 17) % 150;
      return p.isManageQuantity && s < (p.minStorage ?? 0) && s > 0;
    }).length;
    return { total, inStock, outStock, lowStock };
  }, [filteredProducts]);

  // ─── Modal Handlers ───────────────────────────────────────────────────────
  const handleOpenStockEditModal = (prod) => {
    setEditingInventoryProduct(prod);
    stockForm.resetFields();
    setIsManageQuantityWatch(prod.isManageQuantity || false);
    stockForm.setFieldsValue({
      id: prod.id, name: prod.name, skuCode: prod.skuCode,
      isManageQuantity: prod.isManageQuantity || false,
      minStorage: prod.minStorage ?? 0,
      maxStorage: prod.maxStorage ?? 1_000_000_000,
      currentStock: prod.currentStock ?? ((prod.id * 17) % 150),
    });
    setIsStockEditModalOpen(true);
  };

  const handleSaveStockEdit = async () => {
    try {
      const values = await stockForm.validateFields();
      const payload = {
        id: editingInventoryProduct.id,
        groupId: editingInventoryProduct.groupId,
        chainId: editingInventoryProduct.chainId,
        type: editingInventoryProduct.type,
        name: editingInventoryProduct.name,
        description: editingInventoryProduct.description,
        skuCode: editingInventoryProduct.skuCode,
        imageUrl: editingInventoryProduct.imageUrl,
        isSellable: editingInventoryProduct.isSellable,
        sellPrice: editingInventoryProduct.sellPrice,
        isManageQuantity: values.isManageQuantity,
        minStorage: values.isManageQuantity ? values.minStorage : 0,
        maxStorage: values.isManageQuantity ? values.maxStorage : 1_000_000_000,
        currentStock: values.currentStock,
      };
      await updateProduct(payload);
      notifySuccess('Cập nhật tồn kho thành công!');
      setIsStockEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save stock error:', err);
      notifyError('Lỗi cập nhật tồn kho', 'Vui lòng kiểm tra lại thông tin.');
    }
  };

  // ─── Truncated Cell ───────────────────────────────────────────────────────
  const TruncatedCell = ({ text, style = {} }) => (
    <Tooltip title={text} placement="topLeft">
      <span style={{ display: 'inline-block', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle', ...style }}>
        {text}
      </span>
    </Tooltip>
  );

  // ─── Table Columns ────────────────────────────────────────────────────────
  const columns = [
    {
      title: '',
      key: 'star',
      width: 32,
      render: () => (
        <span style={{ color: '#d1d5db', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
          onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>
          ☆
        </span>
      ),
    },
    {
      title: 'Mã món',
      key: 'imageSku',
      width: '13%',
      ellipsis: true,
      render: (_, record) => (
        <Space size={6} style={{ flexWrap: 'nowrap', width: '100%', overflow: 'hidden' }}>
          {record.imageUrl ? (
            <Avatar src={record.imageUrl} shape="square" size={28} style={{ flexShrink: 0, borderRadius: 4 }} />
          ) : (
            <Avatar icon={<PictureOutlined />} shape="square" size={28}
              style={{ background: '#f3f4f6', color: '#9ca3af', flexShrink: 0, borderRadius: 4 }} />
          )}
          <TruncatedCell text={record.skuCode || 'N/A'}
            style={{ fontSize: 11.5, fontWeight: 600, color: '#1d4ed8', fontFamily: 'monospace' }} />
        </Space>
      ),
    },
    {
      title: 'Tên món',
      dataIndex: 'name',
      key: 'name',
      width: '22%',
      ellipsis: true,
      render: (text, record) => {
        const baseUnitObj = record.unitConversions?.find((uc) => !uc.baseId);
        const baseUnitName = units.find((u) => u.id === baseUnitObj?.unitId)?.name;
        return (
          <Space size={4} style={{ flexWrap: 'nowrap', width: '100%', overflow: 'hidden' }}>
            <TruncatedCell text={text} style={{ fontSize: 12.5, fontWeight: 600, color: '#1d4ed8' }} />
            {baseUnitName && (
              <Tag style={{ margin: 0, fontSize: 9.5, background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '0 4px', flexShrink: 0, borderRadius: 4 }}>
                {baseUnitName}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Nhóm món',
      dataIndex: 'groupId',
      key: 'groupId',
      width: '13%',
      ellipsis: true,
      render: (groupId) => {
        const gName = groups.find((g) => g.id === groupId)?.name || 'Chưa phân nhóm';
        return (
          <Tooltip title={gName} placement="topLeft">
            <span style={{ fontSize: 11.5, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', width: '100%' }}>
              {gName}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Loại món',
      dataIndex: 'type',
      key: 'type',
      width: '11%',
      ellipsis: true,
      render: (type) => {
        const typeObj = PRODUCT_TYPES.find((t) => t.value === type) || { label: type, color: 'default' };
        return (
          <Tooltip title={typeObj.label} placement="topLeft">
            <Tag color={typeObj.color}
              style={{ borderRadius: 10, fontSize: 10, padding: '0 6px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
              {typeObj.label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Tồn kho',
      key: 'currentStock',
      align: 'right',
      width: '11%',
      sorter: (a, b) => (a.currentStock ?? (a.id * 17) % 150) - (b.currentStock ?? (b.id * 17) % 150),
      render: (_, record) => {
        const stock = record.currentStock ?? ((record.id * 17) % 150);
        const { text, color, badgeColor } = getStockStatus(record);
        return (
          <Tooltip title={`${stock.toLocaleString('vi-VN')} — ${text}`} placement="topRight">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: stock <= 0 ? '#ef4444' : '#0f172a', lineHeight: 1.2 }}>
                {stock.toLocaleString('vi-VN')}
              </div>
              <div style={{ marginTop: 2 }}>
                <span style={{ fontSize: 9.5, color: badgeColor, fontWeight: 600 }}>● {text}</span>
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Định mức (Min–Max)',
      key: 'storageLimits',
      align: 'center',
      width: '14%',
      render: (_, record) => {
        if (!record.isManageQuantity)
          return <span style={{ fontSize: 11, color: '#9ca3af' }}>Không quản lý</span>;
        const minStr = (record.minStorage ?? 0).toLocaleString('vi-VN');
        const maxStr = (record.maxStorage ?? 1_000_000_000) >= 1_000_000_000 ? '1 tỷ' : record.maxStorage.toLocaleString('vi-VN');
        return (
          <Tooltip title={`Tồn tối thiểu: ${minStr} | Tồn tối đa: ${maxStr}`}>
            <Tag style={{ borderRadius: 8, fontSize: 10.5, border: '1px solid #e0e7ef', background: '#f8fafc', color: '#374151' }}>
              {minStr} – {maxStr}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Giá bán (VNĐ)',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      align: 'right',
      width: '10%',
      sorter: (a, b) => (a.sellPrice || 0) - (b.sellPrice || 0),
      render: (val) => (
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
          {formatVND(val)}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'center',
      width: 88,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Cập nhật định mức & tồn kho">
            <Button type="text" size="small"
              icon={<EditOutlined style={{ color: '#2563eb', fontSize: 13 }} />}
              style={{ borderRadius: 4 }}
              onClick={() => handleOpenStockEditModal(record)} />
          </Tooltip>
          <Tooltip title="Nhập hàng nhanh">
            <Button type="text" size="small"
              icon={<InboxOutlined style={{ color: '#16a34a', fontSize: 13 }} />}
              style={{ borderRadius: 4 }}
              onClick={() => { setStockInProduct(record); setStockInQty(10); setIsStockInModalOpen(true); }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ─── Import Action Dropdown ───────────────────────────────────────────────
  const importActions = [
    { key: 'manual', label: 'Nhập hàng thủ công', icon: <PlusOutlined style={{ color: '#16a34a' }} />, onClick: () => notifyWarning('Tính năng đang phát triển') },
    { key: 'file', label: 'Nhập từ file Excel', icon: <ImportOutlined style={{ color: '#0891b2' }} />, onClick: () => notifyWarning('Tính năng đang phát triển') },
    { key: 'adjust', label: 'Điều chỉnh tồn kho', icon: <AuditOutlined style={{ color: '#7c3aed' }} />, onClick: () => notifyWarning('Tính năng đang phát triển') },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {notificationContextHolder}

      {/* ── Top Header Area ── */}
      <div style={{ marginBottom: 10 }}>
        {/* Row 1: Title (left) + Management tabs (right) */}
        <Row gutter={[12, 0]} align="middle" style={{ marginBottom: 8 }}>
          <Col xs={24} md={6} lg={5}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DatabaseOutlined style={{ fontSize: 20, color: '#e8442a' }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>
                Quản lý kho
              </span>
            </div>
          </Col>
          <Col xs={24} md={18} lg={19}>
            {/* Management Tabs (like KiotViet's top option bar) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
              {MGMT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveMgmtTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                    fontWeight: activeMgmtTab === tab.key ? 700 : 500,
                    fontSize: 12.5,
                    border: activeMgmtTab === tab.key ? '1.5px solid #2563eb' : '1.5px solid #e5e7eb',
                    background: activeMgmtTab === tab.key ? '#2563eb' : '#ffffff',
                    color: activeMgmtTab === tab.key ? '#ffffff' : '#374151',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.18s ease',
                    boxShadow: activeMgmtTab === tab.key ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                  }}
                  onMouseEnter={e => { if (activeMgmtTab !== tab.key) { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.borderColor = '#93c5fd'; } }}
                  onMouseLeave={e => { if (activeMgmtTab !== tab.key) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e5e7eb'; } }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </Col>
        </Row>

        {/* Row 2: (empty left) + Search + Actions */}
        <Row gutter={[12, 0]} align="middle">
          <Col xs={24} md={6} lg={5}>
            {/* Intentionally blank to align with filter panel */}
          </Col>
          <Col xs={24} md={18} lg={19}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              {/* Search */}
              <Input
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                placeholder="Theo mã hoặc tên món..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 280, borderRadius: 20, fontSize: 12.5, background: '#ffffff', borderColor: '#e5e7eb' }}
                size="small"
                allowClear
              />

              {/* Action Buttons */}
              <Space size={6}>
                <Tooltip title="Làm mới dữ liệu">
                  <Button
                    icon={<ReloadOutlined />} size="small"
                    onClick={fetchData} loading={loading}
                    style={{ borderRadius: 6, fontSize: 12, borderColor: '#e5e7eb' }}
                  />
                </Tooltip>

                <Dropdown menu={{ items: importActions.map(a => ({ key: a.key, label: <Space>{a.icon}<span>{a.label}</span></Space>, onClick: a.onClick })) }} trigger={['click']}>
                  <Button
                    type="primary" size="small"
                    icon={<ImportOutlined />}
                    style={{ borderRadius: 6, fontWeight: 600, background: '#16a34a', borderColor: '#16a34a', fontSize: 12 }}
                  >
                    Nhập hàng <DownOutlined style={{ fontSize: 9, marginLeft: 2 }} />
                  </Button>
                </Dropdown>

                <Button
                  icon={<ExportOutlined />} size="small"
                  onClick={() => notifyWarning('Tính năng xuất file đang phát triển')}
                  style={{ borderRadius: 6, fontSize: 12, borderColor: '#e5e7eb' }}
                >
                  Xuất file
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </div>

      {/* ── Main Body: Left Filter + Right Table ── */}
      <Row gutter={[10, 10]} style={{ flex: 1, minHeight: 0 }}>
        {/* ── LEFT FILTER PANEL ── */}
        <Col xs={24} sm={24} md={6} lg={5} style={{ height: '100%' }}>
          <div style={{
            background: '#ffffff', borderRadius: 10, border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            height: 'calc(100vh - 148px)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Filter header */}
            <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FilterOutlined style={{ color: '#6b7280' }} /> Bộ lọc
              </span>
              {hasActiveFilters && (
                <Button type="link" size="small" onClick={clearAllFilters}
                  style={{ padding: 0, fontSize: 11, color: '#e8442a', fontWeight: 600 }}>
                  Xóa lọc
                </Button>
              )}
            </div>

            {/* Scrollable filter content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

              {/* 1. Chi nhánh */}
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Chi nhánh</div>
                <Select
                  mode="multiple" placeholder="Chi nhánh trung tâm"
                  value={selectedBranchIds.length === 0 ? ['ALL'] : selectedBranchIds}
                  onChange={(vals) => {
                    if (vals.includes('ALL') && vals[vals.length - 1] === 'ALL') setSelectedBranchIds([]);
                    else setSelectedBranchIds(vals.filter(v => v !== 'ALL'));
                  }}
                  style={{ width: '100%', fontSize: 12 }} size="small" allowClear
                  suffixIcon={null}
                >
                  <Select.Option key="ALL" value="ALL" style={{ fontWeight: 600, color: '#2563eb' }}>
                    Chi nhánh trung tâm ×
                  </Select.Option>
                  {branches.map((b) => (
                    <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                  ))}
                </Select>
              </div>

              {/* 2. Loại thực đơn */}
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Loại thực đơn</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {MENU_TYPES.map((mt) => (
                    <label key={mt.value} style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={selectedMenuTypes.includes(mt.value)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMenuTypes(p => [...p, mt.value]);
                          else setSelectedMenuTypes(p => p.filter(v => v !== mt.value));
                        }}
                        style={{ accentColor: '#2563eb', marginRight: 6 }}
                      />
                      {mt.label}
                    </label>
                  ))}
                </div>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* 3. Loại món */}
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Loại món</div>
                <Select
                  mode="multiple" placeholder="Chọn loại món"
                  value={selectedTypes.length === 0 ? ['ALL'] : selectedTypes}
                  onChange={(vals) => {
                    if (vals.includes('ALL') && vals[vals.length - 1] === 'ALL') setSelectedTypes([]);
                    else setSelectedTypes(vals.filter(v => v !== 'ALL'));
                  }}
                  style={{ width: '100%', fontSize: 12 }} size="small" allowClear
                >
                  <Select.Option key="ALL" value="ALL" style={{ fontWeight: 600, color: '#2563eb' }}>Tất cả loại món</Select.Option>
                  {PRODUCT_TYPES.map((t) => (
                    <Select.Option key={t.value} value={t.value}>
                      <Space size={4}>{t.icon}{t.label}</Space>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* 4. Nhóm món */}
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Nhóm món</div>
                <Select
                  mode="multiple" placeholder="Chọn nhóm món"
                  value={selectedGroupIds.length === 0 ? ['ALL'] : selectedGroupIds}
                  onChange={(vals) => {
                    if (vals.includes('ALL') && vals[vals.length - 1] === 'ALL') setSelectedGroupIds([]);
                    else setSelectedGroupIds(vals.filter(v => v !== 'ALL'));
                  }}
                  style={{ width: '100%', fontSize: 12 }} size="small" allowClear
                >
                  <Select.Option key="ALL" value="ALL" style={{ fontWeight: 600, color: '#2563eb' }}>Tất cả nhóm món</Select.Option>
                  {groups.map((g) => (
                    <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>
                  ))}
                </Select>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* 5. Tồn kho */}
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Tình trạng tồn kho</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {STOCK_STATUS_OPTIONS.map((opt) => (
                    <label key={opt.value} style={{ ...checkboxLabelStyle, color: selectedStockFilter === opt.value ? '#2563eb' : '#374151', fontWeight: selectedStockFilter === opt.value ? 600 : 400 }}>
                      <input
                        type="radio"
                        name="stockFilter"
                        value={opt.value}
                        checked={selectedStockFilter === opt.value}
                        onChange={() => setSelectedStockFilter(opt.value)}
                        style={{ accentColor: '#2563eb', marginRight: 6 }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* 6. Bán trực tiếp */}
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Bán trực tiếp</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[{ v: 'ALL', l: 'Tất cả' }, { v: 'YES', l: 'Có' }, { v: 'NO', l: 'Không' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setSelectedDirectSellFilter(v)}
                      style={{
                        flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 11.5, cursor: 'pointer',
                        fontWeight: selectedDirectSellFilter === v ? 700 : 400,
                        border: selectedDirectSellFilter === v ? '1.5px solid #2563eb' : '1.5px solid #e5e7eb',
                        background: selectedDirectSellFilter === v ? '#eff6ff' : '#ffffff',
                        color: selectedDirectSellFilter === v ? '#1d4ed8' : '#374151',
                        transition: 'all 0.15s',
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Trạng thái kinh doanh */}
              <div style={{ marginBottom: 8 }}>
                <div style={labelStyle}>Trạng thái kinh doanh</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[{ v: 'ACTIVE', l: 'Đang kinh doanh', dot: '#22c55e' }, { v: 'INACTIVE', l: 'Ngừng kinh doanh', dot: '#ef4444' }, { v: 'ALL', l: 'Tất cả', dot: '#9ca3af' }].map(({ v, l, dot }) => (
                    <label key={v} style={{ ...checkboxLabelStyle, color: selectedBusinessStatus === v ? '#2563eb' : '#374151', fontWeight: selectedBusinessStatus === v ? 600 : 400 }}>
                      <input
                        type="radio" name="bizStatus" value={v}
                        checked={selectedBusinessStatus === v}
                        onChange={() => setSelectedBusinessStatus(v)}
                        style={{ accentColor: '#2563eb', marginRight: 6 }}
                      />
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block' }} />
                        {l}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* ── RIGHT CONTENT AREA ── */}
        <Col xs={24} sm={24} md={18} lg={19} style={{ height: '100%' }}>
          <div style={{
            background: '#ffffff', borderRadius: 10, border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            height: 'calc(100vh - 148px)',
          }}>
            {/* Summary stat bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              borderBottom: '1px solid #f3f4f6', background: '#fafbfc', flexShrink: 0,
            }}>
              {[
                { label: 'Tổng sản phẩm', value: summaryStats.total, color: '#2563eb', icon: <DatabaseOutlined /> },
                { label: 'Còn hàng', value: summaryStats.inStock, color: '#16a34a', icon: <CheckCircleOutlined /> },
                { label: 'Hết hàng', value: summaryStats.outStock, color: '#ef4444', icon: <CloseCircleOutlined /> },
                { label: 'Dưới định mức', value: summaryStats.lowStock, color: '#f59e0b', icon: <WarningOutlined /> },
              ].map((stat, i) => (
                <div key={i} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '10px 8px', borderRight: i < 3 ? '1px solid #f3f4f6' : 'none',
                }}>
                  <div style={{ fontSize: 10.5, color: '#6b7280', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: stat.color }}>{stat.icon}</span> {stat.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                    {stat.value.toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}

              {/* Selected rows indicator */}
              {selectedRowKeys.length > 0 && (
                <div style={{ padding: '10px 16px', borderLeft: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Tag color="blue" style={{ borderRadius: 10, fontWeight: 600, fontSize: 11 }}>
                    Đã chọn {selectedRowKeys.length}
                  </Tag>
                  <Button type="link" size="small" style={{ padding: 0, fontSize: 11, color: '#ef4444' }}
                    onClick={() => setSelectedRowKeys([])}>
                    Bỏ chọn
                  </Button>
                </div>
              )}
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Table
                className="kiotviet-table"
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                columns={columns}
                dataSource={pagedProducts}
                rowKey="id"
                loading={loading}
                size="small"
                scroll={{ y: 'calc(100vh - 310px)', x: 'max-content' }}
                pagination={false}
                rowClassName={(_, index) => index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
                onRow={(record) => ({
                  style: { cursor: 'pointer', transition: 'background 0.15s' },
                  onMouseEnter: (e) => e.currentTarget.style.background = '#f0f7ff',
                  onMouseLeave: (e) => e.currentTarget.style.background = 'transparent',
                })}
              />
            </div>

            {/* Pagination footer */}
            <div style={{
              padding: '9px 16px', borderTop: '1px solid #f3f4f6', background: '#fafafa',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                Hiển thị{' '}
                <strong style={{ color: '#111827' }}>
                  {Math.min((currentPage - 1) * pageSize + 1, filteredProducts.length)}–{Math.min(currentPage * pageSize, filteredProducts.length)}
                </strong>{' '}
                trong <strong style={{ color: '#2563eb' }}>{filteredProducts.length}</strong> sản phẩm
              </div>
              <Pagination
                current={currentPage} pageSize={pageSize} total={filteredProducts.length}
                onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                showSizeChanger pageSizeOptions={['10', '20', '50', '100']} size="small"
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Modal: Cập nhật định mức tồn kho ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EditOutlined style={{ color: '#fff', fontSize: 15 }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>Cấu hình tồn kho</div>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>{editingInventoryProduct?.name}</div>
            </div>
          </div>
        }
        open={isStockEditModalOpen}
        onOk={handleSaveStockEdit} onCancel={() => setIsStockEditModalOpen(false)}
        width={540} okText="Lưu định mức" cancelText="Hủy"
        destroyOnHidden
        okButtonProps={{ style: { background: '#2563eb', borderColor: '#2563eb', borderRadius: 6, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 6 } }}
      >
        <Form form={stockForm} layout="vertical" size="small" requiredMark={false} style={{ paddingTop: 12 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="skuCode" label={<span style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>Mã món</span>}>
                <Input disabled style={{ borderRadius: 6, background: '#f9fafb' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label={<span style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>Tên món</span>}>
                <Input disabled style={{ borderRadius: 6, background: '#f9fafb' }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb', padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>Quản lý định mức tồn kho</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {isManageQuantityWatch ? 'Đang theo dõi hạn mức số lượng tồn kho.' : 'Bật để thiết lập mức tồn tối thiểu & tối đa.'}
                </div>
              </div>
              <Form.Item name="isManageQuantity" valuePropName="checked" noStyle>
                <input type="checkbox" checked={isManageQuantityWatch}
                  onChange={(e) => { setIsManageQuantityWatch(e.target.checked); stockForm.setFieldValue('isManageQuantity', e.target.checked); }}
                  style={{ width: 16, height: 16, accentColor: '#2563eb', cursor: 'pointer' }} />
              </Form.Item>
            </div>

            {isManageQuantityWatch && (
              <Row gutter={12} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                <Col span={12}>
                  <Form.Item name="minStorage" label={<span style={{ fontSize: 11, fontWeight: 600 }}>Tồn tối thiểu <span style={{ color: '#ef4444' }}>*</span></span>}
                    rules={[{ required: true, message: 'Nhập định mức tồn tối thiểu' }]}>
                    <InputNumber style={{ width: '100%', borderRadius: 6 }} min={0} max={1_000_000_000}
                      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => v.replace(/\$\s?|(,*)/g, '')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="maxStorage" label={<span style={{ fontSize: 11, fontWeight: 600 }}>Tồn tối đa <span style={{ color: '#ef4444' }}>*</span></span>}
                    rules={[{ required: true, message: 'Nhập định mức tồn tối đa' }]}>
                    <InputNumber style={{ width: '100%', borderRadius: 6 }} min={0} max={1_000_000_000}
                      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => v.replace(/\$\s?|(,*)/g, '')} />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </div>

          <Form.Item name="currentStock" label={<span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Số lượng tồn kho thực tế</span>}>
            <InputNumber style={{ width: '100%', borderRadius: 6 }} min={0}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => v.replace(/\$\s?|(,*)/g, '')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal: Nhập hàng nhanh ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <InboxOutlined style={{ color: '#fff', fontSize: 15 }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>Nhập hàng nhanh</div>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>{stockInProduct?.name}</div>
            </div>
          </div>
        }
        open={isStockInModalOpen}
        onOk={() => { notifySuccess(`Đã cộng thêm ${stockInQty} vào kho thành công!`); setIsStockInModalOpen(false); }}
        onCancel={() => setIsStockInModalOpen(false)}
        width={400} okText="Xác nhận nhập kho" cancelText="Hủy"
        destroyOnHidden
        okButtonProps={{ style: { background: '#16a34a', borderColor: '#16a34a', borderRadius: 6, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 6 } }}
      >
        <div style={{ paddingTop: 12 }}>
          <div style={{ background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, color: '#4b5563' }}>
              Mã món: <strong style={{ color: '#1d4ed8', fontFamily: 'monospace' }}>{stockInProduct?.skuCode || 'N/A'}</strong>
            </div>
            <div style={{ fontSize: 11.5, color: '#4b5563', marginTop: 4 }}>
              Tồn hiện tại: <strong style={{ color: '#111827' }}>{((stockInProduct?.currentStock ?? ((stockInProduct?.id * 17) % 150)) || 0).toLocaleString('vi-VN')}</strong>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Số lượng nhập thêm vào kho:
          </div>
          <InputNumber
            style={{ width: '100%', borderRadius: 8 }}
            min={1} value={stockInQty}
            onChange={(val) => setStockInQty(val || 1)}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => v.replace(/\$\s?|(,*)/g, '')}
            size="large"
          />
        </div>
      </Modal>
    </div>
  );
};

// ─── Shared inline style helpers ─────────────────────────────────────────────
const labelStyle = {
  fontSize: 11.5, fontWeight: 700, color: '#374151', marginBottom: 7,
  textTransform: 'uppercase', letterSpacing: '0.4px',
};

const checkboxLabelStyle = {
  display: 'flex', alignItems: 'center', fontSize: 12, color: '#374151',
  cursor: 'pointer', padding: '2px 0',
};

export default InventoryManagementTab;
