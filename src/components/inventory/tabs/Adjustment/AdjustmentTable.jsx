import React, { useState } from 'react';
import { PlusOutlined, ReloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';

const AdjustmentTable = ({
  documents = [],
  loading,
  selectedBranchId,
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', background: '#ffffff', overflow: 'hidden', width: '100%' }}>
      {/* TOP ACTION TOOLBAR (EXPLICIT MARGIN-LEFT AUTO TO FORCE FAR RIGHT ALIGNMENT) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
          marginBottom: 8
        }}
      >
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* BUTTON 1: TẠO PHIẾU ĐIỀU CHỈNH (FIRST) */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              background: '#e8442a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              padding: '0 10px',
              height: 26,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <PlusOutlined style={{ fontSize: 11 }} /> Tạo phiếu điều chỉnh giá vốn
          </button>

          {/* BUTTON 2: LÀM MỚI / TẢI LẠI (SECOND) */}
          <button
            type="button"
            onClick={() => fetchDocuments(selectedBranchId)}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              padding: '0 10px',
              height: 26,
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <ReloadOutlined style={{ fontSize: 11 }} /> Làm mới
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
