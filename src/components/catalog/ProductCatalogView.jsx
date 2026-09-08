import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import CatalogHeaderNav from './CatalogHeaderNav';
import CatalogSidebar from './CatalogSidebar';
import ProductTable from './ProductTable';
import ProductPagination from './ProductPagination';
import PriceManagementTab from './PriceManagementTab';
import PromotionManagementTab from './PromotionManagementTab';

// Modals
import ProductTypeSelectModal from './modals/ProductTypeSelectModal';
import ProcessedProductModal from './modals/ProcessedProductModal';
import ManufacturedProductModal from './modals/ManufacturedProductModal';
import RegularProductModal from './modals/RegularProductModal';
import IngredientProductModal from './modals/IngredientProductModal';
import ToolProductModal from './modals/ToolProductModal';
import ProductDiscountModal from './modals/ProductDiscountModal';

import QuickAddGroupModal from './modals/QuickAddGroupModal';
import QuickAddMenuModal from './modals/QuickAddMenuModal';
import QuickAddUnitModal from './modals/QuickAddUnitModal';

// APIs
import {
  getAllProducts,
  deleteProduct,
} from '../../api/productApi';
import { getAllGroups, createGroup } from '../../api/groupApi';
import { getAllMenus, createMenu } from '../../api/menuApi';
import { getAllUnits, createUnit } from '../../api/unitApi';

const ProductCatalogView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'ProductCatalog';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sync activeTab when searchParams change in URL
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && currentTab !== activeTab) {
      handleTabChange(currentTab, false);
    }
  }, [searchParams]);

  // Master Data States
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [menus, setMenus] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Custom Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter States
  const [searchText, setSearchText] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [selectedSellableFilter, setSelectedSellableFilter] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals Visibility & State
  const [isTypeSelectModalOpen, setIsTypeSelectModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState('Regular');
  
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountingProduct, setDiscountingProduct] = useState(null);

  // Secondary Sub-Modals
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);

  // Fetch Master Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const { getAllPromotions } = await import('../../api/promotionApi');
      const [prodRes, groupRes, unitRes, menuRes, promoRes] = await Promise.all([
        getAllProducts(),
        getAllGroups(),
        getAllUnits(),
        getAllMenus(),
        getAllPromotions().catch(() => []),
      ]);
      setProducts(prodRes.data || []);
      setGroups(groupRes.data || []);
      setUnits(unitRes.data || []);
      setMenus(menuRes.data || []);
      setPromotions(promoRes || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu catalog:', err);
      showToast('error', 'Không thể tải dữ liệu danh mục sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Switch Tab with Complete State Cleanup
  const handleTabChange = (newTab, updateUrl = true) => {
    // 1. Clear search & filter states
    setSearchText('');
    setSelectedGroupIds([]);
    setSelectedTypes([]);
    setSelectedMenuIds([]);
    setSelectedSellableFilter('all');
    setSelectedRowKeys([]);

    // 2. Reset pagination
    setCurrentPage(1);

    // 3. Reset & close active modals and editing draft states
    setIsTypeSelectModalOpen(false);
    setIsFormModalOpen(false);
    setEditingProduct(null);
    setIsAddGroupOpen(false);
    setIsAddMenuOpen(false);
    setIsAddUnitOpen(false);

    // 4. Update tab state and sync URL
    setActiveTab(newTab);
    if (updateUrl) {
      setSearchParams({ tab: newTab });
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchText('');
    setSelectedGroupIds([]);
    setSelectedTypes([]);
    setSelectedMenuIds([]);
    setSelectedSellableFilter('all');
    setCurrentPage(1);
  };

  // Filtered Products Computation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Text Search (Code, Name)
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const codeMatch = p.skuCode && p.skuCode.toLowerCase().includes(query);
        const nameMatch = p.name && p.name.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch) return false;
      }

      // 2. Group Filter
      if (selectedGroupIds.length > 0) {
        if (!selectedGroupIds.includes(p.groupId)) return false;
      }

      // 3. Product Type Filter
      if (selectedTypes.length > 0) {
        const pType = p.type || p.productType;
        if (!selectedTypes.includes(pType)) return false;
      }

      // 4. Menu Filter
      if (selectedMenuIds.length > 0) {
        const pMenuIds = p.menuIds || (p.menuProducts ? p.menuProducts.map(m => m.menuId) : []);
        const hasMenuMatch = selectedMenuIds.some(mId => pMenuIds.includes(mId));
        if (!hasMenuMatch) return false;
      }

      // 5. Sellable Status Filter
      if (selectedSellableFilter === 'sellable' && !p.isSellable) return false;
      if (selectedSellableFilter === 'notSellable' && p.isSellable !== false) return false;

      return true;
    });
  }, [products, searchText, selectedGroupIds, selectedTypes, selectedMenuIds, selectedSellableFilter]);

  // Paginated Products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Action Handlers
  const handleSelectProductType = (type) => {
    setSelectedProductType(type);
    setEditingProduct(null);
    setIsTypeSelectModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleEditProduct = (prod) => {
    setEditingProduct(prod);
    const pType = prod.type || prod.productType || 'Regular';
    setSelectedProductType(pType);
    setIsFormModalOpen(true);
  };

  const handleDiscountProduct = (prod) => {
    setDiscountingProduct(prod);
    setIsDiscountModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      showToast('success', 'Xóa sản phẩm thành công!');
      fetchData();
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      showToast('error', err?.response?.data?.message || 'Không thể xóa sản phẩm.');
    }
  };

  // Quick Inline Creation Handlers
  const handleSaveQuickGroup = async (name) => {
    setQuickLoading(true);
    try {
      await createGroup({ name });
      showToast('success', 'Tạo nhóm hàng thành công!');
      setIsAddGroupOpen(false);
      const groupRes = await getAllGroups();
      setGroups(groupRes.data || []);
    } catch (err) {
      showToast('error', 'Không thể tạo nhóm hàng.');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleSaveQuickMenu = async (name) => {
    setQuickLoading(true);
    try {
      await createMenu({ name });
      showToast('success', 'Tạo thực đơn thành công!');
      setIsAddMenuOpen(false);
      const menuRes = await getAllMenus();
      setMenus(menuRes.data || []);
    } catch (err) {
      showToast('error', 'Không thể tạo thực đơn.');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleSaveQuickUnit = async (name) => {
    setQuickLoading(true);
    try {
      await createUnit({ name });
      showToast('success', 'Tạo đơn vị tính thành công!');
      setIsAddUnitOpen(false);
      const unitRes = await getAllUnits();
      setUnits(unitRes.data || []);
    } catch (err) {
      showToast('error', 'Không thể tạo đơn vị tính.');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#f8fafc',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* TOAST OVERLAY */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: toast.type === 'error' ? '#991b1b' : '#166534',
            background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: toast.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* TOP HEADER NAV BAR */}
      <CatalogHeaderNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenCreateTypeModal={() => setIsTypeSelectModalOpen(true)}
        onRefreshData={fetchData}
        totalProducts={products.length}
      />

      {/* MAIN CONTENT AREA BASED ON TAB */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'ProductCatalog' && (
          <>
            {/* LEFT SIDEBAR FILTERS */}
            <CatalogSidebar
              searchText={searchText}
              setSearchText={setSearchText}
              groups={groups}
              selectedGroupIds={selectedGroupIds}
              setSelectedGroupIds={setSelectedGroupIds}
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              menus={menus}
              selectedMenuIds={selectedMenuIds}
              setSelectedMenuIds={setSelectedMenuIds}
              selectedSellableFilter={selectedSellableFilter}
              setSelectedSellableFilter={setSelectedSellableFilter}
              onResetFilters={handleResetFilters}
              onOpenAddGroupModal={() => setIsAddGroupOpen(true)}
              onOpenAddMenuModal={() => setIsAddMenuOpen(true)}
            />

            {/* RIGHT CONTENT BODY: PRODUCT TABLE + PAGINATION */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ProductTable
                products={paginatedProducts}
                groups={groups}
                units={units}
                promotions={promotions}
                loading={loading}
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                onDiscountProduct={handleDiscountProduct}
              />
              <ProductPagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredProducts.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
              />
            </div>
          </>
        )}

        {activeTab === 'PricePromo' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <PriceManagementTab
              products={products}
              groups={groups}
              onRefreshData={fetchData}
              notifySuccess={(msg) => showToast('success', msg)}
              notifyError={(msg) => showToast('error', msg)}
            />
            <PromotionManagementTab />
          </div>
        )}
      </div>

      {/* MODALS */}
      <ProductTypeSelectModal
        open={isTypeSelectModalOpen}
        onCancel={() => setIsTypeSelectModalOpen(false)}
        onSelectType={handleSelectProductType}
      />

      {/* DEDICATED PRODUCT TYPE MODALS */}
      <ProcessedProductModal
        open={isFormModalOpen && selectedProductType === 'Processed'}
        onCancel={() => setIsFormModalOpen(false)}
        editingProduct={editingProduct}
        groups={groups}
        menus={menus}
        products={products}
        onSuccess={fetchData}
        notifySuccess={(msg) => showToast('success', msg)}
        notifyError={(msg) => showToast('error', msg)}
        onOpenAddGroup={() => setIsAddGroupOpen(true)}
        onOpenAddMenu={() => setIsAddMenuOpen(true)}
      />

      <ManufacturedProductModal
        open={isFormModalOpen && selectedProductType === 'Manufactured'}
        onCancel={() => setIsFormModalOpen(false)}
        editingProduct={editingProduct}
        groups={groups}
        units={units}
        menus={menus}
        products={products}
        onSuccess={fetchData}
        notifySuccess={(msg) => showToast('success', msg)}
        notifyError={(msg) => showToast('error', msg)}
        onOpenAddGroup={() => setIsAddGroupOpen(true)}
        onOpenAddUnit={() => setIsAddUnitOpen(true)}
      />

      <RegularProductModal
        open={isFormModalOpen && selectedProductType === 'Regular'}
        onCancel={() => setIsFormModalOpen(false)}
        editingProduct={editingProduct}
        groups={groups}
        units={units}
        menus={menus}
        onSuccess={fetchData}
        notifySuccess={(msg) => showToast('success', msg)}
        notifyError={(msg) => showToast('error', msg)}
        onOpenAddGroup={() => setIsAddGroupOpen(true)}
        onOpenAddUnit={() => setIsAddUnitOpen(true)}
      />

      <IngredientProductModal
        open={isFormModalOpen && selectedProductType === 'Ingredient'}
        onCancel={() => setIsFormModalOpen(false)}
        editingProduct={editingProduct}
        groups={groups}
        units={units}
        onSuccess={fetchData}
        notifySuccess={(msg) => showToast('success', msg)}
        notifyError={(msg) => showToast('error', msg)}
        onOpenAddGroup={() => setIsAddGroupOpen(true)}
        onOpenAddUnit={() => setIsAddUnitOpen(true)}
      />

      <ToolProductModal
        open={isFormModalOpen && selectedProductType === 'Tool'}
        onCancel={() => setIsFormModalOpen(false)}
        editingProduct={editingProduct}
        groups={groups}
        units={units}
        onSuccess={fetchData}
        notifySuccess={(msg) => showToast('success', msg)}
        notifyError={(msg) => showToast('error', msg)}
        onOpenAddGroup={() => setIsAddGroupOpen(true)}
        onOpenAddUnit={() => setIsAddUnitOpen(true)}
      />

      <QuickAddGroupModal
        open={isAddGroupOpen}
        onCancel={() => setIsAddGroupOpen(false)}
        onSave={handleSaveQuickGroup}
        loading={quickLoading}
      />

      <QuickAddMenuModal
        open={isAddMenuOpen}
        onCancel={() => setIsAddMenuOpen(false)}
        onSave={handleSaveQuickMenu}
        loading={quickLoading}
      />

      <QuickAddUnitModal
        open={isAddUnitOpen}
        onCancel={() => setIsAddUnitOpen(false)}
        onSave={handleSaveQuickUnit}
        loading={quickLoading}
      />

      {isDiscountModalOpen && discountingProduct && (
        <ProductDiscountModal
          product={discountingProduct}
          existingPromotion={promotions.find(p => p.products?.some(prod => prod.productId === discountingProduct.id))}
          onClose={() => {
            setIsDiscountModalOpen(false);
            setDiscountingProduct(null);
          }}
          onSuccess={() => {
            setIsDiscountModalOpen(false);
            setDiscountingProduct(null);
            fetchData();
          }}
          notifySuccess={(msg) => showToast('success', msg)}
          notifyError={(msg) => showToast('error', msg)}
        />
      )}
    </div>
  );
};

export default ProductCatalogView;
