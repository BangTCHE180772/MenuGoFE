import React from 'react';
import ProductSidebar from './ProductSidebar';
import ProductTable from './ProductTable';

const ProductTab = ({ dishes = [] }) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <ProductSidebar />
      <ProductTable dishes={dishes} />
    </div>
  );
};

export default ProductTab;
