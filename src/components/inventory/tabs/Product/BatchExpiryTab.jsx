import React, { useState, useEffect, useCallback } from 'react';
import {
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  LeftOutlined,
  RightOutlined,
  InboxOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getBatches, getBatchExpirySummary } from '../../../../api/batchApi';
import { renderBatchStatusBadge, renderExpiryStatusBadge } from '../../utils/batchHelper';
import BatchTraceabilityDrawer from './BatchTraceabilityDrawer';

const BatchExpiryTab = ({ selectedBranchId }) => {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Summary Metrics State
  const [summary, setSummary] = useState({
    totalBatches: 0,
    activeBatches: 0,
    expiredBatches: 0,
    nearExpiryBatches: 0,
    criticalBatches: 0,
    validBatches: 0,
    noExpiryBatches: 0
  });

  // Filter States
  const [searchText, setSearchText] = useState('');
  const [expiryStatusFilter, setExpiryStatusFilter] = useState('ALL'); // ALL, expired, near_expiry, valid, no_expiry
  const [batchStatusFilter, setBatchStatusFilter] = useState(null); // null, 1(Active), 2(Depleted), 3(Expired), 4(Locked)
  const [nearExpiryDays, setNearExpiryDays] = useState(7);

  // Traceability Drawer State
  const [traceDrawerOpen, setTraceDrawerOpen] = useState(false);
  const [selectedTraceBatchId, setSelectedTraceBatchId] = useState(null);

  // Fetch summary counts
  const fetchSummary = useCallback(async () => {
    if (!selectedBranchId) return;
    try {
      const res = await getBatchExpirySummary(selectedBranchId, nearExpiryDays);
      if (res) {
        setSummary(res);
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê hạn sử dụng:', err);
    }
  }, [selectedBranchId, nearExpiryDays]);

  // Fetch paginated batches
  const fetchBatchesList = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const res = await getBatches({
        branchId: selectedBranchId,
        search: searchText,
        expiryStatus: expiryStatusFilter !== 'ALL' ? expiryStatusFilter : undefined,
        status: batchStatusFilter !== null ? batchStatusFilter : undefined,
        nearExpiryDays: nearExpiryDays,
        page: currentPage,
        pageSize: pageSize
      });

      setBatches(res?.items || []);
      setTotalCount(res?.totalCount || 0);
    } catch (err) {
      console.error('Lỗi khi tải danh sách Lô theo dõi HSD:', err);
      setBatches([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, searchText, expiryStatusFilter, batchStatusFilter, nearExpiryDays, currentPage]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchBatchesList();
  }, [fetchBatchesList]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleRefresh = () => {
    fetchSummary();
    fetchBatchesList();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', height: '100%', overflow: 'hidden', padding: 16 }}>
      
      {/* ─── 1. TOP KPI SUMMARY CARDS ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        {/* TỔNG SỐ LÔ */}
        <div
          onClick={() => { setExpiryStatusFilter('ALL'); setCurrentPage(1); }}
          style={{
            background: '#ffffff',
            borderRadius: 8,
            padding: '12px 14px',
            border: expiryStatusFilter === 'ALL' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: 11.5, fontWeight: 600 }}>
            <span>Tổng số Lô</span>
            <InboxOutlined style={{ fontSize: 16, color: '#2563eb' }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            {summary.totalBatches}
          </div>
          <div style={{ fontSize: 10.5, color: '#059669', marginTop: 2 }}>
            {summary.activeBatches} Lô đang hoạt động
          </div>
        </div>

        {/* ĐÃ HẾT HẠN (EXPIRED) */}
        <div
          onClick={() => { setExpiryStatusFilter('expired'); setCurrentPage(1); }}
          style={{
            background: '#fef2f2',
            borderRadius: 8,
            padding: '12px 14px',
            border: expiryStatusFilter === 'expired' ? '2px solid #dc2626' : '1px solid #fecaca',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#991b1b', fontSize: 11.5, fontWeight: 700 }}>
            <span>Đã hết hạn</span>
            <CloseCircleOutlined style={{ fontSize: 16, color: '#dc2626' }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
            {summary.expiredBatches}
          </div>
          <div style={{ fontSize: 10.5, color: '#b91c1c', marginTop: 2 }}>
            Cần xuất hủy hoặc xử lý
          </div>
        </div>

        {/* SẮP HẾT HẠN (NEAR EXPIRY) */}
        <div
          onClick={() => { setExpiryStatusFilter('near_expiry'); setCurrentPage(1); }}
          style={{
            background: '#fffbeb',
            borderRadius: 8,
            padding: '12px 14px',
            border: expiryStatusFilter === 'near_expiry' ? '2px solid #d97706' : '1px solid #fde68a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#92400e', fontSize: 11.5, fontWeight: 700 }}>
            <span>Sắp hết hạn (≤ {nearExpiryDays} ngày)</span>
            <WarningOutlined style={{ fontSize: 16, color: '#d97706' }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            {summary.nearExpiryBatches}
          </div>
          <div style={{ fontSize: 10.5, color: '#b45309', marginTop: 2 }}>
            {summary.criticalBatches} Lô khẩn cấp (≤ 3 ngày)
          </div>
        </div>

        {/* CÒN HẠN SỬ DỤNG (VALID) */}
        <div
          onClick={() => { setExpiryStatusFilter('valid'); setCurrentPage(1); }}
          style={{
            background: '#f0fdf4',
            borderRadius: 8,
            padding: '12px 14px',
            border: expiryStatusFilter === 'valid' ? '2px solid #16a34a' : '1px solid #bbf7d0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#166534', fontSize: 11.5, fontWeight: 700 }}>
            <span>Còn hạn an toàn</span>
            <CheckCircleOutlined style={{ fontSize: 16, color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            {summary.validBatches}
          </div>
          <div style={{ fontSize: 10.5, color: '#15803d', marginTop: 2 }}>
            Ưu tiên xuất theo FEFO
          </div>
        </div>
      </div>

      {/* ─── 2. TOOLBAR & FILTERS ────────────────────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px 8px 0 0',
          border: '1px solid #e2e8f0',
          borderBottom: 'none',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* SEARCH INPUT */}
          <div style={{ position: 'relative', width: 280 }}>
            <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
            <input
              type="text"
              placeholder="Tìm theo mã Lô, tên mặt hàng, SKU..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                height: 32,
                padding: '4px 10px 4px 30px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                outline: 'none'
              }}
            />
          </div>

          {/* EXPIRY FILTER PILLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 6 }}>
            {[
              { key: 'ALL', label: 'Tất cả HSD' },
              { key: 'expired', label: 'Đã hết hạn' },
              { key: 'near_expiry', label: 'Sắp hết hạn' },
              { key: 'valid', label: 'Còn hạn' },
              { key: 'no_expiry', label: 'Không có HSD' }
            ].map((f) => {
              const active = expiryStatusFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setExpiryStatusFilter(f.key);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#ea580c' : '#475569',
                    background: active ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* BATCH STATUS SELECT */}
          <select
            value={batchStatusFilter !== null ? batchStatusFilter : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              setBatchStatusFilter(val);
              setCurrentPage(1);
            }}
            style={{
              height: 32,
              padding: '0 8px',
              fontSize: 11.5,
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              outline: 'none'
            }}
          >
            <option value="">Tất cả trạng thái Lô</option>
            <option value="1">Đang hoạt động</option>
            <option value="2">Đã hết hàng</option>
            <option value="3">Đã hết hạn</option>
            <option value="4">Đã khóa</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          style={{
            height: 32,
            padding: '0 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            background: '#ffffff',
            color: '#334155',
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

      {/* ─── 3. MAIN BATCH TABLE ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textWrap: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155', fontWeight: 700, textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>Mã Lô</th>
              <th style={{ padding: '10px 12px' }}>Tên mặt hàng / Nguyên liệu</th>
              <th style={{ padding: '10px 12px' }}>Đơn vị</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>SL ban đầu</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tồn hiện tại</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Giá vốn riêng Lô</th>
              <th style={{ padding: '10px 12px' }}>Ngày sản xuất</th>
              <th style={{ padding: '10px 12px' }}>Hạn sử dụng</th>
              <th style={{ padding: '10px 12px' }}>Ngày nhập</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Trạng thái Lô</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Hạn Dùng</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                  Đang nạp danh sách Lô hàng...
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  <InboxOutlined style={{ fontSize: 32, marginBottom: 6 }} />
                  <div>Không tìm thấy Lô hàng nào phù hợp với điều kiện lọc.</div>
                </td>
              </tr>
            ) : (
              batches.map((b) => {
                const qRem = Number(b.quantityRemaining || 0);
                const qOrig = Number(b.quantityOriginal || 0);
                const bCost = Number(b.unitCost || 0);

                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563eb' }}>
                      {b.batchCode}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                      {b.productName}
                      <span style={{ color: '#64748b', fontSize: 10.5, marginLeft: 6 }}>
                        ({b.productCode})
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {b.unitName}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                      {qOrig.toLocaleString('vi-VN')}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: qRem > 0 ? '#059669' : '#dc2626'
                      }}
                    >
                      {qRem.toLocaleString('vi-VN')}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#ea580c' }}>
                      {bCost.toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {b.manufactureDate ? dayjs(b.manufactureDate).format('DD/MM/YYYY') : '---'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#1e293b', fontWeight: 600 }}>
                      {b.expiryDate ? dayjs(b.expiryDate).format('DD/MM/YYYY') : 'Không có'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {b.receivedDate ? dayjs(b.receivedDate).format('DD/MM/YYYY') : '---'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {renderBatchStatusBadge(b.status)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {renderExpiryStatusBadge(b.expiryDate, b.daysUntilExpiry)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTraceBatchId(b.id);
                          setTraceDrawerOpen(true);
                        }}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <CompassOutlined /> Truy vết Lô
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── 4. FOOTER PAGINATION ───────────────────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '0 0 8px 8px',
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11.5,
          color: '#64748b'
        }}
      >
        <div>
          Hiển thị từ {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} đến{' '}
          {Math.min(currentPage * pageSize, totalCount)} trên tổng {totalCount} Lô hàng
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '4px 8px',
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
              padding: '4px 8px',
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

      {/* ─── 5. BATCH TRACEABILITY DRAWER ───────────────────────────────────── */}
      <BatchTraceabilityDrawer
        open={traceDrawerOpen}
        batchId={selectedTraceBatchId}
        onClose={() => {
          setTraceDrawerOpen(false);
          setSelectedTraceBatchId(null);
        }}
      />
    </div>
  );
};

export default BatchExpiryTab;
