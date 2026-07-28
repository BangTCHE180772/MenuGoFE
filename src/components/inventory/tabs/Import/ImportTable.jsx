import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
  EnvironmentOutlined,
  DeleteOutlined,
  PrinterOutlined,
  CopyOutlined,
  ExportOutlined,
  MailOutlined,
  RollbackOutlined,
  BarcodeOutlined,
  EditOutlined,
  InfoCircleOutlined,
  CreditCardOutlined
} from '@ant-design/icons';

const ImportTable = ({
  documents = [],
  searchText,
  setSearchText,
  loading,
  setModalImportOpen,
  handleDeleteDocument
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [activeTabMap, setActiveTabMap] = useState({}); // { [docId]: 'info' | 'payment' }

  const pageSize = 20;

  const totalPages = Math.ceil(documents.length / pageSize) || 1;
  const currentData = documents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleExpand = (docId) => {
    if (expandedDocId === docId) {
      setExpandedDocId(null);
    } else {
      setExpandedDocId(docId);
      if (!activeTabMap[docId]) {
        setActiveTabMap((prev) => ({ ...prev, [docId]: 'info' }));
      }
    }
  };

  const handleTabChange = (docId, tabKey) => {
    setActiveTabMap((prev) => ({ ...prev, [docId]: tabKey }));
  };

  const handleCopyCode = (code) => {
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code);
      alert(`Đã sao chép mã phiếu: ${code}`);
    }
  };

  const handlePrint = (code) => {
    alert(`Đang chuẩn bị in phiếu: ${code}`);
  };

  const handleExport = (code) => {
    alert(`Đang xuất dữ liệu phiếu: ${code}`);
  };

  const handleSendEmail = (code) => {
    alert(`Gửi email cho phiếu: ${code}`);
  };

  const handleReturn = (code) => {
    alert(`Tạo phiếu trả hàng cho: ${code}`);
  };

  const handleBarcodePrint = (code) => {
    alert(`In mã vạch cho sản phẩm thuộc phiếu: ${code}`);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', background: '#ffffff', overflow: 'hidden' }}>
      {/* HEADER ACTION TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <input
          type="text"
          placeholder="Theo mã phiếu..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: 240,
            height: 26,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: '#1e293b',
            borderRadius: 16,
            border: '1px solid #cbd5e1',
            outline: 'none'
          }}
        />

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setModalImportOpen(true)}
            style={{
              background: '#e8442a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              padding: '0 10px',
              height: 26,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Nhập kho
          </button>
          <button
            onClick={() => alert('Đã làm mới dữ liệu')}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              padding: '0 10px',
              height: 26,
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textWrap: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ PHIẾU</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>LOẠI PHIẾU</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>CHI NHÁNH</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGÀY CHỨNG TỪ</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>GIÁ TRỊ (VNĐ)</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>TRẠNG THÁI</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGƯỜI TẠO</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Đang tải dữ liệu...</td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Không tìm thấy phiếu nhập nào</td>
              </tr>
            ) : (
              currentData.map((doc) => {
                const isExpanded = expandedDocId === doc.id;
                const currentTab = activeTabMap[doc.id] || 'info';

                // Details calculations
                const detailsList = doc.details || [];
                const supplierPartner = (doc.partners || []).find((p) => p.partnerType === 1 || p.partnerType === 'Supplier') || doc.partners?.[0];
                const supplierName = supplierPartner?.partnerName || '---';

                // Nợ gốc (DocumentPartner.cost)
                const supplierRawCost = Number(supplierPartner?.cost ?? supplierPartner?.amountDue ?? 0);

                // Dòng CashFlowDetail loại Rounding
                const roundingCfd = (supplierPartner?.cashFlowDetails || []).find((cfd) => cfd.type === 5 || cfd.type === 'Rounding');
                const roundingValue = Number(roundingCfd?.amount || 0);

                // Số tiền phải trả NCC = Nợ gốc - cfd ROUNDING
                const supplierAmountDue = supplierRawCost - roundingValue;

                // Tiền đã trả NCC
                const supplierAmountPaid = Number(supplierPartner?.amountPaid ?? 0);

                // Còn nợ NCC
                const supplierDebt = Math.max(0, supplierAmountDue - supplierAmountPaid);

                const totalQuantity = detailsList.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
                const totalItemsCount = detailsList.length;
                const totalGoodsAmount = detailsList.reduce((sum, d) => sum + (Number(d.quantity || 0) * Number(d.unitPrice || 0)), 0);

                return (
                  <React.Fragment key={doc.id}>
                    {/* MAIN ROW */}
                    <tr
                      onClick={() => toggleExpand(doc.id)}
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                        background: isExpanded ? '#fff7ed' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#e8442a' }}>{doc.code}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: '#fff1ec', color: '#e8442a', border: '1px solid #fed7aa', fontSize: 10, fontWeight: 600 }}>
                          Nhập kho
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#334155' }}>{doc.branchName || 'Chi nhánh trung tâm'}</td>
                      <td style={{ padding: '8px 10px', color: '#334155' }}>{dayjs(doc.businessDate).format('DD/MM/YYYY HH:mm')}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {doc.totalAmount ? Number(doc.totalAmount).toLocaleString('vi-VN') : 0} đ
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 600 }}>
                          Hoàn thành
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>{doc.creator || 'Hệ thống'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Bạn có chắc chắn muốn xóa chứng từ này?')) {
                              handleDeleteDocument(doc.id);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            color: '#dc2626',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 11
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED DETAIL BOX ROW */}
                    {isExpanded && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={8} style={{ padding: '0 12px 14px 12px', borderBottom: '2px solid #cbd5e1' }}>
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
                            {/* TOP TAB NAVIGATION */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 12px' }}>
                              <button
                                onClick={() => handleTabChange(doc.id, 'info')}
                                style={{
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'transparent',
                                  fontWeight: currentTab === 'info' ? 700 : 500,
                                  color: currentTab === 'info' ? '#e8442a' : '#64748b',
                                  borderBottom: currentTab === 'info' ? '2px solid #e8442a' : '2px solid transparent',
                                  cursor: 'pointer',
                                  fontSize: 12
                                }}
                              >
                                Thông tin
                              </button>
                              <button
                                onClick={() => handleTabChange(doc.id, 'service')}
                                style={{
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'transparent',
                                  fontWeight: currentTab === 'service' ? 700 : 500,
                                  color: currentTab === 'service' ? '#e8442a' : '#64748b',
                                  borderBottom: currentTab === 'service' ? '2px solid #e8442a' : '2px solid transparent',
                                  cursor: 'pointer',
                                  fontSize: 12
                                }}
                              >
                                Dịch vụ khác ({(doc.partners || []).filter(p => p.partnerType === 3 || p.partnerType === 4 || p.partnerType === 'Transporter' || p.partnerType === 'Other').length})
                              </button>
                              <button
                                onClick={() => handleTabChange(doc.id, 'payment')}
                                style={{
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'transparent',
                                  fontWeight: currentTab === 'payment' ? 700 : 500,
                                  color: currentTab === 'payment' ? '#e8442a' : '#64748b',
                                  borderBottom: currentTab === 'payment' ? '2px solid #e8442a' : '2px solid transparent',
                                  cursor: 'pointer',
                                  fontSize: 12
                                }}
                              >
                                Lịch sử thanh toán
                              </button>
                            </div>

                            {/* TAB 1: THÔNG TIN */}
                            {currentTab === 'info' && (
                              <div style={{ padding: 16 }}>
                                {/* HEADER INFO LINE */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{doc.code}</span>
                                      <span
                                        style={{
                                          padding: '2px 8px',
                                          borderRadius: 4,
                                          background: '#f1f5f9',
                                          color: '#334155',
                                          border: '1px solid #cbd5e1',
                                          fontSize: 10,
                                          fontWeight: 600
                                        }}
                                      >
                                        Đã nhập hàng
                                      </span>
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                                      Người tạo: <strong style={{ color: '#334155' }}>{doc.creator || '---'}</strong> &nbsp;|&nbsp; Người nhập: <strong style={{ color: '#334155' }}>{doc.creator || '---'}</strong> &nbsp;|&nbsp; Thời gian: <strong style={{ color: '#334155' }}>{dayjs(doc.businessDate || doc.createdAt).format('DD/MM/YYYY HH:mm')}</strong>
                                    </div>
                                  </div>

                                  <div style={{ color: '#475569', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <EnvironmentOutlined style={{ color: '#e8442a' }} />
                                    <span>{doc.branchName || 'Chi nhánh trung tâm'}</span>
                                  </div>
                                </div>

                                {/* SUPPLIER CARD BOX */}
                                <div
                                  style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 6,
                                    padding: '10px 14px',
                                    background: '#fafafa',
                                    margin: '12px 0 16px 0'
                                  }}
                                >
                                  <div style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>Nhà cung cấp</div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{supplierName}</div>
                                </div>

                                {/* ITEMS DETAILS TABLE */}
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                    <thead>
                                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ HÀNG HÓA</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>TÊN HÀNG</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>SỐ LƯỢNG</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>ĐƠN GIÁ</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>GIẢM GIÁ</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>GIÁ NHẬP</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>THÀNH TIỀN</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detailsList.length === 0 ? (
                                        <tr>
                                          <td colSpan={7} style={{ textAlign: 'center', padding: 16, color: '#94a3b8' }}>
                                            Không có chi tiết hàng hóa nào
                                          </td>
                                        </tr>
                                      ) : (
                                        detailsList.map((item, idx) => {
                                          const qty = Number(item.quantity || 0);
                                          const price = Number(item.unitPrice || 0);
                                          const discount = Number(item.discount || 0);
                                          const importPrice = price - discount;
                                          const amount = item.amount != null ? Number(item.amount) : qty * importPrice;

                                          return (
                                            <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#334155' }}>
                                                {item.productCode || item.code || `SP${item.bInventoryId || item.id}`}
                                              </td>
                                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                                                {item.productName || item.name || 'Sản phẩm'}
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                {qty.toLocaleString('vi-VN')}
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                                {price.toLocaleString('vi-VN')}
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                                {discount.toLocaleString('vi-VN')}
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                                {importPrice.toLocaleString('vi-VN')}
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                                {amount.toLocaleString('vi-VN')}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* BOTTOM SUMMARY AND NOTES */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 16 }}>
                                  {/* LEFT: NOTE */}
                                  <div style={{ flex: 1, minWidth: 240, color: '#475569', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <EditOutlined style={{ color: '#64748b' }} />
                                    <span>{doc.note || 'Đây là ghi chú nếu có'}</span>
                                  </div>

                                  {/* RIGHT: TOTALS GRID */}
                                  <div style={{ minWidth: 260, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                      <span>Tổng số lượng</span>
                                      <strong style={{ color: '#0f172a' }}>{totalQuantity.toLocaleString('vi-VN')}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                      <span>Tổng số mặt hàng</span>
                                      <strong style={{ color: '#0f172a' }}>{totalItemsCount}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                      <span>Tổng tiền hàng</span>
                                      <strong style={{ color: '#0f172a' }}>{totalGoodsAmount.toLocaleString('vi-VN')}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                      <span>
                                        Giảm giá phiếu nhập <InfoCircleOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
                                      </span>
                                      <strong style={{ color: '#0f172a' }}>0</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                      <span>Cần trả NCC</span>
                                      <strong style={{ color: '#0f172a' }}>{supplierAmountDue.toLocaleString('vi-VN')}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                      <span>
                                        Tiền đã trả NCC <CreditCardOutlined style={{ fontSize: 10, color: '#64748b' }} />
                                      </span>
                                      <strong style={{ color: '#16a34a', fontWeight: 800 }}>{supplierAmountPaid.toLocaleString('vi-VN')}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                      <span>Còn nợ NCC</span>
                                      <strong style={{ color: supplierDebt > 0 ? '#ef4444' : '#0f172a', fontWeight: 700 }}>{supplierDebt.toLocaleString('vi-VN')}</strong>
                                    </div>
                                  </div>
                                </div>

                                {/* BOTTOM ACTION BAR */}
                                <div
                                  style={{
                                    display: 'flex',
                                    justify: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid #e2e8f0',
                                    paddingTop: 12,
                                    flexWrap: 'wrap',
                                    gap: 8
                                  }}
                                >
                                  {/* LEFT ACTION BUTTONS */}
                                  <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Bạn có chắc muốn hủy/xóa phiếu ${doc.code}?`)) {
                                          handleDeleteDocument(doc.id);
                                        }
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <DeleteOutlined /> Hủy bỏ
                                    </button>
                                    <button
                                      onClick={() => handleCopyCode(doc.code)}
                                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <CopyOutlined /> Sao chép
                                    </button>
                                    <button
                                      onClick={() => handleExport(doc.code)}
                                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <ExportOutlined /> Xuất file
                                    </button>
                                    <button
                                      onClick={() => handleSendEmail(doc.code)}
                                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <MailOutlined /> Gửi Email
                                    </button>
                                  </div>

                                  {/* RIGHT ACTION BUTTONS */}
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                      onClick={() => handleReturn(doc.code)}
                                      style={{
                                        background: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: 4,
                                        padding: '4px 10px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#334155',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}
                                    >
                                      <RollbackOutlined /> Trả hàng
                                    </button>
                                    <button
                                      onClick={() => handlePrint(doc.code)}
                                      style={{
                                        background: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: 4,
                                        padding: '4px 10px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#334155',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}
                                    >
                                      <PrinterOutlined /> In
                                    </button>
                                    <button
                                      onClick={() => handleBarcodePrint(doc.code)}
                                      style={{
                                        background: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: 4,
                                        padding: '4px 10px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#334155',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}
                                    >
                                      <BarcodeOutlined /> In mã vạch
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: DỊCH VỤ KHÁC */}
                            {currentTab === 'service' && (
                              <div style={{ padding: 16 }}>
                                {(() => {
                                  const extraPartnersList = (doc.partners || []).filter(
                                    (p) =>
                                      p.partnerType === 3 ||
                                      p.partnerType === 4 ||
                                      p.partnerType === 'Transporter' ||
                                      p.partnerType === 'Other'
                                  );

                                  if (extraPartnersList.length === 0) {
                                    return (
                                      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                                        Phiếu nhập kho này không sử dụng dịch vụ hoặc đối tác khác.
                                      </div>
                                    );
                                  }

                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                          <thead>
                                            <tr
                                              style={{
                                                background: '#f8fafc',
                                                borderBottom: '1px solid #e2e8f0',
                                                color: '#475569',
                                                fontWeight: 700,
                                                fontSize: 10,
                                                textTransform: 'uppercase'
                                              }}
                                            >
                                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ / TÊN ĐỐI TÁC</th>
                                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>LOẠI ĐỐI TÁC</th>
                                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>GHI CHÚ</th>
                                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>TIỀN PHẢI TRẢ</th>
                                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>TIỀN ĐÃ TRẢ</th>
                                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>CÒN NỢ</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {extraPartnersList.map((p, pIdx) => {
                                              const due = Number(p.amountDue ?? p.cost ?? 0);
                                              const paid = Number(p.amountPaid ?? 0);
                                              const debt = Math.max(0, due - paid);
                                              const typeLabel =
                                                p.partnerType === 3 || p.partnerType === 'Transporter'
                                                  ? 'Vận chuyển'
                                                  : 'Khác';

                                              return (
                                                <React.Fragment key={p.id || pIdx}>
                                                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                                                      {p.partnerName || `Đối tác #${p.partnerId}`}
                                                    </td>
                                                    <td style={{ padding: '8px 10px' }}>
                                                      <span
                                                        style={{
                                                          padding: '2px 6px',
                                                          borderRadius: 4,
                                                          background: typeLabel === 'Vận chuyển' ? '#eff6ff' : '#fdf4ff',
                                                          color: typeLabel === 'Vận chuyển' ? '#2563eb' : '#c026d3',
                                                          fontSize: 10,
                                                          fontWeight: 600
                                                        }}
                                                      >
                                                        {typeLabel}
                                                      </span>
                                                    </td>
                                                    <td style={{ padding: '8px 10px', color: '#475569' }}>
                                                      {p.note || '---'}
                                                    </td>
                                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                                      {due.toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                                                      {paid.toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: debt > 0 ? '#ef4444' : '#64748b' }}>
                                                      {debt.toLocaleString('vi-VN')} đ
                                                    </td>
                                                  </tr>

                                                  {/* Render cashflow transactions for this extra partner */}
                                                  {p.cashFlowDetails && p.cashFlowDetails.length > 0 && (
                                                    <tr>
                                                      <td colSpan={6} style={{ background: '#f8fafc', padding: '8px 14px' }}>
                                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                                                          CHI TIẾT THU CHI CHO DỊCH VỤ NÀY:
                                                        </div>
                                                        <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                                                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                                                            <thead>
                                                              <tr style={{ background: '#e2e8f0', color: '#334155' }}>
                                                                <th style={{ padding: '4px 8px', textAlign: 'left' }}>MÃ PHIẾU CHI</th>
                                                                <th style={{ padding: '4px 8px', textAlign: 'left' }}>THỜI GIAN</th>
                                                                <th style={{ padding: '4px 8px', textAlign: 'left' }}>PHƯƠNG THỨC</th>
                                                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>SỐ TIỀN</th>
                                                                <th style={{ padding: '4px 8px', textAlign: 'left' }}>GHI CHÚ</th>
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              {p.cashFlowDetails.map((cfd, cfdIdx) => (
                                                                <tr key={cfd.id || cfdIdx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                                  <td style={{ padding: '4px 8px', fontWeight: 600, color: '#e8442a' }}>
                                                                    {cfd.cashFlowCode || `TT-${cfd.cashFlowId}`}
                                                                  </td>
                                                                  <td style={{ padding: '4px 8px' }}>
                                                                    {cfd.businessDate ? dayjs(cfd.businessDate).format('DD/MM/YYYY HH:mm') : '---'}
                                                                  </td>
                                                                  <td style={{ padding: '4px 8px' }}>
                                                                    {cfd.paymentMethod || 'Tiền mặt'}
                                                                  </td>
                                                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                                                    {Number(cfd.amount || 0).toLocaleString('vi-VN')} đ
                                                                  </td>
                                                                  <td style={{ padding: '4px 8px', color: '#64748b' }}>
                                                                    {cfd.note || '---'}
                                                                  </td>
                                                                </tr>
                                                              ))}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  )}
                                                </React.Fragment>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* TAB 3: LỊCH SỬ THANH TOÁN */}
                            {currentTab === 'payment' && (
                              <div style={{ padding: 16 }}>
                                {(() => {
                                  const allCashFlows = (doc.partners || []).flatMap((p) =>
                                    (p.cashFlowDetails || [])
                                      .filter((cfd) => cfd.type !== 5 && cfd.type !== 'Rounding')
                                      .map((cfd) => ({
                                        ...cfd,
                                        partnerName: p.partnerName
                                      }))
                                  );

                                  if (allCashFlows.length === 0) {
                                    return (
                                      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                                        Phiếu nhập kho này chưa phát sinh giao dịch thanh toán nào.
                                      </div>
                                    );
                                  }

                                  return (
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                        <thead>
                                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ CHỨNG TỪ</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>ĐỐI TÁC</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>THỜI GIAN</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>PHƯƠNG THỨC</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>SỐ TIỀN</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>GHI CHÚ</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {allCashFlows.map((cfd, cfdIdx) => (
                                            <tr key={cfd.id || cfdIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#e8442a' }}>
                                                {cfd.cashFlowCode || `TT-${cfd.cashFlowId || doc.id}`}
                                              </td>
                                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                                                {cfd.partnerName || '---'}
                                              </td>
                                              <td style={{ padding: '8px 10px', color: '#334155' }}>
                                                {cfd.businessDate ? dayjs(cfd.businessDate).format('DD/MM/YYYY HH:mm') : dayjs(doc.businessDate || doc.createdAt).format('DD/MM/YYYY HH:mm')}
                                              </td>
                                              <td style={{ padding: '8px 10px', color: '#334155' }}>
                                                {cfd.paymentMethod || 'Tiền mặt'}
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                                {Number(cfd.amount || 0).toLocaleString('vi-VN')} đ
                                              </td>
                                              <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                                {cfd.note || '---'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                })()}
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

      {/* CUSTOM PAGINATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#64748b' }}>
        <div>Tổng số: <strong>{documents.length}</strong> phiếu</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            style={{ padding: '2px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Trở lại
          </button>
          <span>Trang {currentPage} / {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            style={{ padding: '2px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportTable;

