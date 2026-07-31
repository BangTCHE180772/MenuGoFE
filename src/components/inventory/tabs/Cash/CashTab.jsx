import React from 'react';
import CashSidebar from './CashSidebar';
import CashTable from './CashTable';

const CashTab = ({ cashFlows = [] }) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <CashSidebar />
      <CashTable cashFlows={cashFlows} />
    </div>
  );
};

export default CashTab;
