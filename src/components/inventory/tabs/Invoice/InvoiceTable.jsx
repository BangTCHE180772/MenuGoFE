import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

const InvoiceTable = ({ invoices = [] }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';
  const [searchText, setSearchText] = useState(searchFromUrl);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (currentSearch !== searchText) {
      setSearchText(currentSearch);
    }
  }, [searchParams]);

  const handleSearchChange = (newVal) => {
    setSearchText(newVal);
    const newParams = new URLSearchParams(searchParams);
    if (newVal) {
      newParams.set('search', newVal);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const filtered = invoices.filter((inv) => {
    if (searchText) {
      const lower = searchText.toLowerCase();
      return inv.code?.toLowerCase().includes(lower) || inv.customer?.toLowerCase().includes(lower);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', background: '#ffffff', overflow: 'hidden' }}>
      {/* TOP ACTION TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* SEARCH INPUT */}
          <div style={{ position: 'relative', width: 280 }}>
            <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
            <input
              type="text"
              placeholder="Theo mã hóa đơn, tên khách hàng..."
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
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
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => alert('Mở form Lập hóa đơn')}
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
            <PlusOutlined /> Lập hóa đơn
          </button>
          <button
            type="button"
            onClick={() => alert('Đã làm mới hóa đơn')}
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
            <ReloadOutlined /> Làm mới
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textWrap: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ HÓA ĐƠN</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGÀY LẬP</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>KHÁCH HÀNG</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>TỔNG TIỀN (VNĐ)</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Không tìm thấy hóa đơn nào</td>
              </tr>
            ) : (
              currentData.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#2563eb' }}>{inv.code}</td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>{dayjs(inv.date).format('DD/MM/YYYY HH:mm')}</td>
                  <td style={{ padding: '8px 10px', color: '#0f172a' }}>{inv.customer}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {inv.total ? inv.total.toLocaleString() : 0} đ
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 600 }}>
                      Đã thanh toán
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#64748b' }}>
        <div>Tổng số: <strong>{filtered.length}</strong> hóa đơn</div>
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

export default InvoiceTable;
