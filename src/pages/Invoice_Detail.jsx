import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  CoffeeOutlined,
  AppstoreOutlined,
  TagOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import { getSaleById } from '../api/documentApi';
import { getOrderById } from '../api/orderApi';

const Invoice_Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialInvoice = location.state?.invoice || location.state?.document || null;
  const [invoice, setInvoice] = useState(initialInvoice);
  const [loading, setLoading] = useState(!initialInvoice);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      let res = await getSaleById(id).catch(() => null);
      if (!res) {
        res = await getOrderById(id).catch(() => null);
      }
      if (res) {
        setInvoice(res);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết hóa đơn:', err);
      message.error('Không thể tải thông tin chi tiết hóa đơn.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const itemsList = useMemo(() => {
    if (!invoice) return [];
    const list = invoice.orderDetails || invoice.details || invoice.documentDetails || [];
    return list.map((it, idx) => {
      const code = it.productCode || it.snapshotProductCode || it.code || `M${idx + 1}`;
      const name = it.productName || it.snapshotProductName || it.name || 'Món ăn';
      const unit = it.unitName || it.snapshotUnitName || 'Phần';
      const qty = Number(it.quantity || 1);
      const price = Number(it.unitPrice || it.price || 0);
      const total = Number(it.totalPrice || (qty * price) || 0);
      const note = it.note || '';

      return {
        ...it,
        code,
        name,
        unit,
        qty,
        price,
        total,
        note
      };
    });
  }, [invoice]);

  const subtotal = itemsList.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = Number(invoice?.discountAmount || 0);
  const pointsUsed = Number(invoice?.pointsUsed || 0);
  const pointsDiscount = pointsUsed * 1000;
  const totalAmount = Number(invoice?.totalAmount ?? invoice?.total ?? Math.max(0, subtotal - discountAmount - pointsDiscount));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', background: '#f8fafc', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* HEADER */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={() => navigate('/inventory-management?tab=Invoice')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            <ArrowLeftOutlined /> Quay lại danh sách
          </button>

          <div style={{ borderLeft: '1px solid #e2e8f0', height: 24 }} />

          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              Quản lý kho / Hóa đơn bán hàng / Chi tiết hóa đơn
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                {invoice?.code || `HD${invoice?.id || ''}`}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 12, fontWeight: 700 }}>
                <CheckCircleOutlined /> Đã thanh toán
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
            <PrinterOutlined /> In hóa đơn
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
          {/* THẺ 1: BÀN & THỜI GIAN */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CoffeeOutlined style={{ color: '#ea580c' }} /> Bàn phục vụ & Thời gian
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Bàn / Khu vực:</span>
                <strong style={{ color: '#ea580c' }}>{invoice?.tableName || invoice?.table?.name || 'Bàn mang về'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Thời gian lập:</span>
                <span style={{ color: '#334155', fontWeight: 600 }}>
                  <CalendarOutlined style={{ marginRight: 4, color: '#94a3b8' }} />
                  {invoice?.orderDate || invoice?.createdAt ? dayjs(invoice.orderDate || invoice.createdAt).format('DD/MM/YYYY HH:mm') : '---'}
                </span>
              </div>
            </div>
          </div>

          {/* THẺ 2: NHÂN SỰ & KHÁCH HÀNG */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ color: '#2563eb' }} /> Thu ngân & Khách hàng
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Thu ngân:</span>
                <strong style={{ color: '#0f172a' }}>{invoice?.cashierName || invoice?.creatorName || 'Thu ngân'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Khách hàng:</span>
                <span style={{ color: '#334155', fontWeight: 600 }}>{invoice?.customerName || invoice?.partnerName || 'Khách lẻ'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Phương thức:</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>
                  <CreditCardOutlined style={{ marginRight: 4 }} />
                  {invoice?.paymentMethod === 'Transfer' || invoice?.paymentMethod === 2 ? 'Chuyển khoản' : 'Tiền mặt'}
                </span>
              </div>
            </div>
          </div>

          {/* THẺ 3: TỔNG TIỀN */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarCircleOutlined style={{ color: '#059669' }} /> Thanh toán hóa đơn
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tạm tính:</span>
                <span style={{ color: '#334155' }}>{Math.round(subtotal).toLocaleString('vi-VN')} đ</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Giảm giá:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>-{Math.round(discountAmount).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>Tổng thanh toán:</span>
                <strong style={{ fontSize: 16, color: '#059669' }}>{Math.round(totalAmount).toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG MÓN ĂN TRONG HÓA ĐƠN */}
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AppstoreOutlined /> Chi tiết món ăn / đồ uống ({itemsList.length})
          </div>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                  <th style={{ padding: '10px 12px' }}>Mã món</th>
                  <th style={{ padding: '10px 12px' }}>Tên món</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>ĐVT</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Số lượng</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Đơn giá (đ)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thành tiền (đ)</th>
                  <th style={{ padding: '10px 12px' }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {itemsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                      Chưa có chi tiết món ăn trong hóa đơn
                    </td>
                  </tr>
                ) : (
                  itemsList.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563eb' }}>{item.code}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{item.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{item.unit}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{item.qty}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                        {Math.round(item.price).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                        {Math.round(item.total).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.note}</td>
                    </tr>
                  ))
                )}
                <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={5} style={{ padding: '12px 14px', textAlign: 'right', color: '#1e293b', fontSize: 12 }}>
                    TỔNG CỘNG HÓA ĐƠN:
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 14, fontWeight: 900, color: '#059669' }}>
                    {Math.round(totalAmount).toLocaleString('vi-VN')} đ
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice_Detail;
