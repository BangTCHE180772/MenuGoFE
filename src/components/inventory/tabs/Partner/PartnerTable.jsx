import React, { useState } from 'react';

const PartnerTable = ({
  partners = [],
  searchText,
  setSearchText
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const totalPages = Math.ceil(partners.length / pageSize) || 1;
  const currentData = partners.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', background: '#ffffff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <input
          type="text"
          placeholder="Theo tên đối tác..."
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
            onClick={() => alert('Mở form thêm đối tác')}
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
            + Thêm đối tác
          </button>
          <button
            onClick={() => alert('Đã làm mới danh sách đối tác')}
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
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>TÊN ĐỐI TÁC</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>PHÂN LOẠI</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>SỐ ĐIỆN THOẠI</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>CÔNG NỢ HỆ THỐNG</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Không tìm thấy đối tác nào</td>
              </tr>
            ) : (
              currentData.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: 10, fontWeight: 600 }}>
                      {p.type}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>{p.phone}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                    {p.totalDebt ? p.totalDebt.toLocaleString() : 0} VNĐ
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#64748b' }}>
        <div>Tổng số: <strong>{partners.length}</strong> đối tác</div>
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

export default PartnerTable;
