import React, { useState } from 'react';
import dayjs from 'dayjs';

const CashTable = ({ cashFlows = [] }) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filtered = cashFlows.filter((cf) => {
    if (searchText) {
      const lower = searchText.toLowerCase();
      return cf.code?.toLowerCase().includes(lower) || cf.category?.toLowerCase().includes(lower) || cf.partner?.toLowerCase().includes(lower);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalInflow = filtered.filter(f => f.direction === 'Inflow').reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalOutflow = filtered.filter(f => f.direction === 'Outflow').reduce((sum, f) => sum + (f.amount || 0), 0);
  const balance = totalInflow - totalOutflow;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', background: '#ffffff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <input
          type="text"
          placeholder="Theo mã phiếu thu/chi..."
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
            onClick={() => alert('Mở form Lập phiếu THU')}
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
            + Lập phiếu thu
          </button>
          <button
            onClick={() => alert('Mở form Lập phiếu CHI')}
            style={{
              background: '#2563eb',
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
            + Lập phiếu chi
          </button>
          <button
            onClick={() => alert('Đã làm mới sổ quỹ')}
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

      {/* CASHBOOK SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div style={{ padding: '6px 10px', background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600 }}>Tổng Thu Quỹ:</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>+{totalInflow.toLocaleString()} đ</div>
        </div>
        <div style={{ padding: '6px 10px', background: '#fef2f2', borderRadius: 6, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600 }}>Tổng Chi Quỹ:</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>-{totalOutflow.toLocaleString()} đ</div>
        </div>
        <div style={{ padding: '6px 10px', background: '#ecfdf5', borderRadius: 6, border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600 }}>Số Dư Quỹ Tiền Mặt:</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{balance.toLocaleString()} đ</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textWrap: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ PHIẾU</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGÀY SỔ QUỶ</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>LOẠI QUỶ</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>HẠNG MỤC</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>ĐỐI TÁC / KHÁCH</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>SỐ TIỀN</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Không tìm thấy phiếu thu/chi nào</td>
              </tr>
            ) : (
              currentData.map((cf) => {
                const isInflow = cf.direction === 'Inflow';
                return (
                  <tr key={cf.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#2563eb' }}>{cf.code}</td>
                    <td style={{ padding: '8px 10px', color: '#334155' }}>{dayjs(cf.date).format('DD/MM/YYYY HH:mm')}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {isInflow ? (
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 600 }}>
                          Thu tiền
                        </span>
                      ) : (
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 10, fontWeight: 600 }}>
                          Chi tiền
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#334155' }}>{cf.category}</td>
                    <td style={{ padding: '8px 10px', color: '#0f172a' }}>{cf.partner}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: isInflow ? '#059669' : '#dc2626' }}>
                      {isInflow ? '+' : '-'}{cf.amount ? cf.amount.toLocaleString() : 0} đ
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#64748b' }}>
        <div>Tổng số: <strong>{filtered.length}</strong> phiếu thu/chi</div>
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

export default CashTable;
