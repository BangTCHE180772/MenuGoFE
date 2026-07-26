import React from 'react';
import { Select, Space, Badge, Dropdown, Typography } from 'antd';

const { Text } = Typography;

const InventoryHeaderNav = ({
  branches,
  selectedBranchId,
  setSelectedBranchId,
  loading,
  activeMainCategory,
  setActiveMainCategory,
  activeSubOption,
  setActiveSubOption
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '3px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 38
      }}
    >
      {/* LEFT GROUP: BRANCH SELECT (315PX) & CAPSULE NAV BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Space size="small">
          <Text strong style={{ fontSize: 11, color: '#334155' }}>Chi nhánh:</Text>
          <Select
            value={selectedBranchId}
            onChange={(val) => setSelectedBranchId(val)}
            style={{ width: 315 }}
            size="small"
            loading={loading}
          >
            {branches.map((b) => (
              <Select.Option key={b.id} value={b.id}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{b.name}</span>
              </Select.Option>
            ))}
          </Select>
        </Space>

        {/* FULL ORANGE CAPSULE NAVIGATION OPTIONS (SINGLE-PAGE IN-PLACE TAB SWITCHING) */}
        <div className="kiotviet-nav-bar">
          <div
            className={activeSubOption === 'overview' ? "kiotviet-nav-item active" : "kiotviet-nav-item"}
            onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('overview'); }}
          >
            Tổng quan
          </div>

          {/* HOVER DROPDOWN MENU FOR THỰC ĐƠN */}
          <Dropdown
            dropdownRender={() => (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 8,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #cbd5e1',
                  padding: '4px 0',
                  fontSize: 11,
                  minWidth: 130
                }}
              >
                <div
                  onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('dishes'); }}
                  style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'dishes' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'dishes' ? 700 : 500 }}
                >
                  Món
                </div>
                <div
                  onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('dish_groups'); }}
                  style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'dish_groups' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'dish_groups' ? 700 : 500 }}
                >
                  Nhóm món
                </div>
                <div
                  onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('menu_list'); }}
                  style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'menu_list' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'menu_list' ? 700 : 500 }}
                >
                  Thực đơn
                </div>
              </div>
            )}
            trigger={['hover']}
          >
            <div className={['dishes', 'dish_groups', 'menu_list'].includes(activeSubOption) ? "kiotviet-nav-item active" : "kiotviet-nav-item"}>Thực đơn</div>
          </Dropdown>

          {/* 2-COLUMN HOVER DROPDOWN MENU FOR KHO HÀNG */}
          <Dropdown
            dropdownRender={() => (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 8,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  padding: '8px 0',
                  fontSize: 11,
                  minWidth: 320,
                  overflow: 'hidden'
                }}
              >
                {/* LEFT COLUMN: KHO HÀNG OPERATIONAL MODULES */}
                <div style={{ flex: 1, borderRight: '1px solid #f1f5f9', padding: '2px 0' }}>
                  <div style={{ padding: '4px 14px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8' }}>Kho hàng</div>
                  {[
                    { key: '5', label: 'Kiểm kho' },
                    { key: '6', label: 'Sản xuất' },
                    { key: '3', label: 'Chuyển hàng' },
                    { key: '2', label: 'Xuất hủy' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => {
                        setActiveMainCategory('operations');
                        setActiveSubOption(item.key);
                      }}
                      style={{
                        padding: '6px 14px',
                        cursor: 'pointer',
                        color: activeSubOption === item.key ? '#e8442a' : '#334155',
                        fontWeight: activeSubOption === item.key ? 700 : 500,
                        background: activeSubOption === item.key ? '#fff1f0' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* RIGHT COLUMN: NHẬP HÀNG & ĐỐI TÁC */}
                <div style={{ flex: 1, padding: '2px 0' }}>
                  <div style={{ padding: '4px 14px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8' }}>Nhập hàng</div>
                  {[
                    { key: '1_4', label: 'Nhập hàng' },
                    { key: '4', label: 'Trả hàng nhập' },
                    { key: 'partners', label: 'Nhà cung cấp / Đối tác' }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveMainCategory('operations');
                        setActiveSubOption(item.key);
                      }}
                      style={{
                        padding: '6px 14px',
                        cursor: 'pointer',
                        color: activeSubOption === item.key ? '#e8442a' : '#334155',
                        fontWeight: activeSubOption === item.key ? 700 : 500,
                        background: activeSubOption === item.key ? '#fff1f0' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
            trigger={['hover']}
          >
            <div className={['1_4', '4', '5', '6', '3', '2'].includes(activeSubOption) && activeMainCategory === 'operations' ? "kiotviet-nav-item active" : "kiotviet-nav-item"}>Kho hàng</div>
          </Dropdown>

          {/* NÚT PHÒNG/BÀN (ĐẶT TRƯỚC GIAO DỊCH) */}
          <div
            className={activeSubOption === 'rooms_tables' ? "kiotviet-nav-item active" : "kiotviet-nav-item"}
            onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('rooms_tables'); }}
          >
            Phòng/Bàn
          </div>

          {/* HOVER DROPDOWN MENU FOR GIAO DỊCH (HÓA ĐƠN & TRẢ HÀNG) */}
          <Dropdown
            dropdownRender={() => (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 8,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #cbd5e1',
                  padding: '4px 0',
                  fontSize: 11,
                  minWidth: 120
                }}
              >
                <div
                  onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('invoices'); }}
                  style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'invoices' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'invoices' ? 700 : 500 }}
                >
                  Hóa đơn
                </div>
                <div
                  onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('returns'); }}
                  style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'returns' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'returns' ? 700 : 500 }}
                >
                  Trả hàng
                </div>
              </div>
            )}
            trigger={['hover']}
          >
            <div className={['invoices', 'returns', 'transactions'].includes(activeSubOption) ? "kiotviet-nav-item active" : "kiotviet-nav-item"}>Giao dịch</div>
          </Dropdown>

          <div className={activeSubOption === 'employees' ? "kiotviet-nav-item active" : "kiotviet-nav-item"} onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('employees'); }}>Nhân viên</div>
          <div className={activeMainCategory === 'cashbook' ? "kiotviet-nav-item active" : "kiotviet-nav-item"} onClick={() => { setActiveMainCategory('cashbook'); setActiveSubOption('cashbook'); }}>Sổ quỹ</div>
          <div className={activeSubOption === 'reports' ? "kiotviet-nav-item active" : "kiotviet-nav-item"} onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('reports'); }}>Báo cáo</div>
        </div>
      </div>

      <Space size="small">
        <Badge status="processing" text={<span style={{ fontSize: 10, color: '#10b981' }}>Live Synced</span>} />
      </Space>
    </div>
  );
};

export default InventoryHeaderNav;
