import React, { useState } from 'react';
import { PlusOutlined, ReloadOutlined, LeftOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';

const AdjustmentTable = ({
  documents = [],
  loading,
  selectedBranchId,
  searchText,
  setSearchText,
  statusFilter = 'ALL',
  setStatusFilter,
  fetchDocuments,
  handleDeleteDocument,
  setModalOpen
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const totalPages = Math.ceil(documents.length / pageSize) || 1;
  const currentData = documents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 1:
        return (
          <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
            Hoàn thành
          </span>
        );
      case 'PENDING':
      case 0:
        return (
          <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
            Phiếu tạm
          </span>
        );
      case 'CANCELLED':
      case 2:
        return (
          <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>
            Đã hủy
          </span>
        );
      default:
        return (
          <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
            {status || '---'}
          </span>
        );
    }
  };

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
                placeholder="Theo mã phiếu, người tạo, ghi chú..."
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

          {/* STATUS FILTER PILLS */}
          {setStatusFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 6 }}>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'Completed', label: 'Hoàn thành' },
                { key: 'Cancelled', label: 'Đã hủy' }
              ].map((st) => {
                const active = statusFilter === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setStatusFilter(st.key)}
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
          {/* BUTTON 1: TẠO PHIẾU ĐIỀU CHỈNH */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
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
            <PlusOutlined style={{ fontSize: 12 }} /> Tạo phiếu điều chỉnh giá vốn
          </button>

          {/* BUTTON 2: LÀM MỚI / TẢI LẠI */}
          <button
            type="button"
            onClick={() => fetchDocuments && fetchDocuments(selectedBranchId)}
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
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ PHIẾU</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGÀY CHỨNG TỪ</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGƯỜI TẠO</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>GHI CHÚ</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>TRẠNG THÁI</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                  Đang tải danh sách phiếu điều chỉnh...
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                  Không tìm thấy phiếu điều chỉnh nào
                </td>
              </tr>
            ) : (
              currentData.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#2563eb' }}>{doc.code}</td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>
                    {doc.createdDate ? new Date(doc.createdDate).toLocaleString('vi-VN') : '---'}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>{doc.creator || 'Quản lý'}</td>
                  <td style={{ padding: '8px 10px', color: '#64748b' }}>{doc.note || '---'}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>{getStatusBadge(doc.status)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    {handleDeleteDocument && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, doc.type)}
                        style={{
                          padding: '2px 8px',
                          fontSize: 10.5,
                          borderRadius: 3,
                          border: '1px solid #fecaca',
                          background: '#fef2f2',
                          color: '#dc2626',
                          cursor: 'pointer'
                        }}
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))
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
          Hiển thị từ {documents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} đến{' '}
          {Math.min(currentPage * pageSize, documents.length)} trên tổng {documents.length}
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
            <LeftOutlined style={{ fontSize: 10 }} />
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
            <RightOutlined style={{ fontSize: 10 }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentTable;
