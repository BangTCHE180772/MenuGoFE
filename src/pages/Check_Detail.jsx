import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  AuditOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import { getCheckById } from '../api/documentApi';

const Check_Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialDoc = location.state?.document || null;
  const [doc, setDoc] = useState(initialDoc);
  const [loading, setLoading] = useState(!initialDoc);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getCheckById(id);
      if (res) {
        setDoc(res);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết phiếu kiểm kho:', err);
      message.error('Không thể tải thông tin phiếu kiểm kho.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const { detailsList, totalDiffValue, matchedCount, diffCount } = useMemo(() => {
    if (!doc) return { detailsList: [], totalDiffValue: 0, matchedCount: 0, diffCount: 0 };
    const list = doc.details || doc.documentDetails || [];
    let sumDiffValue = 0;
    let matched = 0;
    let diff = 0;

    const computed = list.map((dt, idx) => {
      const pCode = dt.productCode || dt.snapshotProductCode || dt.code || `SP${idx + 1}`;
      const pName = dt.productName || dt.snapshotProductName || dt.name || 'Sản phẩm';
      const uName = dt.unitName || dt.snapshotUnitName || 'Đơn vị';
      const systemQty = Number(dt.systemQuantity ?? dt.currentStockQuantity ?? 0);
      const actualQty = Number(dt.actualQuantity ?? dt.quantity ?? 0);
      const diffQty = actualQty - systemQty;
      const unitPrice = Number(dt.unitPrice || dt.snapshotAvgCost || 0);
      const diffValue = diffQty * unitPrice;

      sumDiffValue += diffValue;
      if (diffQty === 0) matched++;
      else diff++;

      return {
        ...dt,
        pCode,
        pName,
        uName,
        systemQty,
        actualQty,
        diffQty,
        unitPrice,
        diffValue
      };
    });

    return {
      detailsList: computed,
      totalDiffValue: sumDiffValue,
      matchedCount: matched,
      diffCount: diff
    };
  }, [doc]);

  const isPending = doc?.status === 0 || doc?.status === 'Pending';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', background: '#f8fafc', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* HEADER */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={() => navigate('/inventory-management?tab=Check')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            <ArrowLeftOutlined /> Quay lại danh sách
          </button>

          <div style={{ borderLeft: '1px solid #e2e8f0', height: 24 }} />

          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              Quản lý kho / Kiểm kho / Chi tiết phiếu kiểm kê
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                {doc?.code || 'Phiếu kiểm kho'}
              </span>
              {isPending ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', fontSize: 12, fontWeight: 700 }}>
                  <ClockCircleOutlined /> Lưu tạm
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 12, fontWeight: 700 }}>
                  <CheckCircleOutlined /> Đã cân bằng kho
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            <PrinterOutlined /> In phiếu
          </button>
          <button
            type="button"
            onClick={fetchDetail}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <ReloadOutlined spin={loading} /> Làm mới
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* THẺ 1: THÔNG TIN PHIẾU KIỂM */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AuditOutlined style={{ color: '#d97706' }} /> Thông tin kiểm kê
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mã phiếu kiểm:</span>
                <strong style={{ color: '#d97706' }}>{doc?.code || '---'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Chi nhánh:</span>
                <span style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EnvironmentOutlined style={{ color: '#e8442a' }} />
                  {doc?.branchName || doc?.snapshotBranchName || 'Chi nhánh trung tâm'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Trạng thái:</span>
                <span style={{ fontWeight: 600, color: isPending ? '#c2410c' : '#059669' }}>
                  {isPending ? 'Đang kiểm (Lưu tạm)' : 'Đã cân bằng tồn kho'}
                </span>
              </div>
            </div>
          </div>

          {/* THẺ 2: NHÂN SỰ & THỜI GIAN */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ color: '#2563eb' }} /> Nhân sự & Thời gian
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Người kiểm kê:</span>
                <strong style={{ color: '#0f172a' }}>{doc?.createdByName || doc?.snapshotCreatedByName || doc?.creatorName || 'Quản lý'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ngày kiểm kho:</span>
                <span style={{ color: '#334155', fontWeight: 600 }}>
                  <CalendarOutlined style={{ marginRight: 4, color: '#94a3b8' }} />
                  {doc?.orderDate || doc?.businessDate || doc?.createdAt ? dayjs(doc.orderDate || doc.businessDate || doc.createdAt).format('DD/MM/YYYY HH:mm') : '---'}
                </span>
              </div>
              {doc?.snapshotPostedByName && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Người chốt:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>{doc.snapshotPostedByName}</span>
                </div>
              )}
            </div>
          </div>

          {/* THẺ 3: TỔNG QUAN CHÊNH LỆCH */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {totalDiffValue >= 0 ? <RiseOutlined style={{ color: '#059669' }} /> : <FallOutlined style={{ color: '#dc2626' }} />}
              Tổng chênh lệch kiểm kê
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Khớp / Lệch số lượng:</span>
                <span>
                  <strong style={{ color: '#059669' }}>{matchedCount} khớp</strong> | <strong style={{ color: '#dc2626' }}>{diffCount} lệch</strong>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tổng giá trị lệch:</span>
                <strong style={{ fontSize: 14, color: totalDiffValue > 0 ? '#059669' : totalDiffValue < 0 ? '#dc2626' : '#64748b' }}>
                  {totalDiffValue > 0 ? `+${Math.round(totalDiffValue).toLocaleString('vi-VN')}` : Math.round(totalDiffValue).toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* GHI CHÚ */}
        {doc?.note && (
          <div style={{ padding: '10px 16px', borderRadius: 6, background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <InfoCircleOutlined />
            <span><strong>Ghi chú kiểm kho:</strong> {doc.note}</span>
          </div>
        )}

        {/* BẢNG SẢN PHẨM KIỂM KHO */}
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AppstoreOutlined /> Chi tiết mặt hàng kiểm kê ({detailsList.length})
          </div>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                  <th style={{ padding: '10px 12px' }}>Mã SP</th>
                  <th style={{ padding: '10px 12px' }}>Tên sản phẩm</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>ĐVT</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tồn hệ thống</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tồn thực tế</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>SL lệch</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Giá vốn (đ)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Giá trị lệch (đ)</th>
                </tr>
              </thead>
              <tbody>
                {detailsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                      Chưa có chi tiết sản phẩm kiểm kho
                    </td>
                  </tr>
                ) : (
                  detailsList.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#d97706' }}>{item.pCode}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{item.pName}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{item.uName}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{item.systemQty.toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{item.actualQty.toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: item.diffQty > 0 ? '#059669' : item.diffQty < 0 ? '#dc2626' : '#64748b' }}>
                        {item.diffQty > 0 ? `+${item.diffQty}` : item.diffQty}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                        {Math.round(item.unitPrice).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: item.diffValue > 0 ? '#059669' : item.diffValue < 0 ? '#dc2626' : '#64748b' }}>
                        {item.diffValue > 0 ? `+${Math.round(item.diffValue).toLocaleString('vi-VN')}` : Math.round(item.diffValue).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))
                )}
                <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={7} style={{ padding: '12px 14px', textAlign: 'right', color: '#1e293b', fontSize: 12 }}>
                    TỔNG GIÁ TRỊ CHÊNH LỆCH KHO:
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 13.5, fontWeight: 900, color: totalDiffValue > 0 ? '#059669' : totalDiffValue < 0 ? '#dc2626' : '#64748b' }}>
                    {totalDiffValue > 0 ? `+${Math.round(totalDiffValue).toLocaleString('vi-VN')}` : Math.round(totalDiffValue).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Check_Detail;
