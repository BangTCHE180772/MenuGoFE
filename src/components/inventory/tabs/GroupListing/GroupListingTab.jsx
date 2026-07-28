import React from 'react';
import GroupListingSidebar from './GroupListingSidebar';
import GroupListingTable from './GroupListingTable';

const GroupListingTab = ({ dishGroups = [] }) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <GroupListingSidebar />
      <GroupListingTable dishGroups={dishGroups} />
    </div>
  );
};

export default GroupListingTab;
