import React from 'react';
import InventoryManagementTab from '../components/inventory/InventoryManagementTab';

const InventoryManagementPage = () => {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#f0f2f5', padding: '12px 16px' }}>
      <InventoryManagementTab />
    </div>
  );
};

export default InventoryManagementPage;
