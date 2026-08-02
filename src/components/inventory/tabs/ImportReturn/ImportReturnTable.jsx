import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Modal } from 'antd';
import {
  EnvironmentOutlined,
  DeleteOutlined,
  PrinterOutlined,
  ExclamationCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';

const ImportReturnTable = ({
  documents = [],
  searchText,
  setSearchText,
  statusFilter = 'ALL',
  setStatusFilter,
  loading,
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

  const openDeleteConfirm = (doc) => {
    Modal.confirm({
      title: <span style={{ fontWeight: 700, fontSize: 14 }}>Xác nhận hủy phiếu trả hàng</span>,
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
          Bạn có chắc chắn muốn hủy / xóa phiếu trả hàng nhập <strong style={{ color: '#e8442a' }}>{doc.code}</strong> không?
          <br />
          Thao tác này sẽ cập nhật lại số lượng tồn kho và không thể hoàn tác.
        </div>
      ),
      okText: 'Xác nhận hủy',
      okType: 'danger',
      cancelText: 'Bỏ qua',
      centered: true,
      maskClosable: true,
      onOk() {
        handleDeleteDocument(doc.id, doc.type || 4);
      }
    });
  };

  const handlePrint = (code) => {
    alert(`Đang chuẩn bị in phiếu trả: ${code}`);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', background: '#ffffff', overflow: 'hidden' }}>
      {/* HEADER ACTION TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* SEARCH INPUT */}
          <div style={{ position: 'relative', width: 280 }}>
            <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
            <input
              type="text"
              placeholder="Theo mã phiếu trả nhập, người tạo..."
              value={searchText}
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

          {/* STATUS FILTER PILLS */}
          {setStatusFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 6 }}>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'Completed', label: 'Hoàn thành' },
                { key: 'Cancelled', label: 'Đã hủy' }
              ].map((st) => {
                const active = statusFilter === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setStatusFilter(st.key)}
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
      </div>
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textWrap: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ PHIẾU</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>LOẠI PHIẾU</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>CHI NHÁNH</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGÀY CHỨNG TỪ</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>GIÁ TRỊ HOÀN (VNĐ)</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>TRẠNG THÁI</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>NGƯỜI TẠO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Đang tải dữ liệu...</td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Không tìm thấy phiếu trả hàng nhập nào</td>
              </tr>
            ) : (
              currentData.map((doc) => {
                const isExpanded = expandedDocId === doc.id;
                const currentTab = activeTabMap[doc.id] || 'info';

                const supplierPartner = (doc.partners || []).find(p => p.partnerType === 1 || p.partnerType === 'Supplier') || doc.partners?.[0];
                const supplierName = supplierPartner?.partnerName || 'Nhà cung cấp';

                const detailsList = doc.details || [];
                const totalReturnAmt = Math.round(Number(doc.totalAmount || 0));

                const paidAmt = Math.round(
                  (doc.partners || []).reduce((acc, p) => acc + Number(p.amountPaid || 0), 0)
                );

                return (
                  <React.Fragment key={doc.id}>
                    {/* MASTER ROW */}
                    <tr
                      onClick={() => toggleExpand(doc.id)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isExpanded ? '#fff7ed' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#e8442a' }}>{doc.code}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', fontSize: 10, fontWeight: 600 }}>
                          Trả hàng nhập
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#334155' }}>{doc.branchName || 'Chi nhánh trung tâm'}</td>
                      <td style={{ padding: '8px 10px', color: '#334155' }}>{dayjs(doc.businessDate || doc.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#e8442a' }}>
                        {totalReturnAmt.toLocaleString('vi-VN')} ₫
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 600 }}>
                          Hoàn thành
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>{doc.creator || 'Hệ thống'}</td>
                    </tr>

                    {/* EXPANDED DETAIL CONTAINER */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0, background: '#fafafa', borderBottom: '2px solid #e2e8f0' }}>
                          <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px solid #cbd5e1', background: '#ffffff' }}>
                            {/* SUB TABS BAR */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 16px' }}>
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
                                          background: '#fff7ed',
                                          color: '#ea580c',
                                          border: '1px solid #ffedd5',
                                          fontSize: 10,
                                          fontWeight: 600
                                        }}
                                      >
                                        Trả hàng nhập
                                      </span>
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                                      Người tạo: <strong style={{ color: '#334155' }}>{doc.creator || '---'}</strong> &nbsp;|&nbsp; Thời gian: <strong style={{ color: '#334155' }}>{dayjs(doc.businessDate || doc.createdAt).format('DD/MM/YYYY HH:mm')}</strong>
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
                                        <th style={{ padding: '8px 10px', textAlign: 'center', width: 40 }}>STT</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ HÀNG HÓA</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>TÊN HÀNG</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>ĐVT</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>SỐ LƯỢNG TRẢ</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>ĐƠN GIÁ TRẢ</th>
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
                                          const amount = Math.round(item.amount != null ? Number(item.amount) : qty * price);

                                          return (
                                            <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#334155' }}>
                                                {item.productCode || item.code || `SP${item.bInventoryId || item.id}`}
                                              </td>
                                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                                                {item.productName || item.name || 'Sản phẩm'}
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>
                                                <span style={{ padding: '1px 6px', borderRadius: 4, background: '#f1f5f9', fontSize: 10, border: '1px solid #cbd5e1', fontWeight: 600 }}>
                                                  {item.unitName || 'Cái'}
                                                </span>
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#ea580c' }}>
                                                {qty.toLocaleString('vi-VN')}
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                                {Math.round(price).toLocaleString('vi-VN')} ₫
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                                {amount.toLocaleString('vi-VN')} ₫
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* SUMMARY FINANCIAL BOX */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                  <div style={{ width: 320, background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 6, padding: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                      <span style={{ color: '#64748b' }}>Tổng tiền hàng trả:</span>
                                      <strong style={{ color: '#0f172a' }}>{totalReturnAmt.toLocaleString('vi-VN')} ₫</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                                      <span style={{ color: '#64748b' }}>NCC đã trả tiền:</span>
                                      <strong style={{ color: '#16a34a' }}>{paidAmt.toLocaleString('vi-VN')} ₫</strong>
                                    </div>
                                  </div>
                                </div>

                                {/* BOTTOM ACTION BAR - SYMMETRICAL */}
                                <div
                                  style={{
                                    display: 'flex',
                                    justify: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid #e2e8f0',
                                    paddingTop: 12
                                  }}
                                >
                                  {/* LEFT SIDE: HỦY BỎ BUTTON */}
                                  <div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteConfirm(doc);
                                      }}
                                      style={{
                                        background: '#ffffff',
                                        color: '#dc2626',
                                        border: '1px solid #fca5a5',
                                        borderRadius: 4,
                                        padding: '6px 16px',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                      }}
                                    >
                                      <DeleteOutlined /> Hủy bỏ
                                    </button>
                                  </div>

                                  {/* RIGHT SIDE: IN BUTTON */}
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrint(doc.code);
                                      }}
                                      style={{
                                        background: '#ffffff',
                                        color: '#334155',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: 4,
                                        padding: '6px 16px',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                      }}
                                    >
                                      <PrinterOutlined /> In
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: LỊCH SỬ THANH TOÁN */}
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
                                        Phiếu trả hàng này chưa phát sinh giao dịch nhận tiền nào.
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
                                                {cfd.partnerName || supplierName}
                                              </td>
                                              <td style={{ padding: '8px 10px', color: '#334155' }}>
                                                {cfd.businessDate ? dayjs(cfd.businessDate).format('DD/MM/YYYY HH:mm') : dayjs(doc.businessDate || doc.createdAt).format('DD/MM/YYYY HH:mm')}
                                              </td>
                                              <td style={{ padding: '8px 10px', color: '#334155' }}>
                                                {cfd.paymentMethod || 'Tiền mặt'}
                                              </td>
                                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                                {Number(cfd.amount || 0).toLocaleString('vi-VN')} ₫
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

export default ImportReturnTable;
