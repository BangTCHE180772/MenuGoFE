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
  HistoryOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  DownOutlined,
  RightOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import {
  getPartnerById,
  getPartnerFinancialSummary,
  getPartnerImportDocuments,
  getPartnerCashFlows,
  payPartnerImportDocument,
  getPartnersByBranch
} from '../api/partnerApi';
import { getDebtDisplayInfo } from '../utils/debtHelper';
import { ReferenceLink } from '../utils/documentNavHelper';

// Phân loại nhãn hiển thị cho đối tác
const getPartnerBadge = (t) => {
  if (t === 1 || t === '1' || t === 'Supplier' || t === 'Nhà cung cấp' || t === 'NCC') {
    return { label: 'Nhà cung cấp', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
  }
  if (t === 2 || t === '2' || t === 'Customer' || t === 'Khách hàng' || t === 'KH') {
    return { label: 'Khách hàng', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
  }
  if (t === 3 || t === '3' || t === 'Transporter' || t === 'Vận chuyển' || t === 'VC') {
    return { label: 'Vận chuyển', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
  }
  return { label: 'Khác', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
};

// Chuẩn hóa phương thức thanh toán sang Tiếng Việt
const formatPaymentMethod = (method) => {
  if (!method) return 'Chưa xác định';
  if (method === 'Cash' || method === 1 || method === '1') return 'Tiền mặt';
  if (method === 'BankTransfer' || method === 2 || method === '2') return 'Chuyển khoản';
  if (method === 'Other' || method === 3 || method === '3') return 'Khác';
  if (method === 'Ghi nợ NCC') return 'Ghi nợ NCC';
  return method;
};

// Kiểu badge loại giao dịch
const formatTransactionTypeBadge = (type) => {
  if (type === 'Nhập hàng') {
    return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  }
  if (type === 'Thanh toán NCC') {
    return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
  }
  if (type === 'Thu lại NCC') {
    return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
  }
  return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
};

const Partner_Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialPartner = location.state?.partner || location.state?.document || null;
  const [partner, setPartner] = useState(initialPartner);
  const [summary, setSummary] = useState(null);
  const [docs, setDocs] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [loading, setLoading] = useState(!initialPartner);
  const [activeTab, setActiveTab] = useState('docs'); // 'docs' | 'cashflows'

  // States quản lý mở rộng phiếu nhập & thanh toán cho NCC
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayDoc, setSelectedPayDoc] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState(1);
  const [payDate, setPayDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [payNote, setPayNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const toggleDocExpand = (docId) => {
    setExpandedDocId((prev) => (prev === docId ? null : docId));
  };

  const handleOpenPayModal = (docItem) => {
    if (!docItem || docItem.debtAmount <= 0) {
      message.warning('Phiếu nhập này không còn dư nợ để thanh toán!');
      return;
    }
    setSelectedPayDoc(docItem);
    setPayAmount(docItem.debtAmount || 0);
    setPayMethod(1);
    setPayDate(dayjs().format('YYYY-MM-DD'));
    setPayNote(`Thanh toán cho NCC phiếu nhập ${docItem.code}`);
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedPayDoc || payAmount <= 0) return;
    setPayLoading(true);
    try {
      const paymentDateTime = payDate
        ? dayjs(payDate).hour(dayjs().hour()).minute(dayjs().minute()).second(dayjs().second()).toISOString()
        : new Date().toISOString();

      await payPartnerImportDocument(partner?.id || id, selectedPayDoc.id, {
        amount: Number(payAmount),
        paymentMethod: Number(payMethod),
        paymentDate: paymentDateTime,
        note: payNote
      });
      message.success('Thanh toán cho nhà cung cấp thành công!');
      setPaymentModalOpen(false);
      setSelectedPayDoc(null);
      await fetchDetail();
    } catch (err) {
      console.error('Lỗi khi thanh toán cho NCC:', err);
      message.error(err.response?.data?.message || 'Không thể thực hiện thanh toán lúc này!');
    } finally {
      setPayLoading(false);
    }
  };

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [partnerRes, sumRes, docsRes, cfRes] = await Promise.allSettled([
        getPartnerById(id),
        getPartnerFinancialSummary(id),
        getPartnerImportDocuments(id),
        getPartnerCashFlows(id)
      ]);

      let partnerData = null;
      if (partnerRes.status === 'fulfilled' && partnerRes.value) {
        partnerData = partnerRes.value;
      } else {
        // Fallback tìm đối tác theo danh sách chi nhánh nếu getPartnerById chưa hỗ trợ
        try {
          const branchId = localStorage.getItem('currentBranchId') || 1;
          const branchPartners = await getPartnersByBranch(branchId);
          const list = Array.isArray(branchPartners?.data)
            ? branchPartners.data
            : Array.isArray(branchPartners)
            ? branchPartners
            : [];
          partnerData = list.find((p) => String(p.id) === String(id));
        } catch (_) {}
      }

      if (partnerData) {
        setPartner((prev) => ({
          ...prev,
          ...partnerData
        }));
      }

      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummary(sumRes.value);
        setPartner((prev) => ({
          ...prev,
          id: prev?.id || sumRes.value.partnerId || id,
          name: sumRes.value.partnerName || prev?.name || 'Đối tác'
        }));
      }

      if (docsRes.status === 'fulfilled') {
        setDocs(docsRes.value || []);
      }
      if (cfRes.status === 'fulfilled') {
        setCashFlows(cfRes.value || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết hồ sơ đối tác:', err);
      message.error('Không thể tải dữ liệu chi tiết đối tác!');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const badge = getPartnerBadge(partner?.type ?? 1);
  const totalImport = summary?.totalImportAmount || 0;
  const totalReturn = summary?.totalReturnAmount || 0;
  const totalPaid = summary?.totalPaidAmount || 0;
  const remainingDebt = summary?.remainingDebt ?? partner?.remainingDebt ?? 0;
  const debtInfo = getDebtDisplayInfo(remainingDebt);

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
                {partner?.name || summary?.partnerName || 'Đối tác'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontSize: 11, fontWeight: 700 }}>
                <ShopOutlined /> {badge.label}
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
        {/* CARDS TỔNG QUAN HỒ SƠ & TÀI CHÍNH */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* THẺ 1: THÔNG TIN ĐỐI TÁC */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShopOutlined style={{ color: '#2563eb' }} /> Thông tin đối tác
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tên đối tác:</span>
                <strong style={{ color: '#0f172a' }}>{partner?.name || summary?.partnerName || 'Chưa cập nhật'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mã đối tác:</span>
                <strong style={{ color: '#2563eb' }}>{`DT${partner?.id || id}`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Số điện thoại:</span>
                <strong style={{ color: '#1e293b' }}>{partner?.phone || 'Chưa cập nhật'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ color: '#334155', fontWeight: 500 }}>{partner?.email || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Địa chỉ:</span>
                <span style={{ color: '#334155', fontWeight: 500 }}>{partner?.address || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>

          {/* THẺ 2: TÌNH HÌNH TÀI CHÍNH & CÔNG NỢ */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarCircleOutlined style={{ color: '#16a34a' }} /> Tình hình tài chính
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tổng giá trị hàng nhập:</span>
                <strong style={{ color: '#1d4ed8' }}>{totalImport.toLocaleString('vi-VN')} VNĐ</strong>
              </div>
              {totalReturn > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Giá trị hàng xuất trả:</span>
                  <strong style={{ color: '#ea580c' }}>{totalReturn.toLocaleString('vi-VN')} VNĐ</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tiền đã chi cho NCC:</span>
                <strong style={{ color: '#15803d' }}>{totalPaid.toLocaleString('vi-VN')} VNĐ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: 6, marginTop: 2 }}>
                <span style={{ color: '#64748b' }}>Công nợ:</span>
                <strong style={{ fontSize: 14, color: debtInfo.color }}>
                  {debtInfo.formattedAmount} ({debtInfo.label})
                </strong>
              </div>
            </div>
          </div>

          {/* THẺ 3: TỔNG QUAN GIAO DỊCH */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HistoryOutlined style={{ color: '#ea580c' }} /> Tổng quan giao dịch
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tổng số phiếu nhập hàng:</span>
                <strong style={{ color: '#0f172a' }}>{docs.length} phiếu</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Lịch sử giao dịch tài chính:</span>
                <strong style={{ color: '#0f172a' }}>{cashFlows.length} giao dịch</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Trạng thái công nợ:</span>
                <span style={{ fontWeight: 700, color: debtInfo.color }}>
                  {debtInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GHI CHÚ */}
        <div style={{ padding: '10px 16px', borderRadius: 6, background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <InfoCircleOutlined />
          <span><strong>Ghi chú:</strong> {partner?.note || 'Không có ghi chú thêm'}</span>
        </div>

        {/* CONTAINER CHÍNH CÓ CÁC TABS */}
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          {/* HEADER TABS */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              padding: '0 16px'
            }}
          >
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
              <FileTextOutlined /> Phiếu nhập hàng ({docs.length})
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
              <HistoryOutlined /> Lịch sử giao dịch ({cashFlows.length})
            </button>
          </div>

          {/* NỘI DUNG TAB PHIẾU NHẬP HÀNG */}
          {activeTab === 'docs' && (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                    <th style={{ padding: '10px 12px' }}>Mã phiếu nhập</th>
                    <th style={{ padding: '10px 12px' }}>Ngày nhập</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tổng tiền (đ)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Đã thanh toán (đ)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Còn nợ (đ)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Trạng thái thanh toán</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                        Chưa có phiếu nhập hàng nào từ nhà cung cấp này
                      </td>
                    </tr>
                  ) : (
                    docs.map((d, idx) => {
                      const isDocExpanded = expandedDocId === d.id;
                      const isReturned = d.paymentStatus === 'Returned' || (d.returnedAmount > 0 && d.debtAmount === 0 && d.amountPaid === 0);
                      const hasPaid = d.debtAmount === 0;

                      return (
                        <React.Fragment key={d.id || idx}>
                          <tr
                            onClick={() => toggleDocExpand(d.id)}
                            style={{
                              borderBottom: isDocExpanded ? 'none' : '1px solid #f1f5f9',
                              background: isDocExpanded ? '#fff7ed' : idx % 2 === 1 ? '#fafafa' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isDocExpanded) e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isDocExpanded) e.currentTarget.style.backgroundColor = idx % 2 === 1 ? '#fafafa' : '#ffffff';
                            }}
                          >
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {isDocExpanded ? (
                                  <DownOutlined style={{ fontSize: 10, color: '#e8442a' }} />
                                ) : (
                                  <RightOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
                                )}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/inventory-management?tab=Import&search=${encodeURIComponent(d.code)}`);
                                  }}
                                  style={{
                                    color: '#2563eb',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}
                                  title="Nhấp để chuyển tới Quản lý nhập hàng"
                                >
                                  {d.code}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#334155' }}>
                              {dayjs(d.importDate).format('DD/MM/YYYY HH:mm')}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                              <div>{d.totalAmount.toLocaleString('vi-VN')} đ</div>
                              {d.returnedAmount > 0 && (
                                <div style={{ fontSize: 10, color: '#ea580c', fontWeight: 600 }}>
                                  (Đã trả: -{d.returnedAmount.toLocaleString('vi-VN')} đ)
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                              {d.amountPaid.toLocaleString('vi-VN')} đ
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: d.debtAmount > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                              {d.debtAmount.toLocaleString('vi-VN')} đ
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              {isReturned ? (
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    background: '#f5f3ff',
                                    color: '#7c3aed',
                                    border: '1px solid #ddd6fe',
                                    fontSize: 10.5,
                                    fontWeight: 700
                                  }}
                                >
                                  Đã trả hàng
                                </span>
                              ) : hasPaid ? (
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    background: '#f0fdf4',
                                    color: '#16a34a',
                                    border: '1px solid #bbf7d0',
                                    fontSize: 10.5,
                                    fontWeight: 700
                                  }}
                                >
                                  Đã thanh toán
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPayModal(d);
                                  }}
                                  style={{
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fca5a5',
                                    borderRadius: 4,
                                    padding: '3px 9px',
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.08)'
                                  }}
                                  title="Chưa thanh toán - Nhấp để thanh toán cho nhà cung cấp"
                                >
                                  <DollarOutlined style={{ fontSize: 11 }} /> Chưa thanh toán
                                </button>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <span
                                onClick={() => navigate(`/inventory-management?tab=Import&search=${encodeURIComponent(d.code)}`)}
                                style={{
                                  fontSize: 11,
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  textDecoration: 'underline'
                                }}
                                title="Nhấp để chuyển tới Quản lý nhập hàng"
                              >
                                Xem chứng từ
                              </span>
                            </td>
                          </tr>

                          {/* VÙNG CHI TIẾT LỊCH SỬ GIAO DỊCH TƯƠNG ỨNG CỦA PHIẾU NHẬP */}
                          {isDocExpanded && (
                            <tr style={{ background: '#f8fafc' }}>
                              <td colSpan={7} style={{ padding: '10px 14px 14px 14px', borderBottom: '1px solid #cbd5e1' }}>
                                <div
                                  style={{
                                    background: '#ffffff',
                                    borderRadius: 6,
                                    border: '1px solid #e2e8f0',
                                    padding: 12,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <HistoryOutlined style={{ color: '#ea580c' }} /> Lịch sử giao dịch thanh toán cho phiếu nhập {d.code} ({d.transactions ? d.transactions.length : 0})
                                    </div>
                                    {d.debtAmount > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPayModal(d)}
                                        style={{
                                          background: '#16a34a',
                                          color: '#ffffff',
                                          border: 'none',
                                          borderRadius: 4,
                                          padding: '3px 10px',
                                          fontSize: 11,
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4
                                        }}
                                      >
                                        <DollarOutlined /> Thanh toán cho NCC ({d.debtAmount.toLocaleString('vi-VN')} đ)
                                      </button>
                                    )}
                                  </div>

                                  {(!d.transactions || d.transactions.length === 0) ? (
                                    <div style={{ textAlign: 'center', padding: '14px 0', color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>
                                      Chưa có phát sinh giao dịch thanh toán nào cho phiếu nhập này
                                    </div>
                                  ) : (
                                    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 4 }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                        <thead>
                                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: 9.5 }}>
                                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Thời gian</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Loại giao dịch</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Mã Thu/Chi</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Phương thức</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Số tiền thanh toán</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Ghi chú</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {d.transactions.map((tx) => (
                                            <tr key={tx.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                              <td style={{ padding: '6px 8px', color: '#64748b' }}>
                                                {dayjs(tx.transactionDate).format('DD/MM/YYYY HH:mm')}
                                              </td>
                                              <td style={{ padding: '6px 8px' }}>
                                                <span style={{ padding: '1px 6px', borderRadius: 3, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: 9.5, fontWeight: 600 }}>
                                                  {tx.transactionType}
                                                </span>
                                              </td>
                                              <td style={{ padding: '6px 8px' }}>
                                                {tx.code ? (
                                                  <span
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      navigate(`/cashflow?search=${encodeURIComponent(tx.code)}`);
                                                    }}
                                                    style={{
                                                      color: '#0284c7',
                                                      fontWeight: 700,
                                                      cursor: 'pointer',
                                                      textDecoration: 'underline'
                                                    }}
                                                    title="Nhấp để xem sổ quỹ"
                                                  >
                                                    {tx.code}
                                                  </span>
                                                ) : (
                                                  <span style={{ color: '#94a3b8' }}>---</span>
                                                )}
                                              </td>
                                              <td style={{ padding: '6px 8px', color: '#475569' }}>
                                                {formatPaymentMethod(tx.paymentMethod)}
                                              </td>
                                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                                {Math.abs(tx.amount).toLocaleString('vi-VN')} đ
                                              </td>
                                              <td style={{ padding: '6px 8px', color: '#64748b' }}>
                                                {tx.note || '---'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                  <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={2} style={{ padding: '12px 14px', textAlign: 'right', color: '#1e293b', fontSize: 12 }}>
                      TỔNG CỘNG ({docs.length} PHIẾU NHẬP):
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>
                      {totalImport.toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#16a34a' }}>
                      {docs.reduce((sum, d) => sum + Number(d.amountPaid || 0), 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 13, fontWeight: 800, color: debtInfo.color }}>
                      {docs.reduce((sum, d) => sum + Number(d.debtAmount || 0), 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* NỘI DUNG TAB LỊCH SỬ GIAO DỊCH */}
          {activeTab === 'cashflows' && (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                    <th style={{ padding: '10px 12px' }}>Mã nhập hàng</th>
                    <th style={{ padding: '10px 12px' }}>Ngày giao dịch</th>
                    <th style={{ padding: '10px 12px' }}>Loại giao dịch</th>
                    <th style={{ padding: '10px 12px' }}>Mã Thu/Chi</th>
                    <th style={{ padding: '10px 12px' }}>Phương thức</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Số tiền (đ)</th>
                    <th style={{ padding: '10px 12px' }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                        Chưa có phát sinh giao dịch tài chính nào với đối tác này
                      </td>
                    </tr>
                  ) : (
                    cashFlows.map((cf, idx) => {
                      const typeBadge = formatTransactionTypeBadge(cf.transactionType);
                      const isExpense = cf.amount < 0;
                      return (
                        <tr key={cf.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                          <td style={{ padding: '10px 12px' }}>
                            {cf.importCode ? (
                              <span
                                onClick={() => navigate(`/inventory-management?tab=Import&search=${encodeURIComponent(cf.importCode)}`)}
                                style={{
                                  color: '#2563eb',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                                title="Nhấp để chuyển tới Quản lý nhập hàng"
                              >
                                {cf.importCode}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>---</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#334155' }}>
                            {cf.transactionDate || cf.businessDate || cf.createdAt ? dayjs(cf.transactionDate || cf.businessDate || cf.createdAt).format('DD/MM/YYYY HH:mm') : '---'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '2px 7px', borderRadius: 4, background: typeBadge.bg, color: typeBadge.color, border: `1px solid ${typeBadge.border}`, fontSize: 10.5, fontWeight: 700 }}>
                              {cf.transactionType}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0284c7' }}>
                            {cf.code ? (
                              <span
                                onClick={() => navigate(`/cashflow?search=${encodeURIComponent(cf.code)}`)}
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                title="Nhấp để xem sổ quỹ"
                              >
                                {cf.code}
                              </span>
                            ) : (
                              '---'
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>
                            {formatPaymentMethod(cf.paymentMethod)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: isExpense ? '#16a34a' : '#dc2626' }}>
                            {cf.amount > 0 ? `+${cf.amount.toLocaleString('vi-VN')}` : cf.amount.toLocaleString('vi-VN')} đ
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>
                            {cf.note || '---'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={5} style={{ padding: '12px 14px', textAlign: 'right', color: '#1e293b', fontSize: 12 }}>
                      TỔNG TIỀN ĐÃ CHI TRẢ CHO NCC:
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 13.5, fontWeight: 900, color: '#16a34a' }}>
                      {totalPaid.toLocaleString('vi-VN')} đ
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL THANH TOÁN TIỀN CHO NHÀ CUNG CẤP */}
      {paymentModalOpen && selectedPayDoc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setPaymentModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              width: 480,
              maxWidth: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* TIÊU ĐỀ MODAL */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                Thanh toán cho Nhà cung cấp
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* FORM THANH TOÁN */}
            <form onSubmit={handleConfirmPayment} style={{ padding: '16px 18px' }}>
              {/* TÓM TẮT PHIẾU NHẬP */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
                  <div>Mã phiếu: <strong style={{ color: '#2563eb' }}>{selectedPayDoc.code}</strong></div>
                  <div>Đối tác: <strong>{partner?.name || summary?.partnerName}</strong></div>
                  <div>Tổng tiền: <strong>{selectedPayDoc.totalAmount.toLocaleString('vi-VN')} VNĐ</strong></div>
                  <div>Đã thanh toán: <strong style={{ color: '#16a34a' }}>{selectedPayDoc.amountPaid.toLocaleString('vi-VN')} VNĐ</strong></div>
                  <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #cbd5e1', paddingTop: 6, marginTop: 2 }}>
                    Số tiền còn nợ: <strong style={{ color: '#dc2626', fontSize: 13 }}>{selectedPayDoc.debtAmount.toLocaleString('vi-VN')} VNĐ</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Số tiền thanh toán (VNĐ) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedPayDoc.debtAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '4px 10px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0f172a',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Hình thức thanh toán
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: 34,
                      padding: '4px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value={1}>Tiền mặt</option>
                    <option value={2}>Chuyển khoản</option>
                    <option value={3}>Khác</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Ngày thanh toán
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    style={{
                      width: '100%',
                      height: 34,
                      padding: '4px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Ghi chú thanh toán
                </label>
                <textarea
                  rows={2}
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Nhập ghi chú cho đợt thanh toán này..."
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: payLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {payLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partner_Detail;
