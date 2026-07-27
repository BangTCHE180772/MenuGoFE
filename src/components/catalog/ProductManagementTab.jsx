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
  Alert,
  Dropdown,
  Avatar,
  Typography,
  Tabs,
  Pagination,
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
import { getAllMenus, createMenu } from '../../api/menuApi';
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
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);

  // KiotViet Left Filter Panel Multi-Select States
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [selectedSellableFilter, setSelectedSellableFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form] = Form.useForm();
  const [productTypeWatch, setProductTypeWatch] = useState('Regular');
  const [baseUnitId, setBaseUnitId] = useState(null);
  const [derivedUnits, setDerivedUnits] = useState([]);
  const [recipeItems, setRecipeItems] = useState([]);
  const [imageUrlWatch, setImageUrlWatch] = useState('');
  const [isManageQuantityWatch, setIsManageQuantityWatch] = useState(false);
  const [activeModalTabKey, setActiveModalTabKey] = useState('info');

  // KiotViet Unit & Recipe Paper Modal States
  const [isUnitPickerModalOpen, setIsUnitPickerModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Inline Quick Group & Unit Creation States
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [quickGroupLoading, setQuickGroupLoading] = useState(false);

  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [quickMenuLoading, setQuickMenuLoading] = useState(false);

  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [quickUnitLoading, setQuickUnitLoading] = useState(false);

  const [notifyApi, notificationContextHolder] = notification.useNotification();

  // Custom Styled TopRight Notification Helpers (Soft Red for Errors, Soft Green for Success)
  const notifySuccess = (msg, desc = '') => {
    notifyApi.success({
      title: msg,
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
      title: msg,
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
      title: msg,
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

  const fetchMenus = async () => {
    try {
      const resMenu = await getAllMenus();
      const menuList = Array.isArray(resMenu.data) ? resMenu.data : resMenu.data?.$values || resMenu.data?.items || [];
      setMenus(menuList);
    } catch (err) {
      console.error('Error fetching menus:', err);
    }
  };

  const handleQuickCreateMenu = async () => {
    if (!newMenuName.trim()) {
      notifyWarning('Vui lòng nhập tên thực đơn mới!');
      return;
    }
    setQuickMenuLoading(true);
    try {
      const res = await createMenu({
        name: newMenuName.trim(),
      });
      const created = res.data;
      setMenus((prev) => [...prev, created]);
      const currentMenuIds = form.getFieldValue('menuIds') || [];
      form.setFieldsValue({ menuIds: [...currentMenuIds, created.id] });
      notifySuccess('Tạo thực đơn mới thành công!');
      setIsAddMenuModalOpen(false);
      setNewMenuName('');
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || 'Không thể tạo thực đơn mới.';
      notifyError('Tạo thực đơn thất bại', errMsg);
    } finally {
      setQuickMenuLoading(false);
    }
  };

  const handleToggleUnitSelection = (unit) => {
    if (['Processed', 'Manufactured'].includes(productTypeWatch)) {
      setBaseUnitId(unit.id);
      setDerivedUnits([]);
      form.setFieldsValue({ baseUnitId: unit.id });
      notifySuccess(`Đã chọn đơn vị cơ bản: ${unit.name}`);
      return;
    }

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
      const [resProd, resGroup, resUnit, resMenu] = await Promise.all([
        getAllProducts(),
        getAllGroups(),
        getAllUnits(),
        getAllMenus(),
      ]);
      const prodList = Array.isArray(resProd.data) ? resProd.data : resProd.data?.$values || [];
      const groupList = Array.isArray(resGroup.data) ? resGroup.data : resGroup.data?.$values || resGroup.data?.items || [];
      const menuList = Array.isArray(resMenu.data) ? resMenu.data : resMenu.data?.$values || resMenu.data?.items || [];

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
      setMenus(menuList);
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

  const handleGroupFilterChange = (vals) => {
    if (vals.includes('ALL')) {
      if (vals[vals.length - 1] === 'ALL') {
        setSelectedGroupIds([]);
      } else {
        setSelectedGroupIds(vals.filter((v) => v !== 'ALL'));
      }
    } else {
      setSelectedGroupIds(vals);
    }
  };

  const handleTypeFilterChange = (vals) => {
    if (vals.includes('ALL')) {
      if (vals[vals.length - 1] === 'ALL') {
        setSelectedTypes([]);
      } else {
        setSelectedTypes(vals.filter((v) => v !== 'ALL'));
      }
    } else {
      setSelectedTypes(vals);
    }
  };

  const handleMenuFilterChange = (vals) => {
    if (vals.includes('ALL')) {
      if (vals[vals.length - 1] === 'ALL') {
        setSelectedMenuIds([]);
      } else {
        setSelectedMenuIds(vals.filter((v) => v !== 'ALL'));
      }
    } else {
      setSelectedMenuIds(vals);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Filter by Types (Multi-select)
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) {
        return false;
      }

      // Filter by Groups (Multi-select)
      if (selectedGroupIds.length > 0 && !selectedGroupIds.includes(p.groupId)) {
        return false;
      }

      // Filter by Menus (Multi-select)
      if (selectedMenuIds.length > 0) {
        const productMenuIds = p.menuProducts?.map((mp) => mp.menuId) || [];
        const isInSelectedMenu = selectedMenuIds.some((mId) => productMenuIds.includes(mId));
        if (!isInSelectedMenu) return false;
      }

      // Filter by Sellable Status
      if (selectedSellableFilter === 'sellable' && !p.isSellable) {
        return false;
      }
      if (selectedSellableFilter === 'not_sellable' && p.isSellable) {
        return false;
      }

      // Search Text
      if (searchText) {
        const text = searchText.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(text);
        const matchSKU = p.skuCode?.toLowerCase().includes(text);
        if (!matchName && !matchSKU) return false;
      }

      return true;
    });
  }, [products, selectedTypes, selectedGroupIds, selectedMenuIds, selectedSellableFilter, searchText]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTypes, selectedGroupIds, selectedMenuIds, selectedSellableFilter, searchText]);

  const pagedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

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

    const initialBaseUnitId = null;
    setBaseUnitId(initialBaseUnitId);
    setDerivedUnits([]);
    setRecipeItems([]);

    setIsManageQuantityWatch(false);
    setActiveModalTabKey('info');
    form.setFieldsValue({
      type,
      isSellable: true,
      isManageQuantity: false,
      minStorage: 0,
      maxStorage: 1000000000,
      sellPrice: 0,
      chainId: user?.chainId || 1,
      baseUnitId: null,
      menuIds: [],
    });

    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    form.resetFields();

    setProductTypeWatch(prod.type);
    setImageUrlWatch(prod.imageUrl || '');
    setIsManageQuantityWatch(prod.isManageQuantity || false);
    setActiveModalTabKey('info');

    form.setFieldsValue({
      id: prod.id,
      groupId: prod.groupId,
      chainId: prod.chainId || user?.chainId || 1,
      type: prod.type,
      name: prod.name,
      description: prod.description,
      skuCode: prod.skuCode,
      imageUrl: prod.imageUrl,
      isSellable: prod.isSellable,
      isManageQuantity: prod.isManageQuantity || false,
      minStorage: prod.minStorage ?? 0,
      maxStorage: prod.maxStorage ?? 1000000000,
      sellPrice: prod.sellPrice,
      menuIds: prod.menuProducts?.map((mp) => mp.menuId) || [],
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

      const unitConversionsPayload = baseUnitId
        ? [{ unitId: baseUnitId, conversionPoint: 1, isBase: true }]
        : [];

      if (baseUnitId && !['Processed', 'Manufactured'].includes(productTypeWatch)) {
        for (const du of derivedUnits) {
          const pointInt = Math.round(Number(du.conversionPoint) || 0);
          if (pointInt < 2 || pointInt > 1000000) {
            notifyWarning('Giá trị quy đổi của đơn vị phụ phải là số nguyên từ 2 đến 1.000.000 (1 triệu)!');
            return;
          }
          unitConversionsPayload.push({
            unitId: du.unitId,
            conversionPoint: pointInt,
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
          if (!item.quantity || item.quantity < 0.001 || item.quantity > 1000000) {
            notifyWarning('Số lượng nguyên liệu trong công thức phải từ 0,001 đến 1.000.000 (1 triệu)!');
            return;
          }
        }
      }

      const payload = {
        ...values,
        type: productTypeWatch,
        chainId: user?.chainId || 1,
        baseUnitId: baseUnitId,
        unitConversions: unitConversionsPayload,
      };

      if (!payload.skuCode || !payload.skuCode.trim()) {
        delete payload.skuCode;
      } else {
        payload.skuCode = payload.skuCode.trim();
      }

      if (['Processed', 'Manufactured'].includes(productTypeWatch)) {
        payload.recipe = { details: recipeItems };
      } else {
        delete payload.recipe;
      }

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
      console.error('Error saving product:', err);
      const resData = err?.response?.data;
      let errMessage = 'Vui lòng kiểm tra lại thông tin sản phẩm.';
      if (typeof resData === 'string' && resData.trim()) {
        errMessage = resData;
      } else if (resData?.message) {
        errMessage = resData.message;
      } else if (resData?.detail) {
        errMessage = resData.detail;
      } else if (resData?.title) {
        errMessage = resData.title;
      } else if (resData?.errors) {
        errMessage = Object.values(resData.errors).flat().join(', ');
      }
      notifyError('Lưu sản phẩm thất bại (400)', errMessage);
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
      if (!p.isActive) return false;
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
  // Helper: truncated text cell with tooltip on hover
  const TruncatedCell = ({ text, style = {} }) => (
    <Tooltip title={text} placement="topLeft">
      <span
        title={text}
        style={{
          display: 'inline-block',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          verticalAlign: 'middle',
          ...style,
        }}
      >
        {text}
      </span>
    </Tooltip>
  );

  const columns = [
    {
      title: 'Mã hàng',
      key: 'imageSku',
      width: '14%',
      ellipsis: true,
      render: (_, record) => (
        <Space size="small" style={{ flexWrap: 'nowrap', width: '100%', overflow: 'hidden' }}>
          {record.imageUrl ? (
            <Avatar src={record.imageUrl} shape="square" size={26} style={{ flexShrink: 0 }} />
          ) : (
            <Avatar icon={<PictureOutlined />} shape="square" size={26} style={{ background: '#f3f4f6', color: '#9ca3af', flexShrink: 0 }} />
          )}
          <TruncatedCell
            text={record.skuCode || 'N/A'}
            style={{ fontSize: 11.5, fontWeight: 600, color: '#1d4ed8', fontFamily: 'monospace' }}
          />
        </Space>
      ),
    },
    {
      title: 'Tên hàng hóa',
      dataIndex: 'name',
      key: 'name',
      width: '32%',
      ellipsis: true,
      render: (text, record) => {
        const baseUnitObj = record.unitConversions?.find((uc) => !uc.baseId);
        const baseUnitName = units.find((u) => u.id === baseUnitObj?.unitId)?.name;
        return (
          <Space size="small" style={{ flexWrap: 'nowrap', width: '100%', overflow: 'hidden' }}>
            <TruncatedCell
              text={text}
              style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}
            />
            {baseUnitName && (
              <Tag title={baseUnitName} style={{ margin: 0, fontSize: 10, background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '0 4px', flexShrink: 0 }}>
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
      width: '18%',
      ellipsis: true,
      render: (groupId) => {
        const gName = groups.find((g) => g.id === groupId)?.name || 'Chưa phân nhóm';
        return (
          <Tooltip title={gName} placement="topLeft">
            <Tag
              title={gName}
              style={{
                borderRadius: 10,
                padding: '0 6px',
                fontSize: 10,
                border: '1px solid #e5e7eb',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {gName}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Loại món',
      dataIndex: 'type',
      key: 'type',
      width: '12%',
      ellipsis: true,
      render: (type) => {
        const typeObj = PRODUCT_TYPES.find((t) => t.value === type) || { label: type, color: 'default' };
        return (
          <Tooltip title={typeObj.label} placement="topLeft">
            <Tag
              title={typeObj.label}
              color={typeObj.color}
              style={{
                borderRadius: 8,
                fontSize: 10,
                padding: '0 6px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {typeObj.label}
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
      width: '12%',
      ellipsis: true,
      render: (val) => {
        const display = val ? val.toLocaleString('vi-VN') : '0';
        return (
          <Tooltip title={display} placement="topRight">
            <span
              title={display}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#0f172a',
                display: 'inline-block',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {display}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Cho phép bán',
      dataIndex: 'isSellable',
      key: 'isSellable',
      align: 'center',
      width: '12%',
      ellipsis: true,
      render: (isSellable) => {
        const text = isSellable ? 'Cho phép bán' : 'Ngừng bán';
        return (
          <Tooltip title={text} placement="top">
            <Tag
              title={text}
              color={isSellable ? 'success' : 'error'}
              style={{
                borderRadius: 10,
                fontSize: 10.5,
                padding: '0 8px',
                fontWeight: 600,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {text}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'center',
      width: 90,
      fixed: 'right',
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
            styles={{ body: { padding: '14px', flex: 1, overflowY: 'auto' } }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                Bộ lọc sản phẩm
              </span>
              {(selectedGroupIds.length > 0 || selectedTypes.length > 0 || selectedMenuIds.length > 0 || selectedSellableFilter !== 'all') && (
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, fontSize: 11, color: '#ef4444' }}
                  onClick={() => {
                    setSelectedGroupIds([]);
                    setSelectedTypes([]);
                    setSelectedMenuIds([]);
                    setSelectedSellableFilter('all');
                  }}
                >
                  Xóa lọc
                </Button>
              )}
            </div>

            {/* 1. Nhóm quản lý (Multi-select + Scroll Y + ALL option) */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                Nhóm quản lý
              </div>
              <div style={{ maxHeight: 76, overflowY: 'auto', borderRadius: 6 }}>
                <Select
                  mode="multiple"
                  placeholder="Tất cả nhóm món"
                  value={selectedGroupIds.length === 0 ? ['ALL'] : selectedGroupIds}
                  onChange={handleGroupFilterChange}
                  onFocus={fetchGroups}
                  style={{ width: '100%', fontSize: 12 }}
                  size="small"
                  allowClear
                >
                  <Select.Option key="ALL" value="ALL" style={{ fontWeight: 600, color: '#2563eb' }}>
                    Tất cả nhóm món
                  </Select.Option>
                  {groups.map((g) => (
                    <Select.Option key={g.id} value={g.id}>
                      {g.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* 2. Loại món (Multi-select + Scroll Y + ALL option) */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                Loại món
              </div>
              <div style={{ maxHeight: 76, overflowY: 'auto', borderRadius: 6 }}>
                <Select
                  mode="multiple"
                  placeholder="Tất cả loại món"
                  value={selectedTypes.length === 0 ? ['ALL'] : selectedTypes}
                  onChange={handleTypeFilterChange}
                  style={{ width: '100%', fontSize: 12 }}
                  size="small"
                  allowClear
                >
                  <Select.Option key="ALL" value="ALL" style={{ fontWeight: 600, color: '#2563eb' }}>
                    Tất cả loại món
                  </Select.Option>
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
            </div>

            {/* 3. Thực đơn (Multi-select + Scroll Y + ALL option) */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                Thực đơn
              </div>
              <div style={{ maxHeight: 76, overflowY: 'auto', borderRadius: 6 }}>
                <Select
                  mode="multiple"
                  placeholder="Tất cả thực đơn"
                  value={selectedMenuIds.length === 0 ? ['ALL'] : selectedMenuIds}
                  onChange={handleMenuFilterChange}
                  onFocus={fetchMenus}
                  style={{ width: '100%', fontSize: 12 }}
                  size="small"
                  allowClear
                >
                  <Select.Option key="ALL" value="ALL" style={{ fontWeight: 600, color: '#2563eb' }}>
                    Tất cả thực đơn
                  </Select.Option>
                  {menus.map((m) => (
                    <Select.Option key={m.id} value={m.id}>
                      {m.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* 4. Cho phép bán (Sellable Status Filter) */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 6 }}>
                Cho phép bán
              </div>
              <Radio.Group
                value={selectedSellableFilter}
                onChange={(e) => setSelectedSellableFilter(e.target.value)}
                style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}
              >
                <Radio value="all" style={{ fontSize: 12 }}>Tất cả (Bán & Không bán)</Radio>
                <Radio value="sellable" style={{ fontSize: 12 }}>Cho phép bán</Radio>
                <Radio value="not_sellable" style={{ fontSize: 12 }}>Không cho phép bán</Radio>
              </Radio.Group>
            </div>
          </Card>
        </Col>

        {/* KiotViet Main Data Table Area with Internal Scroll */}
        <Col xs={24} sm={24} md={18} lg={19} style={{ height: '100%' }}>
          <Card
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
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
            {/* Table Container with Internal Scroll */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Table
                className="kiotviet-table"
                rowSelection={{
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }}
                columns={columns}
                dataSource={pagedProducts}
                rowKey="id"
                loading={loading}
                size="small"
                scroll={{ y: 'calc(100vh - 235px)' }}
                pagination={false}
              />
            </div>

            {/* Fixed Sticky Footer Pagination Bar at Content Bottom */}
            <div
              style={{
                padding: '10px 18px',
                background: '#ffffff',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                zIndex: 10,
                boxShadow: '0 -2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>
                Tổng số: <strong style={{ color: '#0284c7', fontWeight: 700 }}>{filteredProducts.length}</strong> sản phẩm
              </div>

              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredProducts.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger
                pageSizeOptions={['10', '20', '50', '100']}
                size="small"
              />
            </div>
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
        onCancel={() => setIsFormModalOpen(false)}
        width={760}
        footer={null}
        destroyOnHidden
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" size="small" requiredMark={false}>
          <Tabs
            activeKey={activeModalTabKey}
            onChange={(key) => setActiveModalTabKey(key)}
            items={[
              {
                key: 'info',
                label: <span style={{ fontWeight: 600 }}>Thông tin</span>,
                children: (
                  <div style={{ paddingTop: 8 }}>
                    {/* Top Row: Left Inputs (14) + Right Single Image Box (10) */}
                    <Row gutter={16}>
                      <Col span={14}>
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

                        {/* Row: Nhóm hàng (12) + Thuộc thực đơn (12) */}
                        <Row gutter={12} style={{ marginBottom: 16 }}>
                          <Col span={12}>
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
                          </Col>

                          <Col span={12}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Thuộc thực đơn
                              </span>
                              <Button
                                type="link"
                                size="small"
                                style={{ padding: 0, fontSize: 12, fontWeight: 600, color: '#2563eb', flexShrink: 0, marginLeft: 4 }}
                                onClick={() => setIsAddMenuModalOpen(true)}
                              >
                                + Tạo mới
                              </Button>
                            </div>

                            <Form.Item name="menuIds" noStyle>
                              <div style={{ maxHeight: 76, overflowY: 'auto', borderRadius: 6 }}>
                                <Select
                                  mode="multiple"
                                  placeholder="Chọn thực đơn"
                                  style={{ width: '100%' }}
                                  onFocus={fetchMenus}
                                  allowClear
                                >
                                  {menus.map((m) => (
                                    <Select.Option key={m.id} value={m.id}>
                                      {m.name}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </div>
                            </Form.Item>
                          </Col>
                        </Row>
                      </Col>

                      {/* Right Single Image Upload / URL Preview Frame */}
                      <Col span={10}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                          Ảnh sản phẩm (Tối đa 1 ảnh)
                        </div>
                        <div
                          style={{
                            border: '2px dashed #e5e7eb',
                            borderRadius: 8,
                            padding: 8,
                            textAlign: 'center',
                            background: '#fafafa',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            aspectRatio: '1 / 1',
                            width: '100%',
                            maxHeight: 185,
                          }}
                        >
                          {imageUrlWatch ? (
                            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <img
                                src={imageUrlWatch}
                                alt="Preview"
                                style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 8, marginBottom: 4 }}
                              />
                              <div>
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  style={{ padding: 0, fontSize: 11 }}
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
                              <PictureOutlined style={{ fontSize: 40, color: '#9ca3af', marginBottom: 4 }} />
                              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
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
                      title={<span style={{ fontSize: 12, fontWeight: 700 }}>Giá & Thuế</span>}
                      size="small"
                      style={{ marginBottom: 12, borderRadius: 8 }}
                    >
                      <Form.Item
                        name="sellPrice"
                        label={<span style={{ fontSize: 11.5, fontWeight: 600 }}>Giá bán (VNĐ) <span style={{ color: '#ef4444' }}>*</span></span>}
                        rules={[{ required: true, message: 'Nhập giá bán' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          formatter={(val) => (val != null && val !== '' ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                          parser={(val) => (val ? val.replace(/\$\s?|(,*)/g, '') : '')}
                          min={0}
                        />
                      </Form.Item>
                    </Card>

                    {/* Card: Quản lý tồn kho (Chỉ hiển thị với Tool, Regular, Ingredient, Manufactured) */}
                    {productTypeWatch !== 'Processed' && (
                      <Card
                        type="inner"
                        size="small"
                        style={{
                          marginBottom: 12,
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 2px' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                              Quản lý tồn kho
                            </div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                              {isManageQuantityWatch
                                ? 'Đang bật theo dõi hạn mức số lượng tồn kho cho sản phẩm này.'
                                : 'Bật nếu muốn thiết lập định mức cảnh báo tồn tối thiểu & tối đa.'}
                            </div>
                          </div>

                          <Form.Item name="isManageQuantity" valuePropName="checked" noStyle>
                            <Switch
                              size="small"
                              onChange={(checked) => setIsManageQuantityWatch(checked)}
                            />
                          </Form.Item>
                        </div>

                        {isManageQuantityWatch && (
                          <Row gutter={12} style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
                            <Col span={12}>
                              <Form.Item
                                name="minStorage"
                                label={<span style={{ fontSize: 11.5, fontWeight: 600 }}>Tồn tối thiểu <span style={{ color: '#ef4444' }}>*</span></span>}
                                rules={[{ required: true, message: 'Nhập định mức tồn tối thiểu' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  min={0}
                                  max={1000000000}
                                  formatter={(val) => (val != null && val !== '' ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                                  parser={(val) => (val ? val.replace(/\$\s?|(,*)/g, '') : '')}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="maxStorage"
                                label={<span style={{ fontSize: 11.5, fontWeight: 600 }}>Tồn tối đa <span style={{ color: '#ef4444' }}>*</span></span>}
                                rules={[{ required: true, message: 'Nhập định mức tồn tối đa' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  min={0}
                                  max={1000000000}
                                  formatter={(val) => (val != null && val !== '' ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                                  parser={(val) => (val ? val.replace(/\$\s?|(,*)/g, '') : '')}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        )}
                      </Card>
                    )}

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
                                    Chưa thiết lập đơn vị tính. Nhấp vào đây nếu muốn chọn đơn vị tính cho sản phẩm.
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

                    {/* Card 3: Exact Paper Summary Card for Recipe Builder (Processed & Manufactured) */}
                    {['Processed', 'Manufactured'].includes(productTypeWatch) && (
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
                        onClick={() => setIsRecipeModalOpen(true)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                              Định lượng Công thức Nguyên liệu <span style={{ color: '#ef4444' }}>*</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                              {recipeItems.length > 0 ? (
                                <span>
                                  Món được chế biến từ <strong>{recipeItems.length} thành phần</strong> (
                                  {recipeItems
                                    .map((ri) => products.find((p) => p.id === ri.productId)?.name)
                                    .filter(Boolean)
                                    .join(', ')}
                                  )
                                </span>
                              ) : (
                                <span style={{ color: '#ef4444', fontWeight: 500 }}>
                                  Chưa có công thức. Món chế biến & thành phẩm bắt buộc phải có ít nhất 1 thành phần!
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
                              setIsRecipeModalOpen(true);
                            }}
                          >
                            {recipeItems.length > 0 ? `${recipeItems.length} thành phần` : 'Thiết lập'}
                            <RightOutlined style={{ fontSize: 12, color: '#6b7280' }} />
                          </Button>
                        </div>
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
                    <Form.Item name="description" label={<span style={{ fontSize: 12, fontWeight: 600 }}>Ghi chú & Mô tả chi tiết</span>}>
                      <Input.TextArea rows={6} placeholder="Nhập mô tả chi tiết, hướng dẫn chế biến hoặc ghi chú..." />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'branch',
                label: <span style={{ color: '#9ca3af' }}>Chi nhánh sử dụng</span>,
                disabled: true,
              },
            ]}
          />

          {/* Sticky Modal Bottom Footer Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
              marginTop: 14,
              borderTop: '1px solid #f3f4f6',
            }}
          >
            <div style={{ display: activeModalTabKey !== 'desc' ? 'block' : 'none' }}>
              <Form.Item name="isSellable" valuePropName="checked" noStyle>
                <Space size="small" style={{ cursor: 'pointer' }}>
                  <Switch size="small" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Cho phép bán</span>
                </Space>
              </Form.Item>
            </div>

            <Space>
              <Button onClick={() => setIsFormModalOpen(false)} style={{ borderRadius: 6, fontSize: 12 }}>
                Hủy
              </Button>
              <Button type="primary" danger onClick={handleSaveProduct} style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                Lưu
              </Button>
            </Space>
          </div>
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
        destroyOnHidden
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

      {/* Quick Add New Menu Inline Modal with higher zIndex */}
      <Modal
        title="Tạo mới Thực đơn"
        open={isAddMenuModalOpen}
        onOk={handleQuickCreateMenu}
        onCancel={() => setIsAddMenuModalOpen(false)}
        confirmLoading={quickMenuLoading}
        okText="Tạo thực đơn"
        cancelText="Hủy"
        size="small"
        width={400}
        zIndex={1100}
        destroyOnHidden
      >
        <div style={{ paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Tên thực đơn mới <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <Input
            placeholder="Ví dụ: Thực đơn sáng, Thực đơn chính, Thực đơn khuyến mãi..."
            value={newMenuName}
            onChange={(e) => setNewMenuName(e.target.value)}
            onPressEnter={handleQuickCreateMenu}
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
        destroyOnHidden
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
        destroyOnHidden
      >
        <div style={{ paddingTop: 4 }}>
          {['Processed', 'Manufactured'].includes(productTypeWatch) && (
            <Alert
              type="info"
              showIcon
              message="Sản phẩm loại Chế biến & Thành phẩm chỉ được chọn 1 Đơn vị cơ sở duy nhất (Không sử dụng đơn vị quy đổi phụ)."
              style={{ marginBottom: 14, borderRadius: 8, fontSize: 12 }}
            />
          )}

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
          {!['Processed', 'Manufactured'].includes(productTypeWatch) && (baseUnitId || derivedUnits.length > 0) && (
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
                            min={2}
                            max={1000000}
                            step={1}
                            size="small"
                            value={du.conversionPoint}
                            onChange={(val) => {
                              const updated = [...derivedUnits];
                              updated[idx].conversionPoint = val;
                              setDerivedUnits(updated);
                            }}
                            style={{ width: 100 }}
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

      {/* Recipe Paper Modal for Processed & Manufactured Products (Exact KiotViet Design) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExperimentOutlined style={{ color: '#0284c7', fontSize: 18 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Thiết lập công thức chế biến
            </span>
          </div>
        }
        open={isRecipeModalOpen}
        onOk={() => setIsRecipeModalOpen(false)}
        onCancel={() => setIsRecipeModalOpen(false)}
        okText="Xong"
        cancelText="Hủy"
        width={780}
        zIndex={1100}
        destroyOnHidden
      >
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          {/* Header Title & Subtitle */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
              Thành phần nguyên liệu
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
              Thêm công thức để tự động trừ tồn và tính giá vốn dựa trên nguyên liệu
            </div>
          </div>

          {/* Top Control Bar with Search Input */}
          <div style={{ marginBottom: 16 }}>
            <Select
              showSearch
              allowClear
              size="middle"
              placeholder="🔍 Thêm hàng thành phần"
              filterOption={(input, option) =>
                (option?.searchValue || '').toLowerCase().includes(input.toLowerCase())
              }
              onSelect={(val) => {
                if (recipeItems.some((ri) => ri.productId === val)) {
                  notifyWarning('Nguyên liệu này đã có trong công thức!');
                  return;
                }
                setRecipeItems([...recipeItems, { productId: val, quantity: 1 }]);
                notifySuccess('Đã thêm thành phần vào công thức!');
              }}
              value={undefined}
              style={{ width: 320 }}
            >
              {products
                .filter((p) => {
                  if (p.isActive === false) return false;
                  if (editingProduct && p.id === editingProduct.id) return false;
                  return ['Ingredient', 'Regular', 'Manufactured', 'Processed'].includes(p.type);
                })
                .map((p) => {
                  const baseUnitName =
                    units.find((u) => {
                      const baseUc = p.unitConversions?.find((uc) => !uc.baseId);
                      return u.id === (baseUc ? baseUc.unitId : p.baseUnitId);
                    })?.name || 'đơn vị';

                  const searchLabel = `${p.skuCode || ''} ${p.name}`.trim();

                  return (
                    <Select.Option key={p.id} value={p.id} searchValue={searchLabel}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <strong style={{ color: '#0284c7' }}>{p.skuCode || 'SP'}</strong> - {p.name}
                        </span>
                        <Tag color="blue" style={{ fontSize: 11 }}>Đơn vị: {baseUnitName}</Tag>
                      </div>
                    </Select.Option>
                  );
                })}
            </Select>
          </div>

          {/* Table Container */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {/* Table Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                background: '#f3f4f6',
                borderBottom: '1px solid #e5e7eb',
                fontSize: 12,
                fontWeight: 700,
                color: '#374151',
              }}
            >
              <div style={{ width: '20%' }}>Mã hàng</div>
              <div style={{ width: '40%' }}>Tên món thành phần</div>
              <div style={{ width: '15%' }}>Đơn vị tính</div>
              <div style={{ width: '20%', textAlign: 'right' }}>Số lượng</div>
              <div style={{ width: '5%', textAlign: 'right' }}></div>
            </div>

            {/* Table Body / Empty State */}
            {recipeItems.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                Chưa có hàng thành phần
              </div>
            ) : (
              recipeItems.map((item, idx) => {
                const ingredientObj = products.find((p) => p.id === item.productId);
                const baseUnitName =
                  units.find((u) => {
                    const baseUc = ingredientObj?.unitConversions?.find((uc) => !uc.baseId);
                    return u.id === (baseUc ? baseUc.unitId : ingredientObj?.baseUnitId);
                  })?.name || 'Đơn vị';

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: idx === recipeItems.length - 1 ? 'none' : '1px solid #f3f4f6',
                      fontSize: 13,
                    }}
                  >
                    {/* Column 1: Mã hàng */}
                    <div style={{ width: '20%', fontWeight: 600, color: '#0284c7' }}>
                      {ingredientObj?.skuCode || `SP${item.productId}`}
                    </div>

                    {/* Column 2: Tên món thành phần */}
                    <div style={{ width: '40%', fontWeight: 500, color: '#1f2937' }}>
                      {ingredientObj?.name || `Sản phẩm #${item.productId}`}
                    </div>

                    {/* Column 3: Đơn vị tính */}
                    <div style={{ width: '15%', color: '#4b5563', fontSize: 12 }}>
                      <Tag color="cyan">{baseUnitName}</Tag>
                    </div>

                    {/* Column 4: Số lượng InputNumber [0.001 - 1,000,000] */}
                    <div style={{ width: '20%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                      <InputNumber
                        min={0.001}
                        max={1000000}
                        step={0.1}
                        precision={3}
                        size="small"
                        value={item.quantity}
                        onChange={(val) => {
                          const updated = [...recipeItems];
                          updated[idx].quantity = val;
                          setRecipeItems(updated);
                        }}
                        style={{ width: 110 }}
                      />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{baseUnitName}</span>
                    </div>

                    {/* Column 5: Trash Action */}
                    <div style={{ width: '5%', textAlign: 'right' }}>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeRecipeItem(idx)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagementTab;
