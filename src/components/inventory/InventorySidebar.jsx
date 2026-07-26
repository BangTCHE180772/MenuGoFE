import React from 'react';
import { SIDEBAR_HEADER_TITLES } from './inventoryConstants';

const InventorySidebar = ({ activeSubOption, activeMainCategory }) => {
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
        fontSize: 10.5,
        padding: '8px 10px',
        userSelect: 'none'
      }}
    >
      {/* HEADER TÊN TÍNH NĂNG ĐANG TRUY CẬP (ĐỂ TRỐNG KHI Ở TỔNG QUAN) */}
      {activeSubOption !== 'overview' && (
        <div style={{ paddingBottom: 6, marginBottom: 8, borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 11, color: '#e8442a' }}>
          <span style={{ textTransform: 'uppercase', color: '#e8442a', letterSpacing: '0.3px' }}>
            {SIDEBAR_HEADER_TITLES[activeSubOption] || SIDEBAR_HEADER_TITLES[activeMainCategory]}
          </span>
        </div>
      )}

      {/* SIDEBAR BODY CLEARED AND BLANK - RESERVED FOR USER FILTER OPTIONS */}
      <div style={{ flex: 1 }}>
        {/* Khu vực ô Filter dành riêng cho user (hiện tại để trống theo yêu cầu) */}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 6, fontSize: 9.5, color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
        MenuGo ERP v2.5
      </div>
    </div>
  );
};

export default InventorySidebar;
