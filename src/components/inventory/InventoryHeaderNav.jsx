import React, { useState, useRef, useEffect } from 'react';
import { DownOutlined, CheckOutlined, AppstoreOutlined } from '@ant-design/icons';
import { SIDEBAR_HEADER_TITLES } from './constants/inventoryConstants';

const INVENTORY_OPTIONS = [
  { key: 'Import', label: 'Nhập hàng' },
  { key: 'ImportReturn', label: 'Trả hàng nhập' },
  { key: 'Invoice', label: 'Hóa đơn' },
  { key: 'ExportDelete', label: 'Xuất hủy' },
  { key: 'Production', label: 'Sản xuất' },
  { key: 'Transfer', label: 'Chuyển hàng' },
  { key: 'Check', label: 'Kiểm kho' },
  { key: 'Adjustment', label: 'Điều chỉnh giá vốn' },
  { key: 'Partner', label: 'Đối tác' },
  { key: 'Product', label: 'Danh sách nguyên liệu, mặt hàng' }
];

const InventoryHeaderNav = ({ activeTab, setActiveTab }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = INVENTORY_OPTIONS.find((opt) => opt.key === activeTab);
  const currentTitle = SIDEBAR_HEADER_TITLES[activeTab] || currentOption?.label || 'QUẢN LÝ KHO';

  return (
    <div
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        position: 'relative',
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* LEFT: TITLE DROPDOWN BUTTON (Replaces title and positioned top-left) */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: dropdownOpen ? '#fff7ed' : 'transparent',
            border: dropdownOpen ? '1px solid #fdba74' : '1px solid transparent',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #e8442a, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 14
            }}
          >
            <AppstoreOutlined />
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '0.3px',
              textTransform: 'uppercase'
            }}
          >
            {currentTitle}
          </h2>

          <DownOutlined
            style={{
              fontSize: 11,
              color: '#ea580c',
              transition: 'transform 0.2s ease',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </button>

        {/* DROPDOWN MENU CONTAINER */}
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              width: 270,
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              padding: '6px 0',
              zIndex: 300
            }}
          >
            <div
              style={{
                padding: '8px 14px 6px 14px',
                fontSize: 10,
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              Danh mục Quản Lý Kho
            </div>

            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {INVENTORY_OPTIONS.map((option) => {
                const isActive = activeTab === option.key;
                return (
                  <div
                    key={option.key}
                    onClick={() => {
                      setActiveTab(option.key);
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 14px',
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#e8442a' : '#334155',
                      background: isActive ? '#fff1f0' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{option.label}</span>
                    {isActive && <CheckOutlined style={{ fontSize: 11, color: '#e8442a' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: LIVE SYNC STATUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', fontWeight: 600 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
        Live Synced
      </div>
    </div>
  );
};

export default InventoryHeaderNav;
