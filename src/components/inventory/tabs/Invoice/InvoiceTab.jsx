import React from 'react';
import InvoiceSidebar from './InvoiceSidebar';
import InvoiceTable from './InvoiceTable';

const InvoiceTab = ({ invoices = [] }) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <InvoiceSidebar />
      <InvoiceTable invoices={invoices} />
    </div>
  );
};

export default InvoiceTab;
