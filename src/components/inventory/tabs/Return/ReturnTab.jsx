import React from 'react';
import ReturnSidebar from './ReturnSidebar';
import ReturnTable from './ReturnTable';

const ReturnTab = ({ returnsList = [] }) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <ReturnSidebar />
      <ReturnTable returnsList={returnsList} />
    </div>
  );
};

export default ReturnTab;
