import React, { useState, useEffect, useMemo } from 'react';
import {
  CloseOutlined,
  FullscreenOutlined,
  PrinterOutlined,
  EditOutlined,
  AlertOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../../../context/AuthContext';
import { receiveTransferDocument, rejectTransferDocument } from '../../../../api/documentApi';
import { extractErrorMessage } from '../../utils/errorHelper';

const ReceiveTransferDocumentModal = ({
  open,
  onClose,
  onSuccess,
  documentData = null
}) => {
  const auth = useAuth ? useAuth() : {};
  const user = auth?.user;
  const creatorName = user?.name || user?.email || 'Mno';

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [receivingNote, setReceivingNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (open) {
      setReceivingNote('');
      setErrorMessage('');
      setSuccessMessage('');
      const rawDetails = documentData?.details || documentData?.documentDetails || [];
      if (Array.isArray(rawDetails) && rawDetails.length > 0) {
        setItems(
          rawDetails.map((detail) => ({
            id: detail.id,
            bInventoryId: detail.bInventoryId,
            code: detail.productCode || detail.snapshotProductCode || detail.currentProductCode || detail.bInventory?.product?.skuCode || `SP${detail.bInventory?.productId || detail.id}`,
            name: detail.productName || detail.snapshotProductName || detail.currentProductName || detail.bInventory?.product?.name || 'Sản phẩm',
            unitName: detail.unitName || detail.snapshotUnitName || detail.currentUnitName || detail.unitConversion?.unit?.name || '',
            stock: detail.currentStockQuantity ?? detail.bInventory?.quantity ?? 0,
            transferQty: detail.quantity || detail.baseQuantity || 1,
            receiveQty: detail.receivedQuantity ?? detail.quantity ?? detail.baseQuantity ?? 1,
            unitPrice: detail.unitPrice || 0,
            note: detail.note || '',
            editingNote: false
          }))
        );
      } else {
        setItems([]);
      }
    }
  }, [open, documentData]);

  const handleReceiveQtyChange = (index, val) => {
    const rawQty = val !== '' && val != null ? Math.max(0, Number(val) || 0) : 0;
    const targetItem = items[index];
    const maxQty = Number(targetItem?.transferQty) || 0;
    const qty = Math.min(rawQty, maxQty);
    const updated = [...items];
    updated[index] = { ...updated[index], receiveQty: qty };
    setItems(updated);
  };

  const totalTransferQty = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.transferQty) || 0), 0);
  }, [items]);

  const totalReceiveQty = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.receiveQty) || 0), 0);
  }, [items]);

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (items.length === 0) {
      setErrorMessage('Phiếu chuyển không có sản phẩm nào.');
      return;
    }
    if (!documentData?.id) {
      setErrorMessage('Không tìm thấy thông tin phiếu chuyển kho.');
      return;
    }
    if (!receivingNote || !receivingNote.trim()) {
      setErrorMessage('Bắt buộc phải nhập Ghi chú (Note) khi xác nhận nhận hàng.');
      return;
    }

    const hasPartial = items.some((i) => (Number(i.receiveQty) || 0) < (Number(i.transferQty) || 0));
    const targetStatus = hasPartial ? 'PartialReceived' : 'Received';

    setLoading(true);
    try {
      const dto = {
        transferDocumentId: documentData.id,
        status: targetStatus,
        note: receivingNote.trim(),
        details: items.map((i) => ({
          detailId: i.id,
          receivedQuantity: Number(i.receiveQty) || 0
        }))
      };
      await receiveTransferDocument(dto);
      setSuccessMessage('Xác nhận nhận hàng chuyển kho thành công!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      const errMsg = extractErrorMessage(err, 'Lỗi khi xử lý nhận hàng.');
      setErrorMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!documentData?.id) return;
    if (!receivingNote || !receivingNote.trim()) {
      setErrorMessage('Bắt buộc phải nhập Lý do / Ghi chú (Note) khi từ chối nhận hàng.');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn từ chối phiếu chuyển kho này? Hàng hóa sẽ được hoàn lại kho bên gửi.')) {
      return;
    }

    setLoading(true);
    try {
      await rejectTransferDocument({
        transferDocumentId: documentData.id,
        reason: receivingNote.trim()
      });
      setSuccessMessage('Đã từ chối nhận hàng. Hàng hóa đã hoàn quay trở lại kho gửi.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      const errMsg = extractErrorMessage(err, 'Lỗi khi từ chối nhận hàng.');
      setErrorMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const docCode = documentData?.code || 'TRF000003';
  const senderBranch = documentData?.branch?.name || 'Chi nhánh trung tâm';
  const transferDate = documentData?.businessDate
    ? dayjs(documentData.businessDate).format('DD/MM/YYYY HH:mm')
    : '29/07/2026 23:47';
  const docCreatorName = documentData?.creator?.name || documentData?.creator?.email || creatorName;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 12
      }}
    >
      {/* HEADER BAR - LIGHT BLUE BACKGROUND */}
      <div
        style={{
          height: 48,
          background: '#ffffff',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid #cbd5e1',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
            Chuyển hàng
          </span>
          <span
            style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: 12,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 600
            }}
          >
            Đang chuyển
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            title="Toàn màn hình"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            <FullscreenOutlined />
          </button>
          <button
            type="button"
            title="In phiếu"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            <PrinterOutlined />
          </button>
          <button
            type="button"
            title="Đóng"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 6,
              padding: '5px 8px',
              color: '#475569',
              cursor: 'pointer',
              fontSize: 15,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CloseOutlined />
          </button>
        </div>
      </div>

      {/* ERROR / SUCCESS NOTIFICATION BANNERS */}
      {errorMessage && (
        <div style={{ background: '#fef2f2', color: '#dc2626', borderBottom: '1px solid #fecdd3', padding: '8px 16px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertOutlined /> {errorMessage}
        </div>
      )}
      {successMessage && (
        <div style={{ background: '#ecfdf5', color: '#059669', borderBottom: '1px solid #a7f3d0', padding: '8px 16px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircleOutlined /> {successMessage}
        </div>
      )}

      {/* BODY CONTENT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT AREA: PRODUCTS TABLE */}
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 8px', width: 40, textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', width: 140 }}>MÃ HÀNG</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>TÊN HÀNG</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 100 }}>TỒN KHO</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>SL CHUYỂN</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: 120 }}>SL NHẬN</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 120 }}>GIÁ NHẬN</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 130 }}>THÀNH TIỀN</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                      Không có sản phẩm nào trong phiếu chuyển hàng này.
                    </td>
                  </tr>
                ) : (
                  items.map((record, index) => {
                    const total = (Number(record.receiveQty) || 0) * (Number(record.unitPrice) || 0);

                    return (
                      <tr key={record.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                        <td style={{ fontWeight: 600, color: '#334155', padding: '6px 10px' }}>{record.code}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{record.name}</span>
                            {record.unitName && (
                              <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                                ({record.unitName})
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <EditOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                            {record.editingNote ? (
                              <input
                                type="text"
                                value={record.note || ''}
                                autoFocus
                                onBlur={() => {
                                  const updated = [...items];
                                  updated[index] = { ...updated[index], editingNote: false };
                                  setItems(updated);
                                }}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[index] = { ...updated[index], note: e.target.value };
                                  setItems(updated);
                                }}
                                placeholder="Nhập ghi chú..."
                                style={{
                                  fontSize: 10,
                                  padding: '1px 4px',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 4,
                                  outline: 'none'
                                }}
                              />
                            ) : (
                              <span
                                onClick={() => {
                                  const updated = [...items];
                                  updated[index] = { ...updated[index], editingNote: true };
                                  setItems(updated);
                                }}
                                style={{
                                  fontSize: 10,
                                  color: record.note ? '#475569' : '#94a3b8',
                                  cursor: 'pointer',
                                  fontStyle: record.note ? 'normal' : 'italic'
                                }}
                              >
                                {record.note || 'Ghi chú'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 10px', color: '#64748b' }}>
                          {(record.stock != null ? record.stock : 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 10px', color: '#475569' }}>
                          {(record.transferQty != null ? record.transferQty : 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={record.receiveQty ?? 0}
                            onChange={(e) => handleReceiveQtyChange(index, e.target.value)}
                            style={{
                              width: 75,
                              textAlign: 'center',
                              borderRadius: 16,
                              border: '1px solid #cbd5e1',
                              padding: '3px 6px',
                              fontSize: 11,
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 10px', color: '#475569' }}>
                          {(record.unitPrice != null ? record.unitPrice : 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>
                          {total.toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: SUMMARY SIDEBAR */}
        <div
          style={{
            width: 340,
            background: '#ffffff',
            borderLeft: '1px solid #cbd5e1',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {/* CREATOR & STATUS HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                {docCreatorName} {dayjs().format('DD/MM/YYYY HH:mm')}
              </span>
              <span
                style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  borderRadius: 12,
                  padding: '1px 8px',
                  fontSize: 10,
                  fontWeight: 600
                }}
              >
                Đang chuyển
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#64748b' }}>Mã phiếu chuyển</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{docCode}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#64748b' }}>Chi nhánh gửi</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{senderBranch}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#64748b' }}>Ngày chuyển</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{transferDate}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#64748b' }}>Ghi chú</span>
              <span style={{ color: '#94a3b8' }}>---</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569' }}>Tổng số lượng chuyển</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{totalTransferQty}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#475569' }}>Tổng số lượng nhận</span>
              <span style={{ fontWeight: 700, color: '#0066ff', fontSize: 13 }}>{totalReceiveQty}</span>
            </div>

            <div>
              <textarea
                value={receivingNote}
                onChange={(e) => setReceivingNote(e.target.value)}
                rows={4}
                placeholder="Ghi chú nhận hàng"
                style={{
                  width: '100%',
                  borderRadius: 6,
                  padding: '8px 10px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: 11,
                  resize: 'none'
                }}
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              disabled={loading}
              onClick={handleReject}
              style={{
                flex: 1,
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#e11d48',
                fontWeight: 600,
                borderRadius: 6,
                padding: '8px 0',
                cursor: 'pointer'
              }}
            >
              Từ chối nhận
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              style={{
                flex: 1,
                background: '#0066ff',
                border: '1px solid #0066ff',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: 6,
                padding: '8px 0',
                cursor: 'pointer'
              }}
            >
              Nhận hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveTransferDocumentModal;
