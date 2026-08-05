import React, { useState } from 'react';
import ProductTable from './ProductTable';

const ProductTab = ({ dishes = [], selectedBranchId }) => {
  const [searchText, setSearchText] = useState('');
  const [subTab, setSubTab] = useState('nguyenlieu');
  const [statusFilter, setStatusFilter] = useState('ALL');

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <ProductTable
        dishes={dishes}
        selectedBranchId={selectedBranchId}
        searchText={searchText}
        setSearchText={setSearchText}
        subTab={subTab}
        setSubTab={setSubTab}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
};

export default ProductTab;
