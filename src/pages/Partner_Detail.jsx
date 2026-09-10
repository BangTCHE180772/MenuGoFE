import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  PrinterOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import {
  getPartnerFinancialSummary,
  getPartnerImportDocuments,
  getPartnerCashFlows
} from '../api/partnerApi';

const Partner_Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialPartner = location.state?.partner || location.state?.document || null;
  const [partner, setPartner] = useState(initialPartner);
  const [summary, setSummary] = useState(null);
  const [importDocs, setImportDocs] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [loading, setLoading] = useState(!initialPartner);
  const [activeTab, setActiveTab] = useState('docs'); // 'docs' | 'cashflows'

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [sumRes, docsRes, cfRes] = await Promise.all([
        getPartnerFinancialSummary(id).catch(() => null),
        getPartnerImportDocuments(id).catch(() => []),
        getPartnerCashFlows(id).catch(() => [])
      ]);

      if (sumRes) {
        setSummary(sumRes);
        setPartner((prev) => ({
          ...prev,
          name: sumRes.partnerName || prev?.name || 'Đối tác',
          phone: sumRes.partnerPhone || prev?.phone,
          email: sumRes.partnerEmail || prev?.email,
          address: sumRes.partnerAddress || prev?.address
        }));
      }
      setImportDocs(Array.isArray(docsRes) ? docsRes : []);
      setCashFlows(Array.isArray(cfRes) ? cfRes : []);
    } catch (err) {
      console.error('Lỗi khi tải thông tin đối tác:', err);
      message.error('Không thể tải thông tin hồ sơ đối tác.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const debtAmt = Number(summary?.totalDebt ?? partner?.totalDebt ?? partner?.remainingDebt ?? 0);
  const totalBought = Number(summary?.totalPurchased ?? summary?.totalAmount ?? 0);
  const totalPaid = Number(summary?.totalPaid ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', background: '#f8fafc', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* HEADER */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={() => navigate('/inventory-management?tab=Partner')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            <ArrowLeftOutlined /> Quay lại danh sách
          </button>

          <div style={{ borderLeft: '1px solid #e2e8f0', height: 24 }} />

          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              Quản lý kho / Đối tác & Nhà cung cấp / Chi tiết hồ sơ
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                {partner?.name || 'Nhà cung cấp'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 11, fontWeight: 700 }}>
                <ShopOutlined /> {partner?.type === 1 || partner?.type === 'ExtraPartner' ? 'Đối tác khác' : 'Nhà cung cấp'}
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
          {/* THẺ 1: THÔNG TIN LIÊN HỆ */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShopOutlined style={{ color: '#e8442a' }} /> Thông tin liên hệ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PhoneOutlined style={{ color: '#059669' }} />
                <span style={{ color: '#64748b' }}>SĐT:</span>
                <strong style={{ color: '#0f172a' }}>{partner?.phone || '---'}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MailOutlined style={{ color: '#2563eb' }} />
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ color: '#334155' }}>{partner?.email || '---'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EnvironmentOutlined style={{ color: '#e8442a' }} />
                <span style={{ color: '#64748b' }}>Địa chỉ:</span>
                <span style={{ color: '#334155' }}>{partner?.address || '---'}</span>
              </div>
            </div>
          </div>

          {/* THẺ 2: CÔNG NỢ */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarCircleOutlined style={{ color: '#dc2626' }} /> Tình hình công nợ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Công nợ cần trả NCC:</span>
                <strong style={{ fontSize: 14, color: debtAmt > 0 ? '#dc2626' : '#059669' }}>
                  {Math.round(debtAmt).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Trạng thái công nợ:</span>
                <span style={{ fontWeight: 600, color: debtAmt > 0 ? '#dc2626' : '#059669' }}>
                  {debtAmt > 0 ? 'Đang có nợ phải trả' : 'Đã thanh toán hết'}
                </span>
              </div>
            </div>
          </div>

          {/* THẺ 3: TỔNG QUAN GIAO DỊCH */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HistoryOutlined style={{ color: '#059669' }} /> Tổng giao dịch
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tổng số phiếu nhập:</span>
                <strong style={{ color: '#0f172a' }}>{importDocs.length} phiếu</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tổng số phiếu chi:</span>
                <strong style={{ color: '#0f172a' }}>{cashFlows.length} giao dịch</strong>
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG LỊCH SỬ GIAO DỊCH & NHẬP HÀNG */}
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('docs')}
              style={{
                padding: '12px 16px',
                fontSize: 12.5,
                fontWeight: 700,
                color: activeTab === 'docs' ? '#e8442a' : '#64748b',
                borderBottom: activeTab === 'docs' ? '2px solid #e8442a' : '2px solid transparent',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <FileTextOutlined /> Lịch sử phiếu nhập hàng ({importDocs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cashflows')}
              style={{
                padding: '12px 16px',
                fontSize: 12.5,
                fontWeight: 700,
                color: activeTab === 'cashflows' ? '#e8442a' : '#64748b',
                borderBottom: activeTab === 'cashflows' ? '2px solid #e8442a' : '2px solid transparent',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <DollarCircleOutlined /> Lịch sử thanh toán chi trả ({cashFlows.length})
            </button>
          </div>

          {activeTab === 'docs' && (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                    <th style={{ padding: '10px 12px' }}>Mã phiếu nhập</th>
                    <th style={{ padding: '10px 12px' }}>Ngày nhập</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tổng tiền (đ)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Đã trả (đ)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Còn nợ (đ)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {importDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                        Chưa có phiếu nhập hàng nào từ nhà cung cấp này
                      </td>
                    </tr>
                  ) : (
                    importDocs.map((docItem, idx) => (
                      <tr key={docItem.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563eb' }}>{docItem.code}</td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>
                          {docItem.orderDate || docItem.createdAt ? dayjs(docItem.orderDate || docItem.createdAt).format('DD/MM/YYYY HH:mm') : '---'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                          {Math.round(Number(docItem.totalAmount || 0)).toLocaleString('vi-VN')} đ
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                          {Math.round(Number(docItem.amountPaid || 0)).toLocaleString('vi-VN')} đ
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                          {Math.round(Number(docItem.amountDue ?? ((docItem.totalAmount || 0) - (docItem.amountPaid || 0)))).toLocaleString('vi-VN')} đ
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 10.5, fontWeight: 600 }}>
                            Hoàn thành
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'cashflows' && (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                    <th style={{ padding: '10px 12px' }}>Mã phiếu chi</th>
                    <th style={{ padding: '10px 12px' }}>Ngày giao dịch</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Số tiền chi (đ)</th>
                    <th style={{ padding: '10px 12px' }}>Phương thức</th>
                    <th style={{ padding: '10px 12px' }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                        Chưa có giao dịch chi trả nào cho nhà cung cấp này
                      </td>
                    </tr>
                  ) : (
                    cashFlows.map((cf, idx) => (
                      <tr key={cf.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#e8442a' }}>{cf.code}</td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>
                          {cf.businessDate ? dayjs(cf.businessDate).format('DD/MM/YYYY HH:mm') : '---'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          {Math.round(Number(cf.totalAmount || 0)).toLocaleString('vi-VN')} đ
                        </td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>
                          {cf.paymentMethod === 'Cash' || cf.paymentMethod === 1 ? 'Tiền mặt' : 'Chuyển khoản'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{cf.note || '---'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Partner_Detail;
