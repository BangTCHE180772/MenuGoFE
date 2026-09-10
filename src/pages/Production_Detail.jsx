import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import { getProductionById } from '../api/documentApi';

const Production_Detail = () => {
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
      const res = await getProductionById(id);
      if (res) {
        setDoc(res);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết lệnh sản xuất:', err);
      message.error('Không thể tải thông tin lệnh sản xuất.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const { finishedProducts, ingredients, totalFinishedValue, totalIngredientCost } = useMemo(() => {
    if (!doc) return { finishedProducts: [], ingredients: [], totalFinishedValue: 0, totalIngredientCost: 0 };
    const list = doc.details || doc.documentDetails || [];

    const finished = list.filter((d) => d.fatherId == null || d.isFinishedProduct === true).map((dt, idx) => {
      const pCode = dt.productCode || dt.snapshotProductCode || dt.code || `TP${idx + 1}`;
      const pName = dt.productName || dt.snapshotProductName || dt.name || 'Thành phẩm';
      const uName = dt.unitName || dt.snapshotUnitName || 'Phần';
      const qty = Number(dt.quantity || 0);
      const price = Number(dt.unitPrice || dt.snapshotAvgCost || 0);
      const total = qty * price;
      return { ...dt, pCode, pName, uName, qty, price, total };
    });

    const firstParentId = finished[0]?.id;
    const ingr = list.filter((d) => (d.fatherId != null || d.isFinishedProduct === false) && d.id !== firstParentId).map((dt, idx) => {
      const pCode = dt.productCode || dt.snapshotProductCode || dt.code || `NL${idx + 1}`;
      const pName = dt.productName || dt.snapshotProductName || dt.name || 'Nguyên liệu';
      const uName = dt.unitName || dt.snapshotUnitName || 'Kg';
      const qty = Number(dt.quantity || 0);
      const price = Number(dt.unitPrice || dt.snapshotAvgCost || 0);
      const total = qty * price;
      return { ...dt, pCode, pName, uName, qty, price, total };
    });

    const sumFinished = finished.reduce((sum, item) => sum + item.total, 0);
    const sumIngr = ingr.reduce((sum, item) => sum + item.total, 0);

    return {
      finishedProducts: finished,
      ingredients: ingr,
      totalFinishedValue: sumFinished,
      totalIngredientCost: sumIngr
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
            onClick={() => navigate('/inventory-management?tab=Production')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            <ArrowLeftOutlined /> Quay lại danh sách
          </button>

          <div style={{ borderLeft: '1px solid #e2e8f0', height: 24 }} />

          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              Quản lý kho / Sản xuất & Chế biến / Chi tiết lệnh sản xuất
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#9333ea' }}>
                {doc?.code || 'Lệnh sản xuất'}
              </span>
              {isPending ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', fontSize: 12, fontWeight: 700 }}>
                  <ClockCircleOutlined /> Lưu tạm
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 12, fontWeight: 700 }}>
                  <CheckCircleOutlined /> Đã hoàn thành
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
          {/* THẺ 1: LỆNH SẢN XUẤT */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ToolOutlined style={{ color: '#9333ea' }} /> Thông tin sản xuất
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mã lệnh:</span>
                <strong style={{ color: '#9333ea' }}>{doc?.code || '---'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Chi nhánh chế biến:</span>
                <span style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EnvironmentOutlined style={{ color: '#e8442a' }} />
                  {doc?.branchName || doc?.snapshotBranchName || 'Bếp trung tâm'}
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
                <span style={{ color: '#64748b' }}>Người tạo lệnh:</span>
                <strong style={{ color: '#0f172a' }}>{doc?.creatorName || doc?.snapshotCreatedByName || doc?.creator || 'Bếp trưởng'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Thời gian thực hiện:</span>
                <span style={{ color: '#334155', fontWeight: 600 }}>
                  <CalendarOutlined style={{ marginRight: 4, color: '#94a3b8' }} />
                  {doc?.orderDate || doc?.createdAt ? dayjs(doc.orderDate || doc.createdAt).format('DD/MM/YYYY HH:mm') : '---'}
                </span>
              </div>
            </div>
          </div>

          {/* THẺ 3: TỔNG GIÁ TRỊ SẢN XUẤT */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppstoreOutlined style={{ color: '#059669' }} /> Chi phí sản xuất
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tổng giá trị thành phẩm:</span>
                <strong style={{ fontSize: 14, color: '#059669' }}>{Math.round(totalFinishedValue).toLocaleString('vi-VN')} đ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Chi phí nguyên liệu tiêu hao:</span>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>{Math.round(totalIngredientCost).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* GHI CHÚ */}
        {doc?.note && (
          <div style={{ padding: '10px 16px', borderRadius: 6, background: '#faf5ff', border: '1px solid #e9d5ff', color: '#9333ea', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <InfoCircleOutlined />
            <span><strong>Ghi chú lệnh sản xuất:</strong> {doc.note}</span>
          </div>
        )}

        {/* BẢNG 1: THÀNH PHẨM THU ĐƯỢC */}
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12.5, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingOutlined /> Danh sách thành phẩm nhập kho ({finishedProducts.length})
          </div>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                  <th style={{ padding: '10px 12px' }}>Mã thành phẩm</th>
                  <th style={{ padding: '10px 12px' }}>Tên thành phẩm</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>ĐVT</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Số lượng thu được</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Giá vốn đơn vị (đ)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tổng giá trị (đ)</th>
                </tr>
              </thead>
              <tbody>
                {finishedProducts.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#9333ea' }}>{item.pCode}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{item.pName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{item.uName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{item.qty.toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                      {Math.round(item.price).toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                      {Math.round(item.total).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BẢNG 2: NGUYÊN LIỆU TIÊU HAO */}
        {ingredients.length > 0 && (
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12.5, color: '#ea580c', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AppstoreOutlined /> Danh sách nguyên vật liệu tiêu hao ({ingredients.length})
            </div>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                    <th style={{ padding: '10px 12px' }}>Mã nguyên liệu</th>
                    <th style={{ padding: '10px 12px' }}>Tên nguyên liệu</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>ĐVT</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Số lượng xuất</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Đơn giá xuất (đ)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thành tiền tiêu hao (đ)</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563eb' }}>{item.pCode}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{item.pName}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{item.uName}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{item.qty.toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                        {Math.round(item.price).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#ea580c' }}>
                        {Math.round(item.total).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Production_Detail;
