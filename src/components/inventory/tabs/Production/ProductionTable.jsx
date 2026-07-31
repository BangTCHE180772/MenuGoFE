import React, { useState } from 'react';
import dayjs from 'dayjs';

const ProductionTable = ({
  documents = [],
  searchText,
  setSearchText,
  loading,
  setModalProductionOpen,
  handleDeleteDocument
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const totalPages = Math.ceil(documents.length / pageSize) || 1;
  const currentData = documents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', background: '#ffffff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <input
          type="text"
          placeholder="Theo mã phiếu sản xuất..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: 240,
            height: 26,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: '#1e293b',
            borderRadius: 16,
            border: '1px solid #cbd5e1',
            outline: 'none'
          }}
        />

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setModalProductionOpen(true)}
            style={{
              background: '#e8442a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              padding: '0 10px',
              height: 26,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Sản xuất
          </button>
          <button
            onClick={() => alert('Đã làm mới dữ liệu')}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              padding: '0 10px',
              height: 26,
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Làm mới
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textWrap: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ PHIẾU</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>LOẠI PHIẾU</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>CHI NHÁNH</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGÀY CHỨNG TỪ</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>GIÁ TRỊ (VNĐ)</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>TRẠNG THÁI</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGƯỜI TẠO</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Đang tải dữ liệu...</td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Không tìm thấy phiếu sản xuất nào</td>
              </tr>
            ) : (
              currentData.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#9333ea' }}>{doc.code}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#faf5ff', color: '#9333ea', border: '1px solid #e9d5ff', fontSize: 10, fontWeight: 600 }}>
                      Sản xuất
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>{doc.branchName}</td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>{dayjs(doc.businessDate).format('DD/MM/YYYY HH:mm')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {doc.totalAmount ? doc.totalAmount.toLocaleString() : 0} đ
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 600 }}>
                      Hoàn thành
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#64748b' }}>{doc.creator}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn xóa chứng từ này?')) {
                          handleDeleteDocument(doc.id);
                        }
                      }}
                      style={{ background: 'transparent', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#64748b' }}>
        <div>Tổng số: <strong>{documents.length}</strong> phiếu</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            style={{ padding: '2px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Trở lại
          </button>
          <span>Trang {currentPage} / {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            style={{ padding: '2px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionTable;
