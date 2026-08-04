import React from 'react';

const MenuListingSidebar = () => {
  return (
    <div
      style={{
        width: 190,
        minWidth: 190,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        color: '#475569',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 11,
        padding: '10px 12px',
        userSelect: 'none'
      }}
    >
      <div style={{ paddingBottom: 6, marginBottom: 10, borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 11, color: '#e8442a' }}>
        THỰC ĐƠN
      </div>
      <div style={{ fontSize: 10.5, color: '#64748b' }}>Quản lý danh sách các thực đơn bán hàng.</div>

      <div style={{ marginTop: 'auto', paddingTop: 6, fontSize: 9.5, color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
        MenuGo ERP v2.5
      </div>
    </div>
  );
};

export default MenuListingSidebar;
