import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  InputNumber,
  Switch,
  Space,
  Popconfirm,
  message,
  notification,
  Row,
  Col,
  Tooltip,
  Radio,
  Card,
  Dropdown,
  Avatar,
  Typography,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  DownOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  BuildOutlined,
  ShoppingOutlined,
  SettingOutlined,
  PictureOutlined,
  PlusCircleOutlined,
  RightOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../api/productApi';
import { getAllGroups, createGroup } from '../../api/groupApi';
import { getAllUnits, createUnit } from '../../api/unitApi';
import { useAuth } from '../../context/AuthContext';

const { Title } = Typography;

const PRODUCT_TYPES = [
  { value: 'Processed', label: 'Chế biến', color: 'purple', icon: <ExperimentOutlined /> },
  { value: 'Manufactured', label: 'Thành phẩm', color: 'blue', icon: <BuildOutlined /> },
  { value: 'Regular', label: 'Thường', color: 'green', icon: <ShoppingOutlined /> },
  { value: 'Ingredient', label: 'Nguyên liệu', color: 'orange', icon: <AppstoreOutlined /> },
  { value: 'Tool', label: 'Công cụ', color: 'cyan', icon: <SettingOutlined /> },
];

const ProductManagementTab = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  // KiotViet Left Filter Panel States
  const [selectedType, setSelectedType] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form] = Form.useForm();
  const [productTypeWatch, setProductTypeWatch] = useState('Regular');
  const [baseUnitId, setBaseUnitId] = useState(null);
  const [derivedUnits, setDerivedUnits] = useState([]);
  const [recipeItems, setRecipeItems] = useState([]);
  const [imageUrlWatch, setImageUrlWatch] = useState('');

  // KiotViet Unit Picker Modal States
  const [isUnitPickerModalOpen, setIsUnitPickerModalOpen] = useState(false);

  // Inline Quick Group & Unit Creation States
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [quickGroupLoading, setQuickGroupLoading] = useState(false);

  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [quickUnitLoading, setQuickUnitLoading] = useState(false);

  const [notifyApi, notificationContextHolder] = notification.useNotification();

  // Custom Styled TopRight Notification Helpers (Soft Red for Errors, Soft Green for Success)
  const notifySuccess = (msg, desc = '') => {
    notifyApi.success({
      message: msg,
      description: desc,
      placement: 'topRight',
      duration: 3,
      style: {
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 8,
        color: '#166534',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      },
    });
  };

  const notifyError = (msg, desc = '') => {
    notifyApi.error({
      message: msg,
      description: desc,
      placement: 'topRight',
      duration: 3,
      style: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 8,
        color: '#991b1b',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      },
    });
  };

  const notifyWarning = (msg, desc = '') => {
    notifyApi.warning({
      message: msg,
      description: desc,
      placement: 'topRight',
      duration: 3,
      style: {
        background: '#fffbe6',
        border: '1px solid #ffe58f',
        borderRadius: 8,
        color: '#854d0e',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      },
    });
  };

  const handleQuickCreateGroup = async () => {
    if (!newGroupName.trim()) {
      notifyWarning('Vui lòng nhập tên nhóm hàng mới!');
      return;
    }
    setQuickGroupLoading(true);
    try {
      const res = await createGroup({
        name: newGroupName.trim(),
        chainId: user?.chainId || 1,
      });
      const created = res.data;
      setGroups((prev) => [...prev, created]);
      form.setFieldsValue({ groupId: created.id });
      notifySuccess('Tạo nhóm mới thành công!');
      setIsAddGroupModalOpen(false);
      setNewGroupName('');
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || 'Không thể tạo nhóm mới.';
      notifyError('Tạo nhóm thất bại', errMsg);
    } finally {
      setQuickGroupLoading(false);
    }
  };

  const handleToggleUnitSelection = (unit) => {
    if (!baseUnitId) {
      setBaseUnitId(unit.id);
      form.setFieldsValue({ baseUnitId: unit.id });
      notifySuccess(`Đã chọn đơn vị cơ bản: ${unit.name}`);
      return;
    }

    if (unit.id === baseUnitId) {
      if (derivedUnits.length > 0) {
        const nextBaseId = derivedUnits[0].unitId;
        const nextBaseName = units.find((u) => u.id === nextBaseId)?.name;
        setBaseUnitId(nextBaseId);
        form.setFieldsValue({ baseUnitId: nextBaseId });
        setDerivedUnits(derivedUnits.slice(1));
        notifySuccess(`Đã chuyển đơn vị cơ bản sang: ${nextBaseName}`);
      } else {
        setBaseUnitId(null);
        form.setFieldsValue({ baseUnitId: null });
        notifyWarning(`Đã bỏ chọn đơn vị cơ bản ${unit.name}`);
      }
      return;
    }

    const isDerived = derivedUnits.some((du) => du.unitId === unit.id);
    if (isDerived) {
      setDerivedUnits(derivedUnits.filter((du) => du.unitId !== unit.id));
      notifyWarning(`Đã bỏ chọn đơn vị quy đổi ${unit.name}`);
    } else {
      setDerivedUnits([...derivedUnits, { unitId: unit.id, conversionPoint: 2 }]);
      notifySuccess(`Đã thêm đơn vị quy đổi: ${unit.name}`);
    }
  };

  const handleBaseUnitChange = (newBaseId) => {
    if (newBaseId === baseUnitId) return;

    const oldBaseId = baseUnitId;
    setBaseUnitId(newBaseId);
    form.setFieldsValue({ baseUnitId: newBaseId });

    let updatedDerived = derivedUnits.filter((du) => du.unitId !== newBaseId);
    if (oldBaseId) {
      updatedDerived.push({ unitId: oldBaseId, conversionPoint: 2 });
    }
    setDerivedUnits(updatedDerived);
    const newBaseName = units.find((u) => u.id === newBaseId)?.name || 'đơn vị mới';
    notifySuccess(`Đã chuyển đổi đơn vị cơ bản thành: ${newBaseName}`);
  };

  const handleQuickCreateUnit = async () => {
    if (!newUnitName.trim()) {
      notifyWarning('Vui lòng nhập tên đơn vị tính mới!');
      return;
    }
    setQuickUnitLoading(true);
    try {
      const res = await createUnit({ name: newUnitName.trim() });
      const created = res.data;
      await fetchUnits();
      if (!baseUnitId) {
        setBaseUnitId(created.id);
        form.setFieldsValue({ baseUnitId: created.id });
      } else {
        setDerivedUnits((prev) => [...prev, { unitId: created.id, conversionPoint: 2 }]);
      }
      notifySuccess('Tạo đơn vị tính mới thành công!');
      setIsAddUnitModalOpen(false);
      setNewUnitName('');
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || 'Không thể tạo đơn vị tính mới.';
      notifyError('Tạo đơn vị tính thất bại', errMsg);
    } finally {
      setQuickUnitLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const resGroup = await getAllGroups();
      const groupList = Array.isArray(resGroup.data)
        ? resGroup.data
        : resGroup.data?.$values || resGroup.data?.items || [];
      setGroups(groupList);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const resUnit = await getAllUnits();
      console.log('getAllUnits response:', resUnit.data);
      let unitList = [];
      if (Array.isArray(resUnit.data)) {
        unitList = resUnit.data;
      } else if (resUnit.data?.$values) {
        unitList = resUnit.data.$values;
      } else if (resUnit.data?.items) {
        unitList = resUnit.data.items;
      } else if (resUnit.data?.data) {
        unitList = Array.isArray(resUnit.data.data)
          ? resUnit.data.data
          : resUnit.data.data?.$values || [];
      }
      setUnits(unitList);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resGroup, resUnit] = await Promise.all([
        getAllProducts(),
        getAllGroups(),
        getAllUnits(),
      ]);
      const prodList = Array.isArray(resProd.data) ? resProd.data : resProd.data?.$values || [];
      const groupList = Array.isArray(resGroup.data) ? resGroup.data : resGroup.data?.$values || resGroup.data?.items || [];
      
      let unitList = [];
      if (Array.isArray(resUnit.data)) {
        unitList = resUnit.data;
      } else if (resUnit.data?.$values) {
        unitList = resUnit.data.$values;
      } else if (resUnit.data?.items) {
        unitList = resUnit.data.items;
      } else if (resUnit.data?.data) {
        unitList = Array.isArray(resUnit.data.data) ? resUnit.data.data : resUnit.data.data?.$values || [];
      }

      setProducts(prodList);
      setGroups(groupList);
      setUnits(unitList);
    } catch (err) {
      console.error('Fetch Data Error:', err);
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || 'Không thể kết nối đến máy chủ.';
      notifyError('Lỗi tải dữ liệu', errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isUnitPickerModalOpen) {
      fetchUnits();
    }
  }, [isUnitPickerModalOpen]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedType && p.type !== selectedType) return false;
      if (selectedGroup && p.groupId !== selectedGroup) return false;
      if (selectedStatus === 'active' && !p.isActive) return false;
      if (selectedStatus === 'inactive' && p.isActive) return false;
      if (searchText) {
        const text = searchText.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(text);
        const matchSKU = p.skuCode?.toLowerCase().includes(text);
        if (!matchName && !matchSKU) return false;
      }
      return true;
    });
  }, [products, selectedType, selectedGroup, selectedStatus, searchText]);

  // Handle "+ Thêm mới" Dropdown Item Selection
  const handleSelectProductTypeFromDropdown = (type) => {
    // Check ingredient prerequisite for Processed and Manufactured
    if (type === 'Processed' || type === 'Manufactured') {
      const hasBaseMaterials = products.some(
        (p) =>
          String(p.type).toLowerCase() === 'regular' ||
          String(p.type).toLowerCase() === 'ingredient'
      );

      if (!hasBaseMaterials) {
        notifyWarning(
          'Không đủ điều kiện tạo món',
          'Cần tạo ít nhất 1 Hàng thường hoặc Nguyên liệu trước khi tạo công thức món!'
        );
        return; // Block opening form modal
      }
    }

    setEditingProduct(null);
    form.resetFields();

    setProductTypeWatch(type);
    setImageUrlWatch('');

    const initialBaseUnitId = units.length > 0 ? units[0].id : null;
    setBaseUnitId(initialBaseUnitId);
    setDerivedUnits([]);
    setRecipeItems([]);

    form.setFieldsValue({
      type,
      isActive: true,
      isSellable: true,
      sellPrice: 0,
      chainId: user?.chainId || 1,
      baseUnitId: initialBaseUnitId,
    });

    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    form.resetFields();

    setProductTypeWatch(prod.type);
    setImageUrlWatch(prod.imageUrl || '');

    form.setFieldsValue({
      id: prod.id,
      groupId: prod.groupId,
      chainId: prod.chainId || user?.chainId || 1,
      type: prod.type,
      name: prod.name,
      description: prod.description,
      skuCode: prod.skuCode,
      imageUrl: prod.imageUrl,
      isActive: prod.isActive,
      isSellable: prod.isSellable,
      sellPrice: prod.sellPrice,
    });

    const baseUnitObj = prod.unitConversions?.find((uc) => !uc.baseId);
    const initialBaseUnitId = baseUnitObj ? baseUnitObj.unitId : (units[0]?.id || null);
    setBaseUnitId(initialBaseUnitId);
    form.setFieldsValue({ baseUnitId: initialBaseUnitId });

    if (prod.unitConversions && prod.unitConversions.length > 0) {
      const derived = prod.unitConversions
        .filter((uc) => uc.baseId !== null)
        .map((uc) => ({
          unitId: uc.unitId,
          conversionPoint: uc.conversionPoint,
        }));
      setDerivedUnits(derived);
    } else {
      setDerivedUnits([]);
    }

    if (prod.recipeItems && prod.recipeItems.length > 0) {
      setRecipeItems(
        prod.recipeItems.map((ri) => ({
          productId: ri.ingredientProductId || ri.productId,
          quantity: ri.quantity,
        }))
      );
    } else {
      setRecipeItems([]);
    }

    setIsFormModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      notifySuccess('Xóa sản phẩm thành công!');
      fetchData();
    } catch (err) {
      const errMessage = err?.response?.data?.detail || err?.response?.data?.message || 'Không thể xóa sản phẩm.';
      notifyError(errMessage);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const values = await form.validateFields();

      if (!baseUnitId) {
        notifyWarning('Vui lòng chọn Đơn vị tính cơ sở!');
        return;
      }

      const unitConversionsPayload = [
        { unitId: baseUnitId, conversionPoint: 1, isBase: true },
      ];

      if (!['Processed', 'Manufactured'].includes(productTypeWatch)) {
        for (const du of derivedUnits) {
          if (!du.conversionPoint || du.conversionPoint <= 1) {
            notifyWarning('Tỷ lệ quy đổi ra đơn vị gốc phải là số dương lớn hơn 1 (đơn vị quy đổi phải lớn hơn đơn vị gốc)!');
            return;
          }
          unitConversionsPayload.push({
            unitId: du.unitId,
            conversionPoint: du.conversionPoint,
            isBase: false,
          });
        }
      }

      if (['Processed', 'Manufactured'].includes(productTypeWatch)) {
        if (recipeItems.length === 0) {
          notifyWarning('Món chế biến và thành phẩm phải có ít nhất 1 thành phần công thức!');
          return;
        }

        for (const item of recipeItems) {
          if (!item.quantity || item.quantity <= 0) {
            notifyWarning('Số lượng nguyên liệu phải lớn hơn 0!');
            return;
          }
        }
      }

      const payload = {
        ...values,
        unitConversions: unitConversionsPayload,
        recipe: ['Processed', 'Manufactured'].includes(productTypeWatch)
          ? { details: recipeItems }
          : null,
      };

      if (editingProduct) {
        payload.id = editingProduct.id;
        await updateProduct(payload);
        notifySuccess('Cập nhật sản phẩm thành công!');
      } else {
        await createProduct(payload);
        notifySuccess('Thêm mới sản phẩm thành công!');
      }

      setIsFormModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      const errMessage = err?.response?.data?.detail || err?.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.';
      notifyError(errMessage);
    }
  };

  // Helper Derived Unit Actions
  const addDerivedUnit = () => {
    const availableUnits = units.filter((u) => u.id !== baseUnitId && !derivedUnits.some((du) => du.unitId === u.id));
    if (availableUnits.length === 0) {
      notifyWarning('Tất cả đơn vị tính đã được chọn!');
      return;
    }
    setDerivedUnits([...derivedUnits, { unitId: availableUnits[0].id, conversionPoint: 2 }]);
  };

  const removeDerivedUnit = (index) => {
    const updated = [...derivedUnits];
    updated.splice(index, 1);
    setDerivedUnits(updated);
  };

  // Helper Recipe Actions & Filtering
  const availableIngredientsForType = useMemo(() => {
    return products.filter((p) => {
      if (p.id === editingProduct?.id) return false;
      if (productTypeWatch === 'Processed') return ['Processed', 'Manufactured', 'Ingredient', 'Regular'].includes(p.type);
      if (productTypeWatch === 'Manufactured') return ['Manufactured', 'Ingredient', 'Regular'].includes(p.type);
      return false;
    });
  }, [products, editingProduct, productTypeWatch]);

  const addRecipeItem = () => {
    if (availableIngredientsForType.length === 0) {
      notifyWarning('Không có nguyên liệu phù hợp để chọn!');
      return;
    }
    setRecipeItems([...recipeItems, { productId: availableIngredientsForType[0].id, quantity: 1 }]);
  };

  const removeRecipeItem = (index) => {
    const updated = [...recipeItems];
    updated.splice(index, 1);
    setRecipeItems(updated);
  };

  // KiotViet Dropdown Menu Items for "+ Thêm mới ∨"
  const addNewMenuItems = [
    {
      key: 'Ingredient',
      label: (
        <Space>
          <PlusOutlined style={{ fontSize: 13, color: '#ea580c' }} />
          <span>Nguyên vật liệu</span>
        </Space>
      ),
      onClick: () => handleSelectProductTypeFromDropdown('Ingredient'),
    },
    {
      key: 'Tool',
      label: (
        <Space>
          <PlusOutlined style={{ fontSize: 13, color: '#0891b2' }} />
          <span>Công cụ dụng cụ</span>
        </Space>
      ),
      onClick: () => handleSelectProductTypeFromDropdown('Tool'),
    },
    {
      key: 'Processed',
      label: (
        <Space>
          <PlusOutlined style={{ fontSize: 13, color: '#8b5cf6' }} />
          <span>Món chế biến</span>
        </Space>
      ),
      onClick: () => handleSelectProductTypeFromDropdown('Processed'),
    },
    {
      key: 'Manufactured',
      label: (
        <Space>
          <PlusOutlined style={{ fontSize: 13, color: '#2563eb' }} />
          <span>Món sản xuất</span>
        </Space>
      ),
      onClick: () => handleSelectProductTypeFromDropdown('Manufactured'),
    },
    {
      key: 'Regular',
      label: (
        <Space>
          <PlusOutlined style={{ fontSize: 13, color: '#16a34a' }} />
          <span>Hàng thường</span>
        </Space>
      ),
      onClick: () => handleSelectProductTypeFromDropdown('Regular'),
    },
  ];

  // KiotViet Table Columns Definition
  const columns = [
    {
      title: 'Mã hàng',
      key: 'imageSku',
      width: 130,
      render: (_, record) => (
        <Space size="small">
          {record.imageUrl ? (
            <Avatar src={record.imageUrl} shape="square" size={26} />
          ) : (
            <Avatar icon={<PictureOutlined />} shape="square" size={26} style={{ background: '#f3f4f6', color: '#9ca3af' }} />
          )}
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1d4ed8', fontFamily: 'monospace' }}>
            {record.skuCode || 'N/A'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Tên hàng hóa',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const baseUnitObj = record.unitConversions?.find((uc) => !uc.baseId);
        const baseUnitName = units.find((u) => u.id === baseUnitObj?.unitId)?.name;
        return (
          <Space size="small">
            <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{text}</span>
            {baseUnitName && (
              <Tag style={{ margin: 0, fontSize: 10, background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '0 4px' }}>
                {baseUnitName}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Nhóm quản lý',
      dataIndex: 'groupId',
      key: 'groupId',
      width: 130,
      render: (groupId) => {
        const gName = groups.find((g) => g.id === groupId)?.name || 'Chưa phân nhóm';
        return (
          <Tag style={{ borderRadius: 10, padding: '0 6px', fontSize: 10, border: '1px solid #e5e7eb' }}>
            {gName}
          </Tag>
        );
      },
    },
    {
      title: 'Loại món',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type) => {
        const typeObj = PRODUCT_TYPES.find((t) => t.value === type) || { label: type, color: 'default' };
        return (
          <Tag color={typeObj.color} style={{ borderRadius: 8, fontSize: 10, padding: '0 6px' }}>
            {typeObj.label}
          </Tag>
        );
      },
    },
    {
      title: 'Giá bán (VNĐ)',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      align: 'right',
      width: 130,
      render: (val) => (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
          {val ? `${val.toLocaleString('vi-VN')}` : '0'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 130,
      render: (active) => (
        <span style={{ fontSize: 11, color: active ? '#15803d' : '#b91c1c', fontWeight: 500 }}>
          {active ? '● Đang kinh doanh' : '● Ngừng kinh doanh'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'center',
      width: 90,
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#2563eb', fontSize: 14 }} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa món này?"
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, size: 'small' }}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger size="small" icon={<DeleteOutlined style={{ fontSize: 14 }} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {notificationContextHolder}
      {/* Top Header Row matching KiotViet exact grid alignment */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 10 }}>
        {/* Left Column: Title directly above Filter Panel */}
        <Col xs={24} sm={24} md={6} lg={5}>
          <Title level={4} style={{ margin: 0, color: '#111827', fontWeight: 700, fontSize: 18, whiteSpace: 'nowrap' }}>
            Danh mục sản phẩm
          </Title>
        </Col>

        {/* Right Column: Search bar & Action buttons directly above Content Table */}
        <Col xs={24} sm={24} md={18} lg={19}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Input
              placeholder="🔍 Theo mã hoặc tên hàng"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 320, borderRadius: 20, fontSize: 12, background: '#ffffff' }}
              size="small"
              allowClear
            />

            <Space size="small">
              {/* Antd Dropdown attached to + Thêm mới ∨ */}
              <Dropdown menu={{ items: addNewMenuItems }} trigger={['click']}>
                <Button
                  type="primary"
                  size="small"
                  style={{
                    borderRadius: 6,
                    fontWeight: 600,
                    background: '#2563eb',
                    borderColor: '#2563eb',
                    fontSize: 12,
                  }}
                >
                  <Space size={4}>
                    <PlusOutlined />
                    <span>Thêm mới</span>
                    <DownOutlined style={{ fontSize: 10 }} />
                  </Space>
                </Button>
              </Dropdown>

              <Button icon={<ExportOutlined />} size="small" style={{ borderRadius: 6, fontSize: 12 }}>
                Xuất file
              </Button>
            </Space>
          </div>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ flex: 1, minHeight: 0 }}>
        {/* KiotViet Left Filter Panel with Scroll */}
        <Col xs={24} sm={24} md={6} lg={5} style={{ height: '100%' }}>
          <Card
            bodyStyle={{ padding: '14px', flex: 1, overflowY: 'auto' }}
            style={{
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              height: 'calc(100vh - 135px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
              Bộ lọc sản phẩm
            </div>

            {/* Group Filter */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                Nhóm quản lý
              </div>
              <Select
                placeholder="Tất cả nhóm món"
                value={selectedGroup}
                onChange={setSelectedGroup}
                onFocus={fetchGroups}
                style={{ width: '100%', fontSize: 12 }}
                size="small"
                allowClear
              >
                {groups.map((g) => (
                  <Select.Option key={g.id} value={g.id}>
                    {g.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Type Filter */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                Loại món
              </div>
              <Select
                placeholder="Tất cả loại món"
                value={selectedType}
                onChange={setSelectedType}
                style={{ width: '100%', fontSize: 12 }}
                size="small"
                allowClear
              >
                {PRODUCT_TYPES.map((t) => (
                  <Select.Option key={t.value} value={t.value}>
                    <Space size={4}>
                      {t.icon}
                      {t.label}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Status Radio Filter */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                Trạng thái
              </div>
              <Radio.Group
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}
              >
                <Radio value="all" style={{ fontSize: 12 }}>Tất cả</Radio>
                <Radio value="active" style={{ fontSize: 12 }}>Đang kinh doanh</Radio>
                <Radio value="inactive" style={{ fontSize: 12 }}>Ngừng kinh doanh</Radio>
              </Radio.Group>
            </div>
          </Card>
        </Col>

        {/* KiotViet Main Data Table Area with Internal Scroll */}
        <Col xs={24} sm={24} md={18} lg={19} style={{ height: '100%' }}>
          <Card
            bodyStyle={{ padding: 0 }}
            style={{
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 135px)',
            }}
          >
            {/* KiotViet Data Table with Internal Scroll */}
            <Table
              className="kiotviet-table"
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              columns={columns}
              dataSource={filteredProducts}
              rowKey="id"
              loading={loading}
              size="small"
              scroll={{ y: 'calc(100vh - 200px)' }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                pageSizeOptions: ['20', '50', '100'],
                showTotal: (total) => `Tổng số: ${total} sản phẩm`,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* KiotViet Style Product Creation & Editing Form Modal */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
            {editingProduct
              ? `Chỉnh sửa: ${editingProduct.name}`
              : `Tạo ${PRODUCT_TYPES.find((t) => t.value === productTypeWatch)?.label.toLowerCase() || 'sản phẩm'}`}
          </div>
        }
        open={isFormModalOpen}
        onOk={handleSaveProduct}
        onCancel={() => setIsFormModalOpen(false)}
        width={760}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" size="small">
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: 'info',
                label: <span style={{ fontWeight: 600 }}>Thông tin</span>,
                children: (
                  <div style={{ paddingTop: 8 }}>
                    {/* Top Row: Left Inputs (15) + Right Single Image Box (9) */}
                    <Row gutter={16}>
                      <Col span={15}>
                        <Form.Item name="skuCode" label={<span style={{ fontSize: 12, fontWeight: 600 }}>Mã hàng</span>}>
                          <Input placeholder="Tự động" style={{ borderRadius: 6 }} />
                        </Form.Item>

                        <Form.Item
                          name="name"
                          label={<span style={{ fontSize: 12, fontWeight: 600 }}>Tên hàng <span style={{ color: '#ef4444' }}>*</span></span>}
                          rules={[{ required: true, message: 'Bạn cần nhập tên hàng' }]}
                        >
                          <Input placeholder="Nhập tên hàng hóa / món ăn..." style={{ borderRadius: 6 }} />
                        </Form.Item>

                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                              Nhóm hàng <span style={{ color: '#ef4444' }}>*</span>
                            </span>
                            <Button
                              type="link"
                              size="small"
                              style={{ padding: 0, fontSize: 12, fontWeight: 600, color: '#2563eb' }}
                              onClick={() => setIsAddGroupModalOpen(true)}
                            >
                              + Tạo mới
                            </Button>
                          </div>

                          <Form.Item
                            name="groupId"
                            noStyle
                            rules={[{ required: true, message: 'Vui lòng chọn 1 nhóm món!' }]}
                          >
                            <Select placeholder="Chọn nhóm món" style={{ width: '100%' }} onFocus={fetchGroups}>
                              {groups.map((g) => (
                                <Select.Option key={g.id} value={g.id}>
                                  {g.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </div>
                      </Col>

                      {/* Right Single Image Upload / URL Preview Frame */}
                      <Col span={9}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                          Ảnh sản phẩm (Tối đa 1 ảnh)
                        </div>
                        <div
                          style={{
                            border: '2px dashed #e5e7eb',
                            borderRadius: 8,
                            padding: 12,
                            textAlign: 'center',
                            background: '#fafafa',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 140,
                          }}
                        >
                          {imageUrlWatch ? (
                            <div style={{ position: 'relative' }}>
                              <Avatar src={imageUrlWatch} shape="square" size={80} style={{ borderRadius: 8, marginBottom: 8 }} />
                              <div>
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  onClick={() => {
                                    setImageUrlWatch('');
                                    form.setFieldsValue({ imageUrl: '' });
                                  }}
                                >
                                  Xóa ảnh
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <PictureOutlined style={{ fontSize: 32, color: '#9ca3af', marginBottom: 6 }} />
                              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                                Cung cấp liên kết ảnh sản phẩm
                              </div>
                            </div>
                          )}

                          <Form.Item name="imageUrl" noStyle>
                            <Input
                              placeholder="Dán URL ảnh..."
                              size="small"
                              style={{ fontSize: 11, borderRadius: 4 }}
                              onChange={(e) => setImageUrlWatch(e.target.value)}
                              allowClear
                            />
                          </Form.Item>
                        </div>
                      </Col>
                    </Row>

                    {/* Card 1: Giá & Thuế */}
                    <Card
                      type="inner"
                      title={<span style={{ fontSize: 13, fontWeight: 700 }}>Giá & Thuế</span>}
                      size="small"
                      style={{ marginBottom: 12, borderRadius: 8 }}
                    >
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            name="sellPrice"
                            label="Giá bán (VNĐ)"
                            rules={[{ required: true, message: 'Nhập giá bán' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                              min={0}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Row gutter={12} style={{ marginTop: 22 }}>
                            <Col span={12}>
                              <Form.Item name="isSellable" label="Cho phép bán" valuePropName="checked" style={{ marginBottom: 0 }}>
                                <Switch size="small" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="isActive" label="Đang kinh doanh" valuePropName="checked" style={{ marginBottom: 0 }}>
                                <Switch size="small" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </Card>

                    {/* Card 2: KiotViet Exact Collapsed Unit Summary Card */}
                    {(() => {
                      const selectedBaseUnit = units.find((u) => u.id === baseUnitId);
                      const selectedDerivedUnitNames = derivedUnits
                        .map((du) => units.find((u) => u.id === du.unitId)?.name)
                        .filter(Boolean);
                      const allSelectedNames = [
                        selectedBaseUnit?.name,
                        ...selectedDerivedUnitNames,
                      ].filter(Boolean);
                      const totalUnitsCount = allSelectedNames.length;

                      return (
                        <Card
                          type="inner"
                          size="small"
                          style={{
                            marginBottom: 12,
                            borderRadius: 12,
                            cursor: 'pointer',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            background: '#ffffff',
                          }}
                          onClick={() => setIsUnitPickerModalOpen(true)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                                Quản lý theo đơn vị tính và thuộc tính
                              </div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                                {totalUnitsCount > 0 ? (
                                  <span>
                                    Hàng hóa được tạo ra từ <strong>{totalUnitsCount} đơn vị</strong> {allSelectedNames.join(', ')}
                                  </span>
                                ) : (
                                  <span>
                                    Tạo các biến thể món theo đơn vị (cốc, set, thùng). Mỗi biến thể có một quy tắc quy đổi riêng.
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              type="text"
                              style={{
                                color: '#1f2937',
                                fontWeight: 600,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsUnitPickerModalOpen(true);
                              }}
                            >
                              {totalUnitsCount > 1 ? `${totalUnitsCount} hàng cùng loại` : 'Thiết lập'}
                              <RightOutlined style={{ fontSize: 12, color: '#6b7280' }} />
                            </Button>
                          </div>
                        </Card>
                      );
                    })()}

                    {/* Card 3: Searchable Recipe Builder for Processed & Manufactured */}
                    {['Processed', 'Manufactured'].includes(productTypeWatch) && (
                      <Card
                        type="inner"
                        title={<span style={{ fontSize: 13, fontWeight: 700 }}>Định lượng Công thức Nguyên liệu (Bắt buộc)</span>}
                        size="small"
                        style={{ borderRadius: 8 }}
                        extra={
                          <Button type="dashed" icon={<PlusOutlined />} onClick={addRecipeItem} size="small">
                            + Thêm thành phần nguyên liệu
                          </Button>
                        }
                      >
                        {recipeItems.map((item, idx) => (
                          <Row key={idx} gutter={8} align="middle" style={{ marginBottom: 6 }}>
                            <Col span={13}>
                              <Select
                                showSearch
                                optionFilterProp="children"
                                placeholder="Gõ tìm tên hoặc mã SKU..."
                                value={item.productId}
                                onChange={(val) => {
                                  const updated = [...recipeItems];
                                  updated[idx].productId = val;
                                  setRecipeItems(updated);
                                }}
                                style={{ width: '100%' }}
                                size="small"
                              >
                                {availableIngredientsForType.map((p) => (
                                  <Select.Option key={p.id} value={p.id}>
                                    {p.name} [{p.skuCode || `ID:${p.id}`}] - ({p.type})
                                  </Select.Option>
                                ))}
                              </Select>
                            </Col>

                            <Col span={7}>
                              <InputNumber
                                min={0.001}
                                step={0.1}
                                size="small"
                                value={item.quantity}
                                onChange={(val) => {
                                  const updated = [...recipeItems];
                                  updated[idx].quantity = val;
                                  setRecipeItems(updated);
                                }}
                                addonBefore="Số lượng"
                                style={{ width: '100%' }}
                              />
                            </Col>

                            <Col span={4}>
                              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeRecipeItem(idx)} />
                            </Col>
                          </Row>
                        ))}
                      </Card>
                    )}
                  </div>
                ),
              },
              {
                key: 'desc',
                label: <span style={{ fontWeight: 600 }}>Mô tả chi tiết</span>,
                children: (
                  <div style={{ paddingTop: 12 }}>
                    <Form.Item name="description" label="Ghi chú & Mô tả chi tiết món ăn/sản phẩm">
                      <Input.TextArea rows={6} placeholder="Nhập mô tả chi tiết, hướng dẫn chế biến hoặc ghi chú..." />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'branch',
                label: <span style={{ color: '#9ca3af' }}>Chi nhánh sử dụng (Tạm để đó)</span>,
                disabled: true,
              },
            ]}
          />
        </Form>
      </Modal>

      {/* Quick Add New Group Inline Modal with higher zIndex */}
      <Modal
        title="Tạo mới Nhóm sản phẩm"
        open={isAddGroupModalOpen}
        onOk={handleQuickCreateGroup}
        onCancel={() => setIsAddGroupModalOpen(false)}
        confirmLoading={quickGroupLoading}
        okText="Tạo nhóm"
        cancelText="Hủy"
        size="small"
        width={400}
        zIndex={1100}
        destroyOnClose
      >
        <div style={{ paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Tên nhóm sản phẩm mới <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <Input
            placeholder="Ví dụ: Đồ uống, Đồ ăn nhanh, Topping..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onPressEnter={handleQuickCreateGroup}
          />
        </div>
      </Modal>

      {/* Quick Add New Unit Inline Modal with higher zIndex */}
      <Modal
        title="Tạo mới Đơn vị tính"
        open={isAddUnitModalOpen}
        onOk={handleQuickCreateUnit}
        onCancel={() => setIsAddUnitModalOpen(false)}
        confirmLoading={quickUnitLoading}
        okText="Tạo đơn vị"
        cancelText="Hủy"
        size="small"
        width={400}
        zIndex={1150}
        destroyOnClose
      >
        <div style={{ paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Tên đơn vị tính mới <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <Input
            placeholder="Ví dụ: Cốc, Chai, Lon, Thùng, Hộp, Gram, Kg..."
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            onPressEnter={handleQuickCreateUnit}
          />
        </div>
      </Modal>

      {/* Dynamic API Units Picker & Conversion Paper Modal (KiotViet Exact Design) */}
      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Chọn đơn vị tính</span>}
        open={isUnitPickerModalOpen}
        onOk={() => setIsUnitPickerModalOpen(false)}
        onCancel={() => setIsUnitPickerModalOpen(false)}
        okText="Xong"
        cancelText="Hủy"
        width={720}
        zIndex={1100}
        destroyOnClose
      >
        <div style={{ paddingTop: 4 }}>
          {/* Section 1: Dynamic Unit Tags List */}
          <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>
            Chọn đơn vị tính cho sản phẩm:
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 10px', marginBottom: 20 }}>
            {units.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                Chưa có đơn vị tính nào trong cơ sở dữ liệu. Nhấp "+ Tạo mới" để thêm!
              </div>
            ) : (
              units.map((unit) => {
                const isSelectedBase = unit.id === baseUnitId;
                const isSelectedDerived = derivedUnits.some((du) => du.unitId === unit.id);
                const isSelected = isSelectedBase || isSelectedDerived;

                return (
                  <Button
                    key={unit.id}
                    shape="round"
                    size="small"
                    style={{
                      borderRadius: 20,
                      fontSize: 12,
                      padding: '4px 16px',
                      borderColor: isSelected ? '#0284c7' : '#d1d5db',
                      backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#374151',
                      fontWeight: isSelected ? 600 : 400,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                    onClick={() => handleToggleUnitSelection(unit)}
                  >
                    {unit.name} {isSelectedBase ? ' (Cơ sở)' : isSelectedDerived ? ' (Quy đổi)' : ''}
                  </Button>
                );
              })
            )}

            {/* Custom Unit + Tạo mới Pill Tag */}
            <Button
              shape="round"
              size="small"
              type="dashed"
              style={{
                borderRadius: 20,
                fontSize: 12,
                padding: '4px 14px',
                borderColor: '#0284c7',
                color: '#0284c7',
                fontWeight: 600,
              }}
              icon={<PlusOutlined />}
              onClick={() => setIsAddUnitModalOpen(true)}
            >
              + Tạo mới
            </Button>
          </div>

          {/* Section 2: QUY ĐỔI ĐƠN VỊ CHO HÀNG HOÁ NÀY (KiotViet Exact Table Layout) */}
          {(baseUnitId || derivedUnits.length > 0) && (
            <div style={{ background: '#f9fafb', padding: 16, borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                QUY ĐỔI ĐƠN VỊ CHO HÀNG HOÁ NÀY
              </div>

              {/* Base Unit Selection Dropdown (Swap Logic) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  Đơn vị cơ bản <Tooltip title="Đơn vị nhỏ nhất để kiểm kho và tính toán"><InfoCircleOutlined style={{ color: '#9ca3af' }} /></Tooltip>:
                </span>
                {(() => {
                  const selectedUnits = units.filter(
                    (u) => u.id === baseUnitId || derivedUnits.some((du) => du.unitId === u.id)
                  );

                  return (
                    <Select
                      value={baseUnitId}
                      onChange={handleBaseUnitChange}
                      style={{ width: 180 }}
                      size="small"
                    >
                      {selectedUnits.map((u) => (
                        <Select.Option key={u.id} value={u.id}>
                          {u.name}
                        </Select.Option>
                      ))}
                    </Select>
                  );
                })()}
              </div>

              {/* Table of Derived Units Conversion Ratios */}
              {derivedUnits.length > 0 && (
                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  {/* Table Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>
                    <div style={{ width: '40%' }}>Đơn vị</div>
                    <div style={{ width: '50%', textAlign: 'right' }}>Giá trị quy đổi</div>
                    <div style={{ width: '10%', textAlign: 'right' }}></div>
                  </div>

                  {/* Table Rows */}
                  {derivedUnits.map((du, idx) => {
                    const derivedUnitObj = units.find((u) => u.id === du.unitId);
                    const baseUnitObj = units.find((u) => u.id === baseUnitId);

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          padding: '10px 16px',
                          borderBottom: idx === derivedUnits.length - 1 ? 'none' : '1px solid #f3f4f6',
                          fontSize: 13,
                        }}
                      >
                        {/* Column 1: Derived Unit Name */}
                        <div style={{ width: '40%', fontWeight: 500, color: '#1f2937' }}>
                          {derivedUnitObj?.name || `Đơn vị #${idx + 1}`}
                        </div>

                        {/* Column 2: Conversion Ratio Input + Base Unit Suffix */}
                        <div style={{ width: '50%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                          <InputNumber
                            min={1}
                            step={1}
                            size="small"
                            value={du.conversionPoint}
                            onChange={(val) => {
                              const updated = [...derivedUnits];
                              updated[idx].conversionPoint = val;
                              setDerivedUnits(updated);
                            }}
                            style={{ width: 90 }}
                          />
                          <span style={{ fontSize: 12, color: '#4b5563', fontWeight: 500 }}>
                            {baseUnitObj?.name || 'Đơn vị cơ bản'}
                          </span>
                        </div>

                        {/* Column 3: Trash Action Button */}
                        <div style={{ width: '10%', textAlign: 'right' }}>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeDerivedUnit(idx)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagementTab;
