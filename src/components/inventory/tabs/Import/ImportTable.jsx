import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
  EnvironmentOutlined,
  DeleteOutlined,
  PrinterOutlined,
  RollbackOutlined,
  EditOutlined,
  InfoCircleOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { deleteImportPendingDocument, getImportById } from '../../../../api/documentApi';

const ImportTable = ({
  documents = [],
  allDocuments = [],
  searchText,
  setSearchText,
  loading,
  onRefresh,
  setModalImportOpen,
  onOpenCreateModal,
  handleDeleteDocument,
  onOpenReturnModal,
  onEditDocument
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [activeTabMap, setActiveTabMap] = useState({}); // { [docId]: 'info' | 'payment' }
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const [loadedDocMap, setLoadedDocMap] = useState({}); // Cache full document details
  const [loadingDocId, setLoadingDocId] = useState(null);

  const pageSize = 20;
  const totalPages = Math.ceil(documents.length / pageSize) || 1;
  const currentData = documents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Fetch full detail when row is expanded
  const toggleExpand = async (docId) => {
    if (expandedDocId === docId) {
      setExpandedDocId(null);
    } else {
      setExpandedDocId(docId);
      if (!activeTabMap[docId]) {
        setActiveTabMap((prev) => ({ ...prev, [docId]: 'info' }));
      }

      // Fetch full document details if not cached yet
      if (!loadedDocMap[docId]) {
        setLoadingDocId(docId);
        try {
          const fullDoc = await getImportById(docId);
          if (fullDoc) {
            setLoadedDocMap((prev) => ({ ...prev, [docId]: fullDoc }));
          }
        } catch (err) {
          console.error('Failed to load document details:', err);
        } finally {
          setLoadingDocId(null);
        }
      }
    }
  };

  const handleTabChange = (docId, tabKey) => {
    setActiveTabMap((prev) => ({ ...prev, [docId]: tabKey }));
  };

  // Handle Edit Pending Document (Synchronous trigger to immediately open modal in edit mode)
  const handleEditPending = (doc) => {
    const fullDoc = loadedDocMap[doc.id] || doc;
    if (onEditDocument) {
      onEditDocument(fullDoc);
    }
  };

  const executeDelete = async (doc) => {
    if (!doc) return;
    const isPending = doc.status === 0 || doc.status === 'Pending';
    try {
      if (isPending) {
        await deleteImportPendingDocument(doc.id);
      }
      if (handleDeleteDocument) {
        handleDeleteDocument(doc.id, doc.type || 1);
      }
      setLoadedDocMap((prev) => {
        const copy = { ...prev };
        delete copy[doc.id];
        return copy;
      });
    } catch (err) {
      console.error('Lỗi khi xóa chứng từ:', err);
      if (handleDeleteDocument) {
        handleDeleteDocument(doc.id, doc.type || 1);
      }
    } finally {
      setConfirmDeleteDoc(null);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', background: '#ffffff', overflow: 'hidden', width: '100%' }}>
      {/* TOP ACTION TOOLBAR */}
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
            type="button"
            onClick={() => {
              if (onOpenCreateModal) {
                onOpenCreateModal();
              } else if (onEditDocument) {
                onEditDocument(null);
              }
            }}
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
            type="button"
            onClick={() => {
              if (onRefresh) onRefresh();
            }}
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
                const isPending = doc.status === 0 || doc.status === 'Pending';
                const isCompleted = doc.status === 1 || doc.status === 'Completed';

                const loadedDoc = loadedDocMap[doc.id] || doc;
                const detailsList = loadedDoc.details || loadedDoc.documentDetails || [];
                const cashFlowsList = loadedDoc.cashFlows || [];

                const supplierPartner = (loadedDoc.partners || []).find((p) => p.partnerType === 1 || p.partnerType === 'Supplier') || loadedDoc.partner || loadedDoc.partners?.[0];
                const supplierName = loadedDoc.partnerName || supplierPartner?.partnerName || loadedDoc.partner?.name || '---';

                const supplierAmountDue = Math.round(Number(loadedDoc.amountDue ?? supplierPartner?.amountDue ?? (loadedDoc.totalAmount || 0)));
                const supplierAmountPaid = Math.round(Number(loadedDoc.amountPaid ?? supplierPartner?.amountPaid ?? cashFlowsList.reduce((sum, cf) => sum + Number(cf.totalAmount || 0), 0)));

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
                      <td style={{ padding: '8px 10px', color: '#334155' }}>{dayjs(doc.orderDate || doc.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {doc.totalAmount ? Math.round(Number(doc.totalAmount)).toLocaleString('vi-VN') : 0} đ
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {doc.status === 2 || doc.status === 'Cancelled' ? (
                          <span style={{ padding: '2px 6px', borderRadius: 4, background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', fontSize: 10, fontWeight: 600 }}>
                            Đã hủy
                          </span>
                        ) : isPending ? (
                          <span style={{ padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', fontSize: 10, fontWeight: 600 }}>
                            Lưu tạm
                          </span>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: 4, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 600 }}>
                            Hoàn thành
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>{doc.creator || doc.createdByName || 'Hệ thống'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleEditPending(doc)}
                              style={{
                                padding: '3px 8px',
                                fontSize: 10.5,
                                fontWeight: 600,
                                borderRadius: 4,
                                border: '1px solid #bfdbfe',
                                background: '#eff6ff',
                                color: '#2563eb',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <EditOutlined /> Chỉnh sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDoc(doc)}
                              style={{
                                padding: '3px 8px',
                                fontSize: 10.5,
                                fontWeight: 600,
                                borderRadius: 4,
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <DeleteOutlined /> Xóa
                            </button>
                          </div>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            onClick={() => onOpenReturnModal && onOpenReturnModal(loadedDoc)}
                            style={{
                              padding: '3px 8px',
                              fontSize: 10.5,
                              fontWeight: 600,
                              borderRadius: 4,
                              border: '1px solid #fed7aa',
                              background: '#fff7ed',
                              color: '#ea580c',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                          >
                            <RollbackOutlined /> Trả hàng
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>---</span>
                        )}
                      </td>
                    </tr>

                    {/* EXPANDED DETAIL DRAWER CONTAINER */}
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
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 12px', alignItems: 'center' }}>
                              <button
                                type="button"
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
                                <InfoCircleOutlined /> Thông tin phiếu
                              </button>
                              <button
                                type="button"
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
                                <CreditCardOutlined /> Lịch sử thanh toán
                              </button>

                              {/* EXTRA TRẢ HÀNG BUTTON ON COMPLETED EXPANDED TAB */}
                              {isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => onOpenReturnModal && onOpenReturnModal(loadedDoc)}
                                  style={{
                                    marginLeft: 'auto',
                                    padding: '4px 12px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    borderRadius: 4,
                                    border: '1px solid #fed7aa',
                                    background: '#fff7ed',
                                    color: '#ea580c',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  <RollbackOutlined /> Trả hàng
                                </button>
                              )}
                            </div>

                            {loadingDocId === doc.id ? (
                              <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                                Đang nạp chi tiết phiếu nhập...
                              </div>
                            ) : (
                              <>
                                {/* TAB 1: THÔNG TIN PHIẾU */}
                                {currentTab === 'info' && (
                                  <div style={{ padding: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{loadedDoc.code}</span>
                                          <span style={{ padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontSize: 10, fontWeight: 600 }}>
                                            {isCompleted ? 'Đã nhập hàng' : (isPending ? 'Phiếu nhập nháp' : 'Đã hủy')}
                                          </span>
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                                          Người tạo: <strong style={{ color: '#334155' }}>{loadedDoc.creator || loadedDoc.createdByName || 'Hệ thống'}</strong> &nbsp;|&nbsp; Thời gian: <strong style={{ color: '#334155' }}>{dayjs(loadedDoc.orderDate || loadedDoc.createdAt).format('DD/MM/YYYY HH:mm')}</strong>
                                        </div>
                                      </div>

                                      <div style={{ color: '#475569', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <EnvironmentOutlined style={{ color: '#e8442a' }} />
                                        <span>{loadedDoc.branchName || 'Chi nhánh trung tâm'}</span>
                                      </div>
                                    </div>

                                    {/* SUPPLIER INFO BOX */}
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', background: '#fafafa', margin: '12px 0 16px 0' }}>
                                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                                        Nhà cung cấp: <span style={{ color: '#2563eb' }}>{supplierName}</span>
                                      </div>
                                      <div style={{ display: 'flex', gap: 20, fontSize: 11, color: '#475569' }}>
                                        <div>Cần trả NCC: <strong>{supplierAmountDue.toLocaleString('vi-VN')} đ</strong></div>
                                        <div>Đã trả NCC: <strong style={{ color: '#059669' }}>{supplierAmountPaid.toLocaleString('vi-VN')} đ</strong></div>
                                        <div>Còn nợ: <strong style={{ color: '#ef4444' }}>{Math.max(0, supplierAmountDue - supplierAmountPaid).toLocaleString('vi-VN')} đ</strong></div>
                                      </div>
                                    </div>

                                    {/* ITEMS TABLE */}
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                        <thead>
                                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, textAlign: 'left' }}>
                                            <th style={{ padding: '8px 10px' }}>Mã sản phẩm</th>
                                            <th style={{ padding: '8px 10px' }}>Tên sản phẩm</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>Đơn vị tính</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Số lượng</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Đơn giá nhập</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thành tiền</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {detailsList.length === 0 ? (
                                            <tr>
                                              <td colSpan={6} style={{ textAlign: 'center', padding: 16, color: '#94a3b8' }}>
                                                Chưa có sản phẩm trong phiếu nhập
                                              </td>
                                            </tr>
                                          ) : (
                                            detailsList.map((dt, idx) => {
                                              const pCode = dt.productCode || dt.snapshotProductCode || dt.currentProductCode || dt.code || `SP${idx + 1}`;
                                              const pName = dt.productName || dt.snapshotProductName || dt.currentProductName || dt.name || 'Sản phẩm';
                                              const uName = dt.unitName || dt.snapshotUnitName || dt.currentUnitName || 'Đơn vị';
                                              const qty = Number(dt.quantity || 0);
                                              const price = Number(dt.unitPrice || 0);
                                              const total = qty * price;

                                              return (
                                                <tr key={dt.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#2563eb' }}>{pCode}</td>
                                                  <td style={{ padding: '8px 10px', color: '#1e293b', fontWeight: 600 }}>{pName}</td>
                                                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>{uName}</td>
                                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{qty.toLocaleString('vi-VN')}</td>
                                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>{price.toLocaleString('vi-VN')} đ</td>
                                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#e8442a' }}>{total.toLocaleString('vi-VN')} đ</td>
                                                </tr>
                                              );
                                            })
                                          )}
                                        </tbody>
                                      </table>
                                    </div>

                                    {loadedDoc.note && (
                                      <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
                                        Ghi chú: <span style={{ color: '#334155', fontStyle: 'italic' }}>{loadedDoc.note}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* TAB 2: LỊCH SỬ THANH TOÁN */}
                                {currentTab === 'payment' && (
                                  <div style={{ padding: 16 }}>
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                        <thead>
                                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, textAlign: 'left' }}>
                                            <th style={{ padding: '8px 10px' }}>Mã phiếu thu/chi</th>
                                            <th style={{ padding: '8px 10px' }}>Thời gian</th>
                                            <th style={{ padding: '8px 10px' }}>Phương thức</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Số tiền thanh toán</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>Trạng thái</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {cashFlowsList.length === 0 ? (
                                            <tr>
                                              <td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#94a3b8' }}>
                                                Chưa có lịch sử giao dịch thanh toán
                                              </td>
                                            </tr>
                                          ) : (
                                            cashFlowsList.map((cf, idx) => (
                                              <tr key={cf.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#2563eb' }}>{cf.code || `CF${idx + 1}`}</td>
                                                <td style={{ padding: '8px 10px', color: '#475569' }}>
                                                  {cf.businessDate ? dayjs(cf.businessDate).format('DD/MM/YYYY HH:mm') : (cf.createdAt ? dayjs(cf.createdAt).format('DD/MM/YYYY HH:mm') : '---')}
                                                </td>
                                                <td style={{ padding: '8px 10px', color: '#334155' }}>{cf.paymentMethod || 'Tiền mặt'}</td>
                                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                                  {Number(cf.totalAmount || 0).toLocaleString('vi-VN')} đ
                                                </td>
                                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                  <span style={{ padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#15803d', fontSize: 10, fontWeight: 600 }}>
                                                    {cf.status || 'Hoàn thành'}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </>
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

      {/* CONFIRM DELETE MODAL OVERLAY */}
      {confirmDeleteDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(2px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 8, padding: 20, width: '100%', maxWidth: 400, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              {confirmDeleteDoc.status === 0 || confirmDeleteDoc.status === 'Pending' ? 'Xác nhận xóa vĩnh viễn phiếu lưu tạm' : 'Xác nhận hủy phiếu nhập kho'}
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 16, lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa phiếu <strong style={{ color: '#e8442a' }}>{confirmDeleteDoc.code}</strong> không?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteDoc(null)}
                style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: 12, cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => executeDelete(confirmDeleteDoc)}
                style={{ padding: '6px 14px', borderRadius: 4, border: 'none', background: '#ef4444', color: '#ffffff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER PAGINATION */}
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
          Hiển thị từ {documents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} đến{' '}
          {Math.min(currentPage * pageSize, documents.length)} trên tổng {documents.length}
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

export default ImportTable;
