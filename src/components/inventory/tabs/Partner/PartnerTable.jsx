import React, { useState } from 'react';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';

const PartnerTable = ({
  partners = [],
  searchText,
  setSearchText,
  partnerType = 'ALL',
  setPartnerType,
  setModalPartnerOpen,
  onEdit,
  onDelete
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPartnerId, setExpandedPartnerId] = useState(null);
  const [activeTabMap, setActiveTabMap] = useState({}); // { [id]: 'info' | 'debt' }
  const pageSize = 20;

  const toggleExpand = (partnerId) => {
    if (expandedPartnerId === partnerId) {
      setExpandedPartnerId(null);
    } else {
      setExpandedPartnerId(partnerId);
      if (!activeTabMap[partnerId]) {
        setActiveTabMap((prev) => ({ ...prev, [partnerId]: 'info' }));
      }
    }
  };

  const handleTabChange = (partnerId, tabKey) => {
    setActiveTabMap((prev) => ({ ...prev, [partnerId]: tabKey }));
  };

  const totalPages = Math.ceil(partners.length / pageSize) || 1;
  const currentData = partners.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', background: '#ffffff', overflow: 'hidden', width: '100%' }}>
      {/* TOP ACTION TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* SEARCH INPUT */}
          {setSearchText && (
            <div style={{ position: 'relative', width: 280 }}>
              <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
              <input
                type="text"
                placeholder="Theo tên đối tác, số điện thoại..."
                value={searchText || ''}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: '100%',
                  height: 32,
                  padding: '4px 10px 4px 30px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#1e293b',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  transition: 'border 0.2s ease'
                }}
              />
            </div>
          )}

          {/* TYPE FILTER PILLS */}
          {setPartnerType && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 6 }}>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'NCC', label: 'Nhà cung cấp' },
                { key: 'KH', label: 'Khách hàng' },
                { key: 'VC', label: 'Vận chuyển' },
                { key: 'OTHER', label: 'Khác' }
              ].map((st) => {
                const active = partnerType === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setPartnerType(st.key)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#ea580c' : '#475569',
                      background: active ? '#ffffff' : 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setModalPartnerOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #e8442a, #f97316)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '0 14px',
              height: 32,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 4px rgba(232, 68, 42, 0.25)'
            }}
          >
            <PlusOutlined style={{ fontSize: 12 }} /> Thêm đối tác
          </button>

          <button
            type="button"
            onClick={() => alert('Đã làm mới danh sách đối tác')}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '0 12px',
              height: 32,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <ReloadOutlined style={{ fontSize: 12 }} /> Làm mới
          </button>
        </div>
      </div>

      {/* DATA TABLE AREA */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textWrap: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>TÊN ĐỐI TÁC</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>PHÂN LOẠI</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>SỐ ĐIỆN THOẠI</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>CÔNG NỢ HỆ THỐNG</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Chưa có đối tác nào phù hợp</td>
              </tr>
            ) : (
              currentData.map((p) => {
                const isExpanded = expandedPartnerId === p.id;
                const currentTab = activeTabMap[p.id] || 'info';

                const getBadge = (t) => {
                  if (t === 1 || t === '1' || t === 'Supplier' || t === 'Nhà cung cấp' || t === 'NCC') {
                    return { label: 'Nhà cung cấp', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
                  }
                  if (t === 2 || t === '2' || t === 'Customer' || t === 'Khách hàng' || t === 'KH') {
                    return { label: 'Khách hàng', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
                  }
                  if (t === 3 || t === '3' || t === 'Transporter' || t === 'Vận chuyển' || t === 'VC') {
                    return { label: 'Vận chuyển', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
                  }
                  return { label: 'Khác', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
                };
                const badge = getBadge(p.type);

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      onClick={() => toggleExpand(p.id)}
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                        background: isExpanded ? '#fff7ed' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontSize: 10, fontWeight: 600 }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#334155' }}>{p.phone || '---'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                        {p.totalDebt ? p.totalDebt.toLocaleString() : 0} VNĐ
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEdit && onEdit(p)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#2563eb',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            marginRight: 10
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(p.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED DETAIL CONTAINER */}
                    {isExpanded && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={5} style={{ padding: '0 12px 14px 12px', borderBottom: '2px solid #cbd5e1' }}>
                          <div
                            style={{
                              background: '#ffffff',
                              borderRadius: 8,
                              border: '1px solid #cbd5e1',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                              overflow: 'hidden',
                              marginTop: 4,
                              fontSize: 11
                            }}
                          >
                            {/* TAB HEADERS */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 12px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleTabChange(p.id, 'info')}
                                style={{
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'transparent',
                                  fontWeight: currentTab === 'info' ? 700 : 500,
                                  color: currentTab === 'info' ? '#e8442a' : '#64748b',
                                  borderBottom: currentTab === 'info' ? '2px solid #e8442a' : '2px solid transparent',
                                  cursor: 'pointer',
                                  fontSize: 12
                                }}
                              >
                                Thông tin đối tác
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTabChange(p.id, 'debt')}
                                style={{
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'transparent',
                                  fontWeight: currentTab === 'debt' ? 700 : 500,
                                  color: currentTab === 'debt' ? '#e8442a' : '#64748b',
                                  borderBottom: currentTab === 'debt' ? '2px solid #e8442a' : '2px solid transparent',
                                  cursor: 'pointer',
                                  fontSize: 12
                                }}
                              >
                                Công nợ & Tài chính
                              </button>

                              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => onEdit && onEdit(p)}
                                  style={{
                                    padding: '4px 12px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    borderRadius: 4,
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#2563eb',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Chỉnh sửa
                                </button>
                              </div>
                            </div>

                            {/* TAB 1: THÔNG TIN CHI TIẾT */}
                            {currentTab === 'info' && (
                              <div style={{ padding: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                    <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Tên đối tác</div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12.5 }}>{p.name}</div>
                                  </div>

                                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                    <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Phân loại</div>
                                    <div>
                                      <span style={{ padding: '2px 6px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontSize: 10.5, fontWeight: 600 }}>
                                        {badge.label}
                                      </span>
                                    </div>
                                  </div>

                                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                    <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Số điện thoại</div>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.phone || 'Chưa cập nhật'}</div>
                                  </div>

                                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                    <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Email</div>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.email || 'Chưa cập nhật'}</div>
                                  </div>

                                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
                                    <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Địa chỉ</div>
                                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{p.address || 'Chưa cập nhật'}</div>
                                  </div>

                                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
                                    <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Ghi chú</div>
                                    <div style={{ color: '#475569', fontStyle: p.note ? 'normal' : 'italic' }}>
                                      {p.note || 'Không có ghi chú thêm'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: CÔNG NỢ & TÀI CHÍNH */}
                            {currentTab === 'debt' && (
                              <div style={{ padding: 16 }}>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                                  <div style={{ flex: 1, minWidth: 200, padding: 14, borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca' }}>
                                    <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600 }}>CÔNG NỢ HIỆN TẠI</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
                                      {p.totalDebt ? Number(p.totalDebt).toLocaleString('vi-VN') : 0} VNĐ
                                    </div>
                                  </div>

                                  <div style={{ flex: 1, minWidth: 200, padding: 14, borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                    <div style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>TRẠNG THÁI THANH TOÁN</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginTop: 6 }}>
                                      {p.totalDebt && Number(p.totalDebt) > 0 ? 'Đang có công nợ cần thanh toán' : 'Không có công nợ'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER PAGINATION */}
      <div
        style={{
          padding: '8px 4px',
          background: '#ffffff',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: '#64748b',
          marginTop: 6
        }}
      >
        <div>
          Hiển thị từ {partners.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} đến{' '}
          {Math.min(currentPage * pageSize, partners.length)} trên tổng {partners.length}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: currentPage === 1 ? '#cbd5e1' : '#334155',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Trở lại
          </button>
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerTable;
