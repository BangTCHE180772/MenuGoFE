import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  FileTextOutlined,
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  DownOutlined,
  RightOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { getPartnerFinancialSummary, getPartnerImportDocuments, getPartnerCashFlows, payPartnerImportDocument } from '../../../../api/partnerApi';
import { getDebtDisplayInfo } from '../../../../utils/debtHelper';
import dayjs from 'dayjs';

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

// Component chi tiết đối tác hiển thị 3 tab: Thông tin đối tác, Lịch sử giao dịch, Phiếu nhập hàng
const PartnerDetailSection = ({ partner, onEdit, onDelete, onRefresh }) => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('info'); // 'info' | 'transactions' | 'importDocs'
  const [summary, setSummary] = useState(null);
  const [docs, setDocs] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleOpenPayModal = (doc) => {
    if (!doc || doc.debtAmount <= 0) {
      message.warning('Phiếu nhập này không còn dư nợ để thanh toán!');
      return;
    }
    setSelectedPayDoc(doc);
    setPayAmount(doc.debtAmount || 0);
    setPayMethod(1);
    setPayDate(dayjs().format('YYYY-MM-DD'));
    setPayNote(`Thanh toán cho NCC phiếu nhập ${doc.code}`);
    setPaymentModalOpen(true);
  };

  const fetchData = useCallback(async () => {
    if (!partner?.id) return;
    setLoading(true);
    try {
      const [sumRes, docsRes, cfRes] = await Promise.allSettled([
        getPartnerFinancialSummary(partner.id),
        getPartnerImportDocuments(partner.id),
        getPartnerCashFlows(partner.id)
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (docsRes.status === 'fulfilled') setDocs(docsRes.value || []);
      if (cfRes.status === 'fulfilled') setCashFlows(cfRes.value || []);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết đối tác:', err);
    } finally {
      setLoading(false);
    }
  }, [partner?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedPayDoc || payAmount <= 0) return;
    setPayLoading(true);
    try {
      const paymentDateTime = payDate
        ? dayjs(payDate).hour(dayjs().hour()).minute(dayjs().minute()).second(dayjs().second()).toISOString()
        : new Date().toISOString();

      await payPartnerImportDocument(partner.id, selectedPayDoc.id, {
        amount: Number(payAmount),
        paymentMethod: Number(payMethod),
        paymentDate: paymentDateTime,
        note: payNote
      });
      message.success('Thanh toán cho nhà cung cấp thành công!');
      setPaymentModalOpen(false);
      setSelectedPayDoc(null);
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi khi thanh toán cho NCC:', err);
      message.error(err.response?.data?.message || 'Không thể thực hiện thanh toán lúc này!');
    } finally {
      setPayLoading(false);
    }
  };

  const badge = getPartnerBadge(partner.type);
  const totalImport = summary?.totalImportAmount || 0;
  const totalReturn = summary?.totalReturnAmount || 0;
  const totalPaid = summary?.totalPaidAmount || 0;
  const remainingDebt = summary?.remainingDebt || 0;
  const debtInfo = getDebtDisplayInfo(remainingDebt);

  return (
    <div style={{ padding: 16 }}>
      {/* HEADER SUB TABS */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 8px',
          marginBottom: 14,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('info')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              fontWeight: activeSubTab === 'info' ? 700 : 500,
              color: activeSubTab === 'info' ? '#ea580c' : '#64748b',
              borderBottom: activeSubTab === 'info' ? '2px solid #ea580c' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Thông tin đối tác
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('transactions')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              fontWeight: activeSubTab === 'transactions' ? 700 : 500,
              color: activeSubTab === 'transactions' ? '#ea580c' : '#64748b',
              borderBottom: activeSubTab === 'transactions' ? '2px solid #ea580c' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Lịch sử giao dịch {cashFlows.length > 0 ? `(${cashFlows.length})` : ''}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('importDocs')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              fontWeight: activeSubTab === 'importDocs' ? 700 : 500,
              color: activeSubTab === 'importDocs' ? '#ea580c' : '#64748b',
              borderBottom: activeSubTab === 'importDocs' ? '2px solid #ea580c' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Phiếu nhập hàng {docs.length > 0 ? `(${docs.length})` : ''}
          </button>
        </div>

        {/* NÚT THAO TÁC HỒ SƠ ĐỐI TÁC */}
        <div style={{ display: 'flex', gap: 8, paddingRight: 4 }}>
          <button
            type="button"
            onClick={() => navigate(`/partner-detail/${partner.id}`, { state: { partner } })}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <EyeOutlined style={{ color: '#e8442a' }} /> Chi tiết đối tác
          </button>
          <button
            type="button"
            onClick={() => onEdit && onEdit(partner)}
            style={{
              background: '#ffffff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <EditOutlined /> Sửa thông tin
          </button>
          <button
            type="button"
            onClick={() => onDelete && onDelete(partner.id)}
            style={{
              background: '#ffffff',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <DeleteOutlined /> Xóa đối tác
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
          Đang tải dữ liệu chi tiết đối tác...
        </div>
      ) : (
        <>
          {/* TAB 1: THÔNG TIN ĐỐI TÁC */}
          {activeSubTab === 'info' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
                {/* HÀNG 1 - CỘT 1: Tên đối tác */}
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Tên đối tác</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, wordBreak: 'break-word' }}>{partner.name}</div>
                </div>

                {/* HÀNG 1 - CỘT 2: Số điện thoại */}
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Số điện thoại</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 12 }}>{partner.phone || 'Chưa cập nhật'}</div>
                </div>

                {/* HÀNG 1 - CỘT 3: Địa chỉ */}
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Địa chỉ</div>
                  <div style={{ fontWeight: 500, color: '#1e293b', fontSize: 12, wordBreak: 'break-word' }}>{partner.address || 'Chưa cập nhật'}</div>
                </div>

                {/* HÀNG 2 - CỘT 1: Mã đối tác */}
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Mã đối tác</div>
                  <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 12.5 }}>{`DT${partner.id}`}</div>
                </div>

                {/* HÀNG 2 - CỘT 2: Email */}
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Email</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 12, wordBreak: 'break-word' }}>{partner.email || 'Chưa cập nhật'}</div>
                </div>

                {/* HÀNG 2 - CỘT 3: Ghi chú */}
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: 10.5, marginBottom: 2 }}>Ghi chú</div>
                  <div style={{ color: '#475569', fontSize: 12, fontStyle: partner.note ? 'normal' : 'italic', wordBreak: 'break-word' }}>
                    {partner.note || 'Không có ghi chú thêm'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LỊCH SỬ GIAO DỊCH */}
          {activeSubTab === 'transactions' && (
            <div>
              {/* CARDS TỔNG QUAN TÀI CHÍNH */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 76 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
                      <FileTextOutlined style={{ marginRight: 4 }} /> Tổng giá trị hàng nhập
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1d4ed8', marginTop: 4 }}>
                      {totalImport.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                  <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                    (Tổng giá trị hàng hóa đã nhận)
                  </div>
                </div>

                {totalReturn > 0 && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 76 }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: '#c2410c', fontWeight: 700, textTransform: 'uppercase' }}>
                        <FileTextOutlined style={{ marginRight: 4 }} /> Giá trị hàng xuất trả
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#ea580c', marginTop: 4 }}>
                        {totalReturn.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                    <div style={{ fontSize: 9.5, color: '#9a3412', marginTop: 2 }}>
                      (Hàng đã xuất gửi trả lại NCC)
                    </div>
                  </div>
                )}

                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 76 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                      <DollarOutlined style={{ marginRight: 4 }} /> Tiền đã chi cho NCC
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                      {totalPaid.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                  <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                    (Tiền mặt / CK thực tế đã trả)
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: 8, background: debtInfo.bgColor, border: `1px solid ${debtInfo.borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 76 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: debtInfo.color, fontWeight: 700, textTransform: 'uppercase' }}>
                      <HistoryOutlined style={{ marginRight: 4 }} /> {debtInfo.label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: debtInfo.color, marginTop: 4 }}>
                      {debtInfo.formattedAmount}
                    </div>
                  </div>
                  <div style={{ fontSize: 9.5, color: debtInfo.color, opacity: 0.85, marginTop: 2 }}>
                    (Dư nợ sau khi bù trừ)
                  </div>
                </div>
              </div>

              {/* BẢNG LỊCH SỬ GIAO DỊCH */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HistoryOutlined style={{ color: '#ea580c' }} /> Lịch sử phát sinh giao dịch tài chính ({cashFlows.length})
                </div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>
                  * Ghi nhận dòng tiền nhập hàng và thanh toán cho đối tác
                </span>
              </div>

              <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: 9.5 }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Mã nhập hàng</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Ngày giao dịch</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Loại giao dịch</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Mã Thu/Chi</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Phương thức</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Số tiền</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlows.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                          Chưa có phát sinh giao dịch tài chính nào với đối tác này
                        </td>
                      </tr>
                    ) : (
                      cashFlows.map((cf) => {
                        const typeBadge = formatTransactionTypeBadge(cf.transactionType);
                        const isExpense = cf.amount < 0;
                        return (
                          <tr key={cf.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '7px 10px' }}>
                              {cf.importCode ? (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/inventory-management?tab=Import&search=${encodeURIComponent(cf.importCode)}`);
                                  }}
                                  style={{
                                    color: '#2563eb',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}
                                  title="Nhấp để xem chi tiết phiếu nhập hàng"
                                >
                                  {cf.importCode}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>---</span>
                              )}
                            </td>
                            <td style={{ padding: '7px 10px', color: '#64748b' }}>
                              {dayjs(cf.transactionDate).format('DD/MM/YYYY HH:mm')}
                            </td>
                            <td style={{ padding: '7px 10px' }}>
                              <span style={{ padding: '2px 6px', borderRadius: 4, background: typeBadge.bg, color: typeBadge.color, border: `1px solid ${typeBadge.border}`, fontSize: 10, fontWeight: 600 }}>
                                {cf.transactionType}
                              </span>
                            </td>
                            <td style={{ padding: '7px 10px' }}>
                              {cf.code ? (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/cashflow?search=${encodeURIComponent(cf.code)}`);
                                  }}
                                  style={{
                                    color: '#0284c7',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}
                                  title="Nhấp để xem phiếu trong sổ giao dịch / sổ quỹ"
                                >
                                  {cf.code}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>---</span>
                              )}
                            </td>
                            <td style={{ padding: '7px 10px', color: '#475569' }}>{formatPaymentMethod(cf.paymentMethod)}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: isExpense ? '#16a34a' : '#dc2626' }}>
                              {cf.amount > 0 ? `+${cf.amount.toLocaleString('vi-VN')}` : cf.amount.toLocaleString('vi-VN')} VNĐ
                            </td>
                            <td style={{ padding: '7px 10px', color: '#475569' }}>{cf.note || '---'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PHIẾU NHẬP HÀNG */}
          {activeSubTab === 'importDocs' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileTextOutlined style={{ color: '#2563eb' }} /> Danh sách phiếu nhập hàng ({docs.length})
                </div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>
                  * Nhấp vào một phiếu nhập để xem lịch sử giao dịch tương ứng
                </span>
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: 9.5 }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Mã phiếu nhập</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Ngày nhập</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Tổng tiền</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Đã thanh toán</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Còn nợ</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center' }}>Trạng thái thanh toán</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                          Chưa có phiếu nhập hàng nào từ đối tác này
                        </td>
                      </tr>
                    ) : (
                      docs.map((d) => {
                        const isDocExpanded = expandedDocId === d.id;
                        const isReturned = d.paymentStatus === 'Returned' || (d.returnedAmount > 0 && d.debtAmount === 0 && d.amountPaid === 0);
                        const hasPaid = d.debtAmount === 0;

                        return (
                          <React.Fragment key={d.id}>
                            <tr
                              onClick={() => toggleDocExpand(d.id)}
                              style={{
                                borderBottom: isDocExpanded ? 'none' : '1px solid #f1f5f9',
                                background: isDocExpanded ? '#fff7ed' : 'transparent',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isDocExpanded) e.currentTarget.style.backgroundColor = '#fafafa';
                              }}
                              onMouseLeave={(e) => {
                                if (!isDocExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <td style={{ padding: '7px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {isDocExpanded ? (
                                    <DownOutlined style={{ fontSize: 10, color: '#e8442a' }} />
                                  ) : (
                                    <RightOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
                                  )}
                                  <span style={{ fontWeight: 700, color: '#2563eb' }}>
                                    {d.code}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '7px 10px', color: '#64748b' }}>
                                {dayjs(d.importDate).format('DD/MM/YYYY HH:mm')}
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>
                                <div>{d.totalAmount.toLocaleString('vi-VN')} VNĐ</div>
                                {d.returnedAmount > 0 && (
                                  <div style={{ fontSize: 9.5, color: '#ea580c', fontWeight: 600 }}>
                                    (Đã trả: -{d.returnedAmount.toLocaleString('vi-VN')} VNĐ)
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                                {d.amountPaid.toLocaleString('vi-VN')} VNĐ
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', color: d.debtAmount > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                                {d.debtAmount.toLocaleString('vi-VN')} VNĐ
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'center' }}>
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
                                      boxShadow: '0 1px 2px rgba(220, 38, 38, 0.08)',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#fee2e2';
                                      e.currentTarget.style.borderColor = '#ef4444';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = '#fef2f2';
                                      e.currentTarget.style.borderColor = '#fca5a5';
                                    }}
                                    title="Chưa thanh toán - Nhấp để thanh toán cho nhà cung cấp"
                                  >
                                    <DollarOutlined style={{ fontSize: 11 }} /> Chưa thanh toán
                                  </button>
                                )}
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <span
                                  onClick={() => navigate(`/inventory-management?tab=Import&search=${encodeURIComponent(d.code)}`)}
                                  style={{
                                    fontSize: 11,
                                    color: '#2563eb',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    textDecoration: 'underline'
                                  }}
                                  title="Nhấp để xem chi tiết chứng từ nhập kho"
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
                                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
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
                                          <DollarOutlined /> Thanh toán cho NCC ({d.debtAmount.toLocaleString('vi-VN')} VNĐ)
                                        </button>
                                      )}
                                    </div>

                                    {(!d.transactions || d.transactions.length === 0) ? (
                                      <div style={{ textAlign: 'center', padding: '14px 0', color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>
                                        Chưa có phát sinh giao dịch thanh toán nào cho phiếu nhập này
                                      </div>
                                    ) : (
                                      <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 4 }}>
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
                                                      title="Nhấp để xem phiếu trong sổ giao dịch / sổ quỹ"
                                                    >
                                                      {tx.code}
                                                    </span>
                                                  ) : (
                                                    <span style={{ color: '#94a3b8' }}>---</span>
                                                  )}
                                                </td>
                                                <td style={{ padding: '6px 8px', color: '#475569' }}>{formatPaymentMethod(tx.paymentMethod)}</td>
                                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                                  {Math.abs(tx.amount).toLocaleString('vi-VN')} VNĐ
                                                </td>
                                                <td style={{ padding: '6px 8px', color: '#64748b' }}>{tx.note || '---'}</td>
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
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                      <div>Đối tác: <strong>{partner.name}</strong></div>
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
                    <input
                      type="text"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder="Nhập ghi chú cho phiếu chi..."
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

                  {/* THAO TÁC MODAL */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setPaymentModalOpen(false)}
                      style={{
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={payLoading || payAmount <= 0}
                      style={{
                        padding: '6px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        border: 'none',
                        background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                        color: '#ffffff',
                        cursor: payLoading || payAmount <= 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {payLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const PartnerTable = ({
  partners = [],
  searchText,
  setSearchText,
  partnerType = 'ALL',
  setPartnerType,
  setModalPartnerOpen,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPartnerId, setExpandedPartnerId] = useState(null);
  const pageSize = 20;

  const toggleExpand = (partnerId) => {
    setExpandedPartnerId((prev) => (prev === partnerId ? null : partnerId));
  };

  const totalPages = Math.ceil(partners.length / pageSize) || 1;
  const currentData = partners.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', background: '#ffffff', overflow: 'hidden', width: '100%' }}>
      {/* THANH CÔNG CỤ TÌM KIẾM VÀ LỌC */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Ô TÌM KIẾM */}
          {setSearchText && (
            <div style={{ position: 'relative', width: 280 }}>
              <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
              <input
                type="text"
                placeholder="Theo tên đối tác, số điện thoại..."
                value={searchText || ''}
                onChange={(e) => setSearchText(e.target.value)}
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
          )}

          {/* BỘ LỌC PHÂN LOẠI */}
          {setPartnerType && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 6 }}>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'NCC', label: 'Nhà cung cấp' },
                { key: 'KH', label: 'Khách hàng' },
                { key: 'VC', label: 'Vận chuyển' },
                { key: 'OTHER', label: 'Khác' }
              ].map((st) => {
                const active = partnerType === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setPartnerType(st.key)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#ea580c' : '#475569',
                      background: active ? '#ffffff' : 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setModalPartnerOpen(true)}
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
            <PlusOutlined style={{ fontSize: 12 }} /> Thêm đối tác
          </button>

          <button
            type="button"
            onClick={() => {
              if (onRefresh) onRefresh();
            }}
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
            <ReloadOutlined style={{ fontSize: 12 }} /> Làm mới
          </button>
        </div>
      </div>

      {/* VÙNG BẢNG DỮ LIỆU ĐỐI TÁC */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textWrap: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>TÊN ĐỐI TÁC</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>PHÂN LOẠI</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>SỐ ĐIỆN THOẠI</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>CÔNG NỢ HỆ THỐNG</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>THAO TÁC</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>CHI TIẾT</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Chưa có đối tác nào phù hợp</td>
              </tr>
            ) : (
              currentData.map((p) => {
                const isExpanded = expandedPartnerId === p.id;
                const badge = getPartnerBadge(p.type);

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      onClick={() => toggleExpand(p.id)}
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                        background: isExpanded ? '#fff7ed' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = '#fafafa';
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontSize: 10, fontWeight: 600 }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#334155' }}>{p.phone || '---'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: getDebtDisplayInfo(p.totalDebt ?? p.remainingDebt ?? 0).color }}>
                        {getDebtDisplayInfo(p.totalDebt ?? p.remainingDebt ?? 0).formattedAmount}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEdit && onEdit(p)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#2563eb',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            marginRight: 10
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(p.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`/partner-detail/${p.id}`, { state: { partner: p } })}
                          style={{
                            padding: '3px 10px',
                            fontSize: 11,
                            borderRadius: 4,
                            border: '1px solid #bfdbfe',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <EyeOutlined /> Chi tiết
                        </button>
                      </td>
                    </tr>

                    {/* VÙNG CHI TIẾT ĐỐI TÁC MỞ RỘNG (GỒM 3 TAB: THÔNG TIN, LỊCH SỬ GIAO DỊCH, PHIẾU NHẬP HÀNG) */}
                    {isExpanded && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={6} style={{ padding: '0 12px 14px 12px', borderBottom: '2px solid #cbd5e1' }}>
                          <div
                            style={{
                              background: '#ffffff',
                              borderRadius: 8,
                              border: '1px solid #cbd5e1',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                              overflow: 'hidden',
                              marginTop: 4,
                              fontSize: 11
                            }}
                          >
                            <PartnerDetailSection
                              partner={p}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onRefresh={onRefresh}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG */}
      <div
        style={{
          padding: '8px 4px',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: '#64748b',
          marginTop: 6
        }}
      >
        <div>
          Hiển thị từ {partners.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} đến{' '}
          {Math.min(currentPage * pageSize, partners.length)} trên tổng {partners.length}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: currentPage === 1 ? '#cbd5e1' : '#334155',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Trở lại
          </button>
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerTable;
