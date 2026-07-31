import React, { useState } from 'react';

const InventoryHeaderNav = ({
  branches = [],
  selectedBranchId,
  setSelectedBranchId,
  loading,
  activeTab,
  setActiveTab
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const menuListTabs = ['Product', 'GroupListing', 'MenuListing'];
  const inventoryTabs = ['Check', 'Production', 'Transfer', 'ExportDelete', 'Import', 'ImportReturn', 'Partner'];
  const transactionTabs = ['Invoice', 'Return'];

  return (
    <div
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '3px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 38,
        position: 'relative',
        zIndex: 100
      }}
    >
      {/* LEFT GROUP: BRANCH SELECT & CAPSULE NAV BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>Chi nhánh:</span>
          <select
            value={selectedBranchId || ''}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            disabled={loading}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 600,
              color: '#1e293b',
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              outline: 'none',
              background: '#ffffff',
              cursor: 'pointer',
              height: 24,
              minWidth: 200
            }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* ORANGE CAPSULE NAVIGATION BAR */}
        <div className="kiotviet-nav-bar">
          {/* TỔNG QUAN / REPORT */}
          <div
            className={activeTab === 'Report' ? "kiotviet-nav-item active" : "kiotviet-nav-item"}
            onClick={() => setActiveTab('Report')}
          >
            Tổng quan
          </div>

          {/* THỰC ĐƠN DROPDOWN */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('menu')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <div className={menuListTabs.includes(activeTab) ? "kiotviet-nav-item active" : "kiotviet-nav-item"}>
              Thực đơn ▾
            </div>
            {openDropdown === 'menu' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: '#ffffff',
                  borderRadius: 6,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #cbd5e1',
                  padding: '4px 0',
                  fontSize: 11,
                  minWidth: 130,
                  zIndex: 200
                }}
              >
                <div
                  onClick={() => { setActiveTab('Product'); setOpenDropdown(null); }}
                  style={{
                    padding: '6px 14px',
                    cursor: 'pointer',
                    color: activeTab === 'Product' ? '#e8442a' : '#334155',
                    fontWeight: activeTab === 'Product' ? 700 : 500
                  }}
                >
                  Món ăn
                </div>
                <div
                  onClick={() => { setActiveTab('GroupListing'); setOpenDropdown(null); }}
                  style={{
                    padding: '6px 14px',
                    cursor: 'pointer',
                    color: activeTab === 'GroupListing' ? '#e8442a' : '#334155',
                    fontWeight: activeTab === 'GroupListing' ? 700 : 500
                  }}
                >
                  Nhóm món
                </div>
                <div
                  onClick={() => { setActiveTab('MenuListing'); setOpenDropdown(null); }}
                  style={{
                    padding: '6px 14px',
                    cursor: 'pointer',
                    color: activeTab === 'MenuListing' ? '#e8442a' : '#334155',
                    fontWeight: activeTab === 'MenuListing' ? 700 : 500
                  }}
                >
                  Thực đơn
                </div>
              </div>
            )}
          </div>

          {/* KHO HÀNG DROPDOWN */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('inventory')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <div className={inventoryTabs.includes(activeTab) ? "kiotviet-nav-item active" : "kiotviet-nav-item"}>
              Kho hàng ▾
            </div>
            {openDropdown === 'inventory' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: '#ffffff',
                  borderRadius: 6,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  padding: '8px 0',
                  fontSize: 11,
                  minWidth: 300,
                  zIndex: 200
                }}
              >
                <div style={{ flex: 1, borderRight: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '4px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>KHO HÀNG</div>
                  {[
                    { key: 'Check', label: 'Kiểm kho' },
                    { key: 'Production', label: 'Sản xuất' },
                    { key: 'Transfer', label: 'Chuyển hàng' },
                    { key: 'ExportDelete', label: 'Xuất hủy' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => { setActiveTab(item.key); setOpenDropdown(null); }}
                      style={{
                        padding: '6px 14px',
                        cursor: 'pointer',
                        color: activeTab === item.key ? '#e8442a' : '#334155',
                        fontWeight: activeTab === item.key ? 700 : 500,
                        background: activeTab === item.key ? '#fff1f0' : 'transparent'
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ padding: '4px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>NHẬP HÀNG & ĐỐI TÁC</div>
                  {[
                    { key: 'Import', label: 'Nhập hàng' },
                    { key: 'ImportReturn', label: 'Trả hàng nhập' },
                    { key: 'Partner', label: 'Nhà cung cấp / Đối tác' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => { setActiveTab(item.key); setOpenDropdown(null); }}
                      style={{
                        padding: '6px 14px',
                        cursor: 'pointer',
                        color: activeTab === item.key ? '#e8442a' : '#334155',
                        fontWeight: activeTab === item.key ? 700 : 500,
                        background: activeTab === item.key ? '#fff1f0' : 'transparent'
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GIAO DỊCH DROPDOWN */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('transaction')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <div className={transactionTabs.includes(activeTab) ? "kiotviet-nav-item active" : "kiotviet-nav-item"}>
              Giao dịch ▾
            </div>
            {openDropdown === 'transaction' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: '#ffffff',
                  borderRadius: 6,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #cbd5e1',
                  padding: '4px 0',
                  fontSize: 11,
                  minWidth: 130,
                  zIndex: 200
                }}
              >
                <div
                  onClick={() => { setActiveTab('Invoice'); setOpenDropdown(null); }}
                  style={{
                    padding: '6px 14px',
                    cursor: 'pointer',
                    color: activeTab === 'Invoice' ? '#e8442a' : '#334155',
                    fontWeight: activeTab === 'Invoice' ? 700 : 500
                  }}
                >
                  Hóa đơn
                </div>
                <div
                  onClick={() => { setActiveTab('Return'); setOpenDropdown(null); }}
                  style={{
                    padding: '6px 14px',
                    cursor: 'pointer',
                    color: activeTab === 'Return' ? '#e8442a' : '#334155',
                    fontWeight: activeTab === 'Return' ? 700 : 500
                  }}
                >
                  Trả hàng
                </div>
              </div>
            )}
          </div>

          {/* SỔ QUỶ */}
          <div
            className={activeTab === 'Cash' ? "kiotviet-nav-item active" : "kiotviet-nav-item"}
            onClick={() => setActiveTab('Cash')}
          >
            Sổ quỹ
          </div>
        </div>
      </div>

      {/* RIGHT STATUS BADGE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#10b981', fontWeight: 600 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
        Live Synced
      </div>
    </div>
  );
};

export default InventoryHeaderNav;
