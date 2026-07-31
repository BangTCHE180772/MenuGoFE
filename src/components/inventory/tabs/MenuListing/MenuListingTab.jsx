import React from 'react';
import MenuListingSidebar from './MenuListingSidebar';
import MenuListingTable from './MenuListingTable';

const MenuListingTab = ({ menuList = [] }) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <MenuListingSidebar />
      <MenuListingTable menuList={menuList} />
    </div>
  );
};

export default MenuListingTab;
