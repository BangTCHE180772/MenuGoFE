import React, { useState, useEffect } from 'react';
import {
  CloseOutlined,
  HistoryOutlined,
  BranchesOutlined,
  CalendarOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  InboxOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getBatchTraceability } from '../../../../api/batchApi';
import { renderBatchStatusBadge, renderExpiryStatusBadge } from '../../utils/batchHelper';

const BatchTraceabilityDrawer = ({ open, batchId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [traceData, setTraceData] = useState(null);

  const fetchTraceability = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getBatchTraceability(id);
      setTraceData(res);
    } catch (err) {
      console.error('Lỗi khi tải thông tin truy vết Lô:', err);
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && batchId) {
      fetchTraceability(batchId);
    } else {
      setTraceData(null);
    }
  }, [open, batchId]);

  if (!open) return null;

  const currentBatch = traceData?.currentBatch;
  const sourceBatch = traceData?.sourceBatch;
  const allocations = traceData?.allocations || [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: '#ffffff',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          animation: 'slideLeft 0.25s ease'
        }}
      >
        {/* DRAWER HEADER */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}
            >
              <HistoryOutlined />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Hồ Sơ Truy Vết Vòng Đời Lô Hàng
              </h3>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Mã Lô: <strong style={{ color: '#2563eb' }}>{currentBatch?.batchCode || '---'}</strong>
                {currentBatch?.productName && ` | ${currentBatch.productName}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => fetchTraceability(batchId)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <ReloadOutlined /> Làm mới
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: 16,
                padding: 6,
                borderRadius: 6
              }}
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* DRAWER BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#f8fafc' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              <div>Đang tải hồ sơ truy vết Lô hàng...</div>
            </div>
          ) : !currentBatch ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <InboxOutlined style={{ fontSize: 36, marginBottom: 8 }} />
              <div>Không tìm thấy thông tin Lô hàng</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* SECTION 1: MASTER BATCH SUMMARY CARD */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {currentBatch.productName} ({currentBatch.productCode})
                    </span>
                    {renderBatchStatusBadge(currentBatch.status)}
                  </div>
                  <div>
                    {renderExpiryStatusBadge(currentBatch.expiryDate, currentBatch.daysUntilExpiry)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 12,
                    background: '#f8fafc',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 11.5
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Số lượng ban đầu:</span>
                    <strong style={{ color: '#0f172a', fontSize: 13 }}>
                      {Number(currentBatch.quantityOriginal).toLocaleString('vi-VN')} {currentBatch.unitName}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Tồn hiện tại:</span>
                    <strong style={{ color: Number(currentBatch.quantityRemaining) > 0 ? '#059669' : '#dc2626', fontSize: 13 }}>
                      {Number(currentBatch.quantityRemaining).toLocaleString('vi-VN')} {currentBatch.unitName}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Giá vốn riêng Lô:</span>
                    <strong style={{ color: '#ea580c', fontSize: 13 }}>
                      {Number(currentBatch.unitCost).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Chi nhánh quản lý:</span>
                    <strong style={{ color: '#1e293b' }}>
                      {currentBatch.branchName || 'Chi nhánh'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, fontSize: 11.5, color: '#475569' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Ngày nhập kho:</span>{' '}
                    <strong>{currentBatch.receivedDate ? dayjs(currentBatch.receivedDate).format('DD/MM/YYYY') : '---'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Ngày sản xuất:</span>{' '}
                    <strong>{currentBatch.manufactureDate ? dayjs(currentBatch.manufactureDate).format('DD/MM/YYYY') : '---'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Hạn sử dụng:</span>{' '}
                    <strong>{currentBatch.expiryDate ? dayjs(currentBatch.expiryDate).format('DD/MM/YYYY') : 'Không có'}</strong>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SOURCE BATCH LINKAGE (IF ANY) */}
              {sourceBatch && (
                <div
                  style={{
                    background: '#eff6ff',
                    borderRadius: 10,
                    border: '1px solid #bfdbfe',
                    padding: 14,
                    fontSize: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>
                    <BranchesOutlined /> Nguồn Gốc Chuyển Kho / Sản Xuất
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#334155' }}>
                    <div>
                      Chi nhánh gốc: <strong>{sourceBatch.branchName}</strong>
                    </div>
                    <ArrowRightOutlined style={{ color: '#2563eb' }} />
                    <div>
                      Mã Lô gốc: <strong style={{ color: '#1d4ed8' }}>{sourceBatch.batchCode}</strong>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: 11 }}>
                      Ngày nhập gốc: {sourceBatch.receivedDate ? dayjs(sourceBatch.receivedDate).format('DD/MM/YYYY') : '---'}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: ALLOCATIONS & CONSUMPTION HISTORY */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                    Nhật Ký Phân Bổ & Sử Dụng Lô ({allocations.length} lượt)
                  </h4>
                </div>

                {allocations.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                    Chưa có lượt phân bổ hoặc tiêu hao nào từ Lô hàng này.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>Thời gian</th>
                          <th style={{ padding: '8px 10px' }}>Nghiệp vụ</th>
                          <th style={{ padding: '8px 10px' }}>Mã chứng từ</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Số lượng</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Giá vốn Lô</th>
                          <th style={{ padding: '8px 10px' }}>Chi nhánh / Đối tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations.map((a, idx) => {
                          const isNegative = a.quantityAllocated > 0;
                          return (
                            <tr key={a.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>
                                {dayjs(a.documentPostedAt || a.createdAt).format('DD/MM/YYYY HH:mm')}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    border: '1px solid #e2e8f0'
                                  }}
                                >
                                  {a.allocationTypeName}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2563eb' }}>
                                {a.documentCode || '---'}
                              </td>
                              <td
                                style={{
                                  padding: '8px 10px',
                                  textAlign: 'right',
                                  fontWeight: 700,
                                  color: isNegative ? '#dc2626' : '#059669'
                                }}
                              >
                                {isNegative ? `-${Number(a.quantityAllocated).toLocaleString('vi-VN')}` : `+${Number(a.quantityAllocated).toLocaleString('vi-VN')}`}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>
                                {Number(a.unitCost).toLocaleString('vi-VN')} đ
                              </td>
                              <td style={{ padding: '8px 10px', color: '#334155' }}>
                                {a.partnerName || a.branchName || '---'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchTraceabilityDrawer;
