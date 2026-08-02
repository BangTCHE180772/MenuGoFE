import React, { useState } from 'react';
import ProductSidebar from './ProductSidebar';
import ProductTable from './ProductTable';

const ProductTab = ({ dishes = [], selectedBranchId }) => {
  const [searchText, setSearchText] = useState('');
  const [subTab, setSubTab] = useState('nguyenlieu');
  const [statusFilter, setStatusFilter] = useState('ALL');

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      {/* LEFT SIDEBAR (SEARCH & FILTERS, NO HEADER TITLE) */}
      <ProductSidebar
        searchText={searchText}
        setSearchText={setSearchText}
        subTab={subTab}
        setSubTab={setSubTab}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* RIGHT CONTENT TABLE */}
      <ProductTable
        dishes={dishes}
        selectedBranchId={selectedBranchId}
        searchText={searchText}
        subTab={subTab}
        statusFilter={statusFilter}
      />
    </div>
  );
};

export default ProductTab;
