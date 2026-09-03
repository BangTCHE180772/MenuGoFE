import React, { useState, useEffect } from 'react';
import { PlusOutlined, ReloadOutlined, SearchOutlined, ShoppingCartOutlined, TrophyOutlined, HistoryOutlined } from '@ant-design/icons';
import { getCustomerPurchases, getCustomerPoints } from '../../../../api/partnerApi';
import dayjs from 'dayjs';

const CustomerDetailSection = ({ customer }) => {
  const [purchases, setPurchases] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('info');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!customer?.id) return;
      setLoading(true);
      try {
        const [pRes, ptRes] = await Promise.allSettled([
          getCustomerPurchases(customer.id),
          getCustomerPoints(customer.id)
        ]);

        if (isMounted) {
          if (pRes.status === 'fulfilled') setPurchases(pRes.value || []);
          if (ptRes.status === 'fulfilled') setPoints(ptRes.value || []);
        }
      } catch (err) {
        console.error('Error fetching customer detail history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [customer?.id]);

  const currentPoints = customer?.point || customer?.points || 0;

  return (
    <div style={{ padding: 16 }}>
      {/* HEADER SUB TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 8px', marginBottom: 14, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('info')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: 'transparent',
            fontWeight: activeSubTab === 'info' ? 700 : 500,
            color: activeSubTab === 'info' ? '#ea580c' : '#64748b',
            borderBottom: activeSubTab === 'info' ? '2px solid #ea580c' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          Thông tin khách hàng
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: 'transparent',
            fontWeight: activeSubTab === 'history' ? 700 : 500,
            color: activeSubTab === 'history' ? '#ea580c' : '#64748b',
            borderBottom: activeSubTab === 'history' ? '2px solid #ea580c' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          Lịch sử mua hàng ({purchases.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('points')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: 'transparent',
            fontWeight: activeSubTab === 'points' ? 700 : 500,
            color: activeSubTab === 'points' ? '#ea580c' : '#64748b',
            borderBottom: activeSubTab === 'points' ? '2px solid #ea580c' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          Lịch sử điểm ({points.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12 }}>Đang tải thông tin khách hàng...</div>
      ) : (
        <>
          {/* TAB 1: THÔNG TIN KHÁCH HÀNG */}
          {activeSubTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Tên khách hàng</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12.5 }}>{customer.name}</div>
              </div>

              <div style={{ background: '#fff7ed', padding: '10px 12px', borderRadius: 6, border: '1px solid #fed7aa' }}>
                <div style={{ color: '#c2410c', fontSize: 10.5, marginBottom: 2, fontWeight: 600 }}>
                  <TrophyOutlined style={{ marginRight: 4 }} /> Điểm tích lũy hiện tại
                </div>
                <div style={{ fontWeight: 800, color: '#ea580c', fontSize: 16 }}>
                  {currentPoints.toLocaleString('vi-VN')} điểm
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Số điện thoại</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{customer.phone || 'Chưa cập nhật'}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Email</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{customer.email || 'Chưa cập nhật'}</div>
              </div>
            </div>
          )}

          {/* TAB 2: LỊCH SỬ MUA HÀNG */}
          {activeSubTab === 'history' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingCartOutlined style={{ color: '#ea580c' }} /> Lịch sử mua hàng
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: 9.5 }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Ngày giao dịch</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Mã hóa đơn</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Tổng tiền</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Điểm nhận</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Điểm dùng</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Thực thanh toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16, color: '#94a3b8' }}>Khách hàng chưa có lịch sử mua hàng</td></tr>
                    ) : (
                      purchases.map((p) => (
                        <tr key={p.orderId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>{dayjs(p.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 700, color: '#2563eb' }}>{p.invoiceCode}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: '#475569' }}>{p.totalAmount.toLocaleString('vi-VN')} VNĐ</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>+{p.pointsEarned}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>{p.pointsUsed > 0 ? `-${p.pointsUsed}` : '0'}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{p.finalAmount.toLocaleString('vi-VN')} VNĐ</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LỊCH SỬ ĐIỂM */}
          {activeSubTab === 'points' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HistoryOutlined style={{ color: '#2563eb' }} /> Lịch sử tăng / giảm điểm
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: 9.5 }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Thời gian</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Loại giao dịch</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Mã hóa đơn</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Thay đổi điểm</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Điểm sau GD</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16, color: '#94a3b8' }}>Khách hàng chưa có lịch sử tích điểm</td></tr>
                    ) : (
                      points.map((pt) => (
                        <tr key={pt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>{dayjs(pt.time).format('DD/MM/YYYY HH:mm')}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 600, color: pt.pointChange > 0 ? '#16a34a' : '#dc2626' }}>{pt.type}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 700 }}>{pt.relatedCode}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: pt.pointChange > 0 ? '#16a34a' : '#dc2626' }}>
                            {pt.pointChange > 0 ? `+${pt.pointChange}` : pt.pointChange}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{pt.pointAfter}</td>
                          <td style={{ padding: '6px 10px', color: '#475569' }}>{pt.reason}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CustomerTable = ({
  customers = [],
  searchText,
  setSearchText,
  setModalCustomerOpen,
  onEdit,
  onDelete
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const pageSize = 20;

  const toggleExpand = (customerId) => {
    setExpandedCustomerId((prev) => (prev === customerId ? null : customerId));
  };

  const totalPages = Math.ceil(customers.length / pageSize) || 1;
  const currentData = customers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', background: '#ffffff', overflow: 'hidden', width: '100%' }}>
      {/* TOP ACTION TOOLBAR (NO TYPE FILTER AS REQUIRED) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {setSearchText && (
            <div style={{ position: 'relative', width: 280 }}>
              <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
              <input
                type="text"
                placeholder="Theo tên khách hàng, số điện thoại..."
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setModalCustomerOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #ea580c, #f97316)',
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
              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)'
            }}
          >
            <PlusOutlined style={{ fontSize: 12 }} /> Thêm khách hàng
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
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

      {/* DATA TABLE */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textWrap: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>TÊN KHÁCH HÀNG</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>SỐ ĐIỆN THOẠI</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>EMAIL</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>ĐIỂM TÍCH LŨY</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Chưa có khách hàng nào phù hợp</td>
              </tr>
            ) : (
              currentData.map((c) => {
                const isExpanded = expandedCustomerId === c.id;
                const points = c.point || c.points || 0;

                return (
                  <React.Fragment key={c.id}>
                    <tr
                      onClick={() => toggleExpand(c.id)}
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                        background: isExpanded ? '#fff7ed' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                      <td style={{ padding: '8px 10px', color: '#334155' }}>{c.phone || '---'}</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{c.email || '---'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#ea580c' }}>
                        {points.toLocaleString('vi-VN')} điểm
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEdit && onEdit(c)}
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
                          onClick={() => onDelete && onDelete(c.id)}
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
                            <CustomerDetailSection customer={c} />
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
          Hiển thị từ {customers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} đến{' '}
          {Math.min(currentPage * pageSize, customers.length)} trên tổng {customers.length}
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

export default CustomerTable;
