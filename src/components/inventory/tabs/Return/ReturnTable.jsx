import React, { useState } from 'react';
import dayjs from 'dayjs';

const ReturnTable = ({ returnsList = [] }) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filtered = returnsList.filter((ret) => {
    if (searchText) {
      const lower = searchText.toLowerCase();
      return ret.code?.toLowerCase().includes(lower) || ret.customer?.toLowerCase().includes(lower);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', background: '#ffffff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <input
          type="text"
          placeholder="Theo mã phiếu trả..."
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
            onClick={() => alert('Mở form Tạo trả hàng')}
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
            + Tạo trả hàng
          </button>
          <button
            onClick={() => alert('Đã làm mới trả hàng')}
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
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ PHIẾU TRẢ</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGÀY TRẢ</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>KHÁCH HÀNG</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>GIÁ TRỊ HOÀN (VNĐ)</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>LÝ DO TRẢ</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Không tìm thấy phiếu trả nào</td>
              </tr>
            ) : (
              currentData.map((ret) => (
                <tr key={ret.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#dc2626' }}>{ret.code}</td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>{dayjs(ret.date).format('DD/MM/YYYY HH:mm')}</td>
                  <td style={{ padding: '8px 10px', color: '#0f172a' }}>{ret.customer}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                    {ret.amount ? ret.amount.toLocaleString() : 0} đ
                  </td>
                  <td style={{ padding: '8px 10px', color: '#64748b' }}>{ret.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#64748b' }}>
        <div>Tổng số: <strong>{filtered.length}</strong> phiếu trả</div>
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

export default ReturnTable;
