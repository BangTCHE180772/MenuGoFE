import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  DeleteOutlined,
  WalletOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useBranch } from '../context/BranchContext';
import { getCashFlows, deleteCashFlow } from '../api/cashFlowApi';
import CreateCashFlowModal from '../components/cashflow/CreateCashFlowModal';

/* ─── Helpers ─────────────────────────────── */
const formatMoney = (v) =>
  typeof v === 'number' ? v.toLocaleString('vi-VN') + ' ₫' : '—';

const formatDate = (d) =>
  d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—';

const METHOD_LABELS = {
  1: 'Tiền mặt', Cash: 'Tiền mặt',
  2: 'Thẻ', Card: 'Thẻ',
  3: 'Chuyển khoản', Transfer: 'Chuyển khoản',
};

/* ─── Page ─────────────────────────────────── */
const CashFlowPage = () => {
  const { currentBranchId } = useBranch();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDirection, setModalDirection] = useState(2);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [dirFilter, setDirFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  /* ── Fetch ── */
  const fetchData = async () => {
    if (!currentBranchId || currentBranchId <= 0) { setData([]); return; }
    setLoading(true);
    try {
      const list = await getCashFlows(currentBranchId);
      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentBranchId]);
  useEffect(() => { setCurrentPage(1); }, [searchText, dirFilter, dateFrom, dateTo]);

  /* ── Filtered ── */
  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (dirFilter === '1' && row.directionValue !== 1) return false;
      if (dirFilter === '2' && row.directionValue !== 2) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        if (
          !row.code?.toLowerCase().includes(q) &&
          !row.note?.toLowerCase().includes(q) &&
          !row.partnerName?.toLowerCase().includes(q) &&
          !row.documentCode?.toLowerCase().includes(q)
        ) return false;
      }
      if (dateFrom) {
        if (dayjs(row.businessDate).isBefore(dayjs(dateFrom).startOf('day'))) return false;
      }
      if (dateTo) {
        if (dayjs(row.businessDate).isAfter(dayjs(dateTo).endOf('day'))) return false;
      }
      return true;
    });
  }, [data, dirFilter, searchText, dateFrom, dateTo]);

  /* ── Stats ── */
  const totalInflow = useMemo(
    () => filtered.filter(r => r.directionValue === 1).reduce((s, r) => s + (r.totalAmount || 0), 0),
    [filtered]
  );
  const totalOutflow = useMemo(
    () => filtered.filter(r => r.directionValue === 2).reduce((s, r) => s + (r.totalAmount || 0), 0),
    [filtered]
  );
  const netBalance = totalInflow - totalOutflow;

  /* ── Paginated rows ── */
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      await deleteCashFlow(id, 'Xóa thủ công');
      setConfirmDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>

      {/* ─── TOP HEADER ─────────────────────────────────── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 46, flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14,
          }}>
            <WalletOutlined />
          </div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            SỔ THU CHI
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          Live Synced
        </div>
      </div>

      {/* ─── BODY ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '14px 16px', gap: 12 }}>

        {/* ─── STAT CARDS ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, flexShrink: 0 }}>
          {/* Total Inflow */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d', marginBottom: 4 }}>
              <ArrowUpOutlined style={{ marginRight: 4 }} />Tổng Thu
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>
              {totalInflow.toLocaleString('vi-VN')} ₫
            </div>
            <div style={{ fontSize: 11, color: '#86efac', marginTop: 2 }}>
              {filtered.filter(r => r.directionValue === 1).length} phiếu
            </div>
          </div>

          {/* Total Outflow */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#b91c1c', marginBottom: 4 }}>
              <ArrowDownOutlined style={{ marginRight: 4 }} />Tổng Chi
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>
              {totalOutflow.toLocaleString('vi-VN')} ₫
            </div>
            <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 2 }}>
              {filtered.filter(r => r.directionValue === 2).length} phiếu
            </div>
          </div>

          {/* Net Balance */}
          <div style={{
            background: netBalance >= 0 ? '#f0f9ff' : '#fffbeb',
            border: `1px solid ${netBalance >= 0 ? '#bae6fd' : '#fde68a'}`,
            borderRadius: 10, padding: '12px 16px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: netBalance >= 0 ? '#0369a1' : '#d97706', marginBottom: 4 }}>
              Số dư ròng
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: netBalance >= 0 ? '#0369a1' : '#d97706' }}>
              {netBalance < 0 ? '−' : '+'}{Math.abs(netBalance).toLocaleString('vi-VN')} ₫
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{filtered.length} phiếu hiển thị</div>
          </div>
        </div>

        {/* ─── TOOLBAR ─── */}
        <div style={{
          background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0',
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
          flexWrap: 'wrap', flexShrink: 0,
        }}>
          {/* Create buttons */}
          <button
            type="button"
            onClick={() => { setModalDirection(1); setModalOpen(true); }}
            style={{
              height: 32, padding: '0 14px', border: 'none', borderRadius: 6,
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 2px 4px rgba(22,163,74,0.3)',
            }}
          >
            <PlusOutlined /> Tạo phiếu Thu
          </button>
          <button
            type="button"
            onClick={() => { setModalDirection(2); setModalOpen(true); }}
            style={{
              height: 32, padding: '0 14px', border: 'none', borderRadius: 6,
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 2px 4px rgba(220,38,38,0.3)',
            }}
          >
            <PlusOutlined /> Tạo phiếu Chi
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 2px' }} />

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <SearchOutlined style={{
              position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
              color: '#94a3b8', fontSize: 12,
            }} />
            <input
              type="text"
              placeholder="Tìm mã, ghi chú, đối tác..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                height: 32, padding: '0 10px 0 28px', fontSize: 12,
                border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none',
                width: 230, color: '#1e293b',
              }}
            />
          </div>

          {/* Direction filter pills */}
          <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', padding: 3, borderRadius: 6 }}>
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: '1', label: 'Thu' },
              { key: '2', label: 'Chi' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDirFilter(opt.key)}
                style={{
                  padding: '4px 10px', fontSize: 11.5, cursor: 'pointer',
                  fontWeight: dirFilter === opt.key ? 700 : 500,
                  color: dirFilter === opt.key ? '#0ea5e9' : '#475569',
                  background: dirFilter === opt.key ? '#fff' : 'transparent',
                  border: 'none', borderRadius: 4,
                  boxShadow: dirFilter === opt.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ height: 32, padding: '0 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none', color: '#1e293b' }}
          />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ height: 32, padding: '0 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none', color: '#1e293b' }}
          />

          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 13, padding: '0 2px' }}
            >
              <CloseCircleOutlined />
            </button>
          )}

          {/* Refresh */}
          <div style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              style={{
                height: 32, padding: '0 12px', border: '1px solid #cbd5e1',
                borderRadius: 6, background: '#fff', color: '#334155',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <ReloadOutlined style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Làm mới
            </button>
          </div>
        </div>

        {/* ─── TABLE ─── */}
        <div style={{
          flex: 1, overflow: 'auto', border: '1px solid #e2e8f0',
          borderRadius: 8, background: '#fff',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{
                background: '#f1f5f9', borderBottom: '1px solid #cbd5e1',
                color: '#334155', fontWeight: 700, fontSize: 10, textTransform: 'uppercase',
              }}>
                <th style={th}>Mã phiếu</th>
                <th style={th}>Loại</th>
                <th style={{ ...th, textAlign: 'right' }}>Số tiền</th>
                <th style={th}>Phương thức</th>
                <th style={th}>Đối tác</th>
                <th style={th}>Chứng từ gốc</th>
                <th style={th}>Ngày</th>
                <th style={{ ...th, maxWidth: 200 }}>Ghi chú</th>
                <th style={{ ...th, textAlign: 'center' }}>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 28, color: '#64748b' }}>Đang tải dữ liệu...</td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                  {!currentBranchId ? 'Vui lòng chọn chi nhánh' : 'Chưa có phiếu thu chi nào'}
                </td></tr>
              ) : pageData.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: row.directionValue === 1 ? 'rgba(240,253,244,0.5)' : 'rgba(254,242,242,0.4)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = row.directionValue === 1 ? 'rgba(240,253,244,0.5)' : 'rgba(254,242,242,0.4)'}
                >
                  <td style={td}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>{row.code}</span>
                  </td>
                  <td style={td}>
                    {row.directionValue === 1 ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#dcfce7', color: '#15803d',
                        padding: '2px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 700,
                      }}>
                        <ArrowUpOutlined />Thu
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#fee2e2', color: '#b91c1c',
                        padding: '2px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 700,
                      }}>
                        <ArrowDownOutlined />Chi
                      </span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <span style={{
                      fontWeight: 700,
                      color: row.directionValue === 1 ? '#16a34a' : '#dc2626',
                    }}>
                      {row.directionValue === 2 ? '−' : '+'}{(row.totalAmount || 0).toLocaleString('vi-VN')} ₫
                    </span>
                  </td>
                  <td style={td}>{METHOD_LABELS[row.paymentMethod] || row.paymentMethod || '—'}</td>
                  <td style={td}>
                    {row.partnerName
                      ? <span style={{ color: '#475569', fontWeight: 500 }}>{row.partnerName}</span>
                      : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={td}>
                    {row.documentCode
                      ? <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 10.5 }}>{row.documentCode}</span>
                      : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={td}>{formatDate(row.businessDate)}</td>
                  <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.note || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    {!row.documentId ? (
                      confirmDeleteId === row.id ? (
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10.5, cursor: 'pointer', fontWeight: 600 }}
                          >Xác nhận</button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10.5, cursor: 'pointer' }}
                          >Không</button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(row.id)}
                          title="Hủy phiếu"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 13, padding: '2px 4px' }}
                        >
                          <DeleteOutlined />
                        </button>
                      )
                    ) : (
                      <span title="Phiếu từ chứng từ - không thể xóa" style={{ color: '#e2e8f0', fontSize: 13 }}>
                        <DeleteOutlined />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── PAGINATION ─── */}
        {filtered.length > pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexShrink: 0, paddingTop: 4 }}>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={pgBtn(currentPage === 1)}
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...'
                  ? <span key={idx} style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>
                  : <button key={p} type="button" onClick={() => setCurrentPage(p)} style={pgBtn(false, p === currentPage)}>{p}</button>
              )}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={pgBtn(currentPage === totalPages)}
            >›</button>
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>
              {filtered.length} phiếu
            </span>
          </div>
        )}
      </div>

      {/* ─── MODAL ─── */}
      <CreateCashFlowModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchData(); }}
        branchId={currentBranchId}
        defaultDirection={modalDirection}
      />
    </div>
  );
};

/* ── Style helpers ── */
const th = { padding: '8px 12px', textAlign: 'left' };
const td = { padding: '7px 12px', color: '#334155' };
const pgBtn = (disabled, active = false) => ({
  width: 28, height: 28, border: `1px solid ${active ? '#0ea5e9' : '#e2e8f0'}`,
  borderRadius: 5, background: active ? '#0ea5e9' : '#fff',
  color: active ? '#fff' : disabled ? '#cbd5e1' : '#475569',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: active ? 700 : 400, fontSize: 13,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});

export default CashFlowPage;
