import React from 'react';
import InvoiceTable from './InvoiceTable';

const InvoiceTab = ({ invoices = [] }) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <InvoiceTable invoices={invoices} />
    </div>
  );
};

export default InvoiceTab;
