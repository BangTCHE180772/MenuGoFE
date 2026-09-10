import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  PrinterOutlined,
  AppstoreOutlined,
  TagOutlined,
  DollarCircleOutlined,
  HistoryOutlined,
  BarcodeOutlined,
  ShopOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import { getProductById } from '../api/productApi';
import { getBInventoryLedger } from '../api/binventoryApi';

const Product_Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialProduct = location.state?.product || location.state?.item || location.state?.document || null;
  const [product, setProduct] = useState(initialProduct);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'ledger'

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [prodRes, ledgRes] = await Promise.all([
        getProductById(id).catch(() => null),
        getBInventoryLedger(id, 1, 30).catch(() => null)
      ]);

      if (prodRes) {
        setProduct((prev) => ({ ...prev, ...prodRes }));
      }
      if (ledgRes) {
        const items = Array.isArray(ledgRes.items) ? ledgRes.items : (Array.isArray(ledgRes) ? ledgRes : []);
        setLedger(items);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết sản phẩm:', err);
      message.error('Không thể tải thông tin chi tiết sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const pCode = product?.code || product?.productCode || product?.barcode || `SP${id}`;
  const pName = product?.name || product?.productName || 'Sản phẩm';
  const uName = product?.unitName || product?.unit?.name || 'Đơn vị';
  const stockQty = Number(product?.quantity ?? product?.stockQuantity ?? product?.currentStock ?? 0);
  const avgCost = Number(product?.avgCost ?? product?.costPrice ?? product?.price ?? 0);
  const stockValue = stockQty * avgCost;
  const minStock = Number(product?.minQuantity ?? product?.minimumStockQuantity ?? 0);
  const maxStock = Number(product?.maxQuantity ?? product?.maximumStockQuantity ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', background: '#f8fafc', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* HEADER */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={() => navigate('/inventory-management?tab=Product')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            <ArrowLeftOutlined /> Quay lại danh sách
          </button>

          <div style={{ borderLeft: '1px solid #e2e8f0', height: 24 }} />

          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              Quản lý kho / Tồn kho hàng hóa / Chi tiết mặt hàng
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                {pName}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 11, fontWeight: 700 }}>
                <BarcodeOutlined /> {pCode}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            <PrinterOutlined /> In thẻ hàng
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
          {/* THẺ 1: TỒN KHO */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppstoreOutlined style={{ color: '#059669' }} /> Tình trạng tồn kho
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tồn kho hiện tại:</span>
                <strong style={{ fontSize: 15, color: stockQty <= minStock ? '#dc2626' : '#059669' }}>
                  {stockQty.toLocaleString('vi-VN')} {uName}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Định mức an toàn:</span>
                <span style={{ color: '#334155', fontWeight: 600 }}>
                  Min: {minStock} {uName} | Max: {maxStock > 0 ? `${maxStock} ${uName}` : '---'}
                </span>
              </div>
            </div>
          </div>

          {/* THẺ 2: GIÁ VỐN & GIÁ TRỊ */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarCircleOutlined style={{ color: '#2563eb' }} /> Giá vốn & Giá trị tồn
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Giá vốn bình quân:</span>
                <strong style={{ color: '#0f172a' }}>{Math.round(avgCost).toLocaleString('vi-VN')} đ / {uName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tổng giá trị tồn kho:</span>
                <strong style={{ fontSize: 15, color: '#2563eb' }}>{Math.round(stockValue).toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>
          </div>

          {/* THẺ 3: THÔNG TIN MẶT HÀNG */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TagOutlined style={{ color: '#ea580c' }} /> Đặc tính mặt hàng
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mã sản phẩm:</span>
                <strong style={{ color: '#2563eb' }}>{pCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Đơn vị tính chính:</span>
                <strong style={{ color: '#334155' }}>{uName}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG THẺ KHO */}
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              style={{
                padding: '12px 16px',
                fontSize: 12.5,
                fontWeight: 700,
                color: activeTab === 'info' ? '#e8442a' : '#64748b',
                borderBottom: activeTab === 'info' ? '2px solid #e8442a' : '2px solid transparent',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <HistoryOutlined /> Thẻ kho - Lịch sử biến động xuất nhập ({ledger.length})
            </button>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                  <th style={{ padding: '10px 12px' }}>Thời gian ghi sổ</th>
                  <th style={{ padding: '10px 12px' }}>Mã chứng từ</th>
                  <th style={{ padding: '10px 12px' }}>Loại giao dịch</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>SL thay đổi</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tồn sau GD</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Giá vốn ghi nhận (đ)</th>
                  <th style={{ padding: '10px 12px' }}>Người thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                      Chưa có lịch sử giao dịch thẻ kho cho mặt hàng này
                    </td>
                  </tr>
                ) : (
                  ledger.map((lg, idx) => (
                    <tr key={lg.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {lg.businessDate || lg.postedAt || lg.createdAt ? dayjs(lg.businessDate || lg.postedAt || lg.createdAt).format('DD/MM/YYYY HH:mm') : '---'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563eb' }}>
                        {lg.documentCode || lg.code || '---'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {lg.documentType || lg.type || 'Giao dịch kho'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: Number(lg.quantityDelta || lg.delta || 0) > 0 ? '#059669' : '#dc2626' }}>
                        {Number(lg.quantityDelta || lg.delta || 0) > 0 ? `+${Number(lg.quantityDelta || lg.delta || 0)}` : Number(lg.quantityDelta || lg.delta || 0)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {Number(lg.runningQuantity || lg.balance || 0).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                        {Math.round(Number(lg.runningAverageCost || lg.unitCost || 0)).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {lg.snapshotPostedByName || lg.creator || 'Hệ thống'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product_Detail;
