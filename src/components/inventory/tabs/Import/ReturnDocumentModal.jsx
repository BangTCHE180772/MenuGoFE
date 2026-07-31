import React, { useState, useEffect, useMemo } from 'react';
import {
  DeleteOutlined,
  CloseOutlined,
  FullscreenOutlined,
  PrinterOutlined,
  UserOutlined,
  InfoCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { message } from 'antd';

import { createReturnDocument, getImportReturnDetails } from '../../../../api/documentApi';
import KiotDateTimePicker from './KiotDateTimePicker';
import { useAuth } from '../../../../context/AuthContext';

const ReturnDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  importDocument = null
}) => {
  const auth = useAuth ? useAuth() : {};
  const user = auth?.user;
  const creatorName = user?.name || user?.email || 'Hệ thống';

  const [loading, setLoading] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(dayjs());
  const [openTimeFormatted, setOpenTimeFormatted] = useState('');
  const [openTimeISO, setOpenTimeISO] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [supplierInfo, setSupplierInfo] = useState({ partnerName: 'Nhà cung cấp mặc định', partnerId: undefined });

  const [formData, setFormData] = useState({
    supplierId: undefined,
    docCode: '',
    discount: 0,
    paidAmount: 0,
    note: ''
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open) {
      const now = dayjs();
      setSelectedDateTime(now);
      setOpenTimeFormatted(now.format('DD/MM/YYYY HH:mm:ss'));
      setOpenTimeISO(now.toISOString());
      setShowDatePicker(false);

      if (importDocument) {
        const supplierPartner =
          (importDocument.partners || []).find(
            (p) => p.partnerType === 1 || p.partnerType === 'Supplier'
          ) || importDocument.partners?.[0];
        const suppId = supplierPartner?.partnerId || supplierPartner?.id;

        setSupplierInfo({
          partnerName: supplierPartner?.partnerName || 'Nhà cung cấp mặc định',
          partnerId: suppId ? Number(suppId) : undefined
        });

        setFormData({
          supplierId: suppId ? Number(suppId) : undefined,
          docCode: '',
          discount: 0,
          paidAmount: 0,
          note: `Trả hàng nhập theo phiếu ${importDocument.code}`
        });

        const loadReturnDetails = async () => {
          try {
            const apiRes = await getImportReturnDetails(importDocument.id);
            if (apiRes && apiRes.details && apiRes.details.length > 0) {
              const supplierPartner =
                (apiRes.partners || []).find(
                  (p) => p.partnerType === 1 || p.partnerType === 'Supplier'
                ) || apiRes.partners?.[0];

              if (supplierPartner?.partnerName) {
                setSupplierInfo({
                  partnerName: supplierPartner.partnerName,
                  partnerId: supplierPartner.partnerId ? Number(supplierPartner.partnerId) : suppId ? Number(suppId) : undefined
                });
              }

              const mappedItems = apiRes.details.map((it, idx) => {
                const maxQty = Number(it.maxReturnQuantity ?? it.quantity ?? 0);
                const importQty = Number(it.quantity ?? 0);
                const alreadyReturned = Number(it.alreadyReturnedQuantity ?? 0);
                const price = Math.round(Number(it.unitPrice ?? 0));

                return {
                  id: it.id || idx,
                  bInventoryId: it.bInventoryId,
                  unitConversionId: it.unitConversionId,
                  code: it.productCode || `SP${it.bInventoryId}`,
                  name: it.productName || 'Sản phẩm',
                  unitName: it.unitName || 'Cái',
                  importQuantity: importQty,
                  alreadyReturnedQuantity: alreadyReturned,
                  maxQuantity: maxQty,
                  quantity: maxQty > 0 ? maxQty : 0,
                  importPrice: price,
                  returnPrice: price
                };
              });
              setItems(mappedItems);
              return;
            }
          } catch (err) {
            console.warn('Lỗi lấy return details từ API:', err);
          }

          const initialItems = (importDocument.details || []).map((d, index) => {
            const qty = Number(d.quantity || 1);
            const price = Math.round(Number(d.unitPrice || 0));
            return {
              id: d.id || index,
              bInventoryId: d.bInventoryId,
              unitConversionId: d.unitConversionId,
              code: d.productCode || d.code || `SP${d.bInventoryId}`,
              name: d.productName || d.name || 'Sản phẩm',
              unitName: d.unitName || 'Cái',
              importQuantity: qty,
              alreadyReturnedQuantity: 0,
              maxQuantity: qty,
              quantity: qty,
              importPrice: price,
              returnPrice: price
            };
          });
          setItems(initialItems);
        };

        loadReturnDetails();
      } else {
        setSupplierInfo({ partnerName: 'Nhà cung cấp mặc định', partnerId: undefined });
        setFormData({
          supplierId: undefined,
          docCode: '',
          discount: 0,
          paidAmount: 0,
          note: ''
        });
        setItems([]);
      }
    }
  }, [open, importDocument]);

  const handleDateChange = (dateObj) => {
    setSelectedDateTime(dateObj);
    setOpenTimeFormatted(dateObj.format('DD/MM/YYYY HH:mm:ss'));
    setOpenTimeISO(dateObj.toISOString());
    setShowDatePicker(false);
  };

  const handleItemQuantityChange = (idx, val) => {
    const item = items[idx];
    const newQty = Math.max(1, Math.min(item.maxQuantity || 999999, Number(val) || 1));
    const updated = [...items];
    updated[idx] = { ...updated[idx], quantity: newQty };
    setItems(updated);
  };

  const handleItemReturnPriceChange = (idx, val) => {
    const newPrice = Math.max(0, Number(val) || 0);
    const updated = [...items];
    updated[idx] = { ...updated[idx], returnPrice: newPrice };
    setItems(updated);
  };

  const handleRemoveItem = (idx) => {
    const updated = [...items];
    updated.splice(idx, 1);
    setItems(updated);
  };

  const totalGoodsAmount = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.returnPrice) || 0), 0);
  }, [items]);

  const netAmount = Math.max(0, Math.round(totalGoodsAmount - (Number(formData.discount) || 0)));
  const paidAmount = Number(formData.paidAmount) || 0;
  const debtAmount = Math.max(0, netAmount - paidAmount);

  const handleSubmit = async (isDraft = false) => {
    if (!importDocument || !importDocument.id) {
      message.error('Không tìm thấy thông tin phiếu nhập kho gốc.');
      return;
    }

    const activeItems = items.filter((item) => Number(item.quantity) > 0);
    if (activeItems.length === 0) {
      message.error('Vui lòng chọn số lượng trả lớn hơn 0 cho ít nhất 1 sản phẩm.');
      return;
    }

    for (let i = 0; i < activeItems.length; i++) {
      const item = activeItems[i];
      if (item.quantity > item.maxQuantity) {
        message.error(`Số lượng trả ${item.name} không được vượt quá số lượng nhập còn được phép trả (${item.maxQuantity}).`);
        return;
      }
      if (Number(item.returnPrice) < 1) {
        message.error(`Đơn giá hoàn tiền của ${item.name} phải là số nguyên lớn hơn hoặc bằng 1.`);
        return;
      }
    }

    setLoading(true);
    try {
      const currentAccountId = user?.accountId || user?.id || 1;
      const dto = {
        importDocumentId: Number(importDocument.id),
        businessDate: openTimeISO || new Date().toISOString(),
        createdByAccountId: Number(currentAccountId),
        paidAmount: Math.round(Number(formData.paidAmount || 0)),
        paymentMethod: 1, // Cash
        note: formData.note || `Trả hàng nhập theo phiếu ${importDocument.code}`,
        details: activeItems.map((i) => ({
          importDocumentDetailId: Number(i.id || i.documentDetailId),
          quantity: Number(i.quantity),
          unitPrice: Math.round(Number(i.returnPrice || 0)),
          note: i.note || ''
        }))
      };

      await createReturnDocument(dto);
      message.success(`${isDraft ? 'Lưu tạm' : 'Hoàn thành'} phiếu trả hàng nhập thành công!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi khi tạo phiếu trả hàng nhập:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.message ||
        'Đã xảy ra lỗi khi tạo phiếu trả hàng nhập.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* HEADER BAR (FULL SCREEN MATCHING IMPORT MODAL BRAND ORANGE) */}
      <div
        style={{
          height: 48,
          background: 'linear-gradient(135deg, #e8442a 0%, #d9381e 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '0 16px',
          boxShadow: '0 2px 8px rgba(232, 68, 42, 0.25)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#ffffff', letterSpacing: '0.3px' }}>
            Trả hàng nhập {importDocument ? `(Phiếu nhập ${importDocument.code})` : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <button
            type="button"
            title="Toàn màn hình"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: 'none',
              borderRadius: 6,
              padding: '5px 8px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FullscreenOutlined />
          </button>
          <button
            type="button"
            title="In phiếu"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: 'none',
              borderRadius: 6,
              padding: '5px 8px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <PrinterOutlined />
          </button>
          <button
            type="button"
            title="Đóng"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              borderRadius: 6,
              padding: '5px 8px',
              color: '#ffffff',
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

      {/* BODY (LEFT TABLE + RIGHT SIDEBAR) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT SECTION (SELECTED PRODUCTS TABLE) */}
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* INFO BAR */}
          <div
            style={{
              marginBottom: 10,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              fontSize: 11
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 600 }}>
              <InfoCircleOutlined style={{ color: '#3b82f6', fontSize: 13 }} />
              <span>Danh sách sản phẩm hoàn trả từ phiếu nhập: </span>
              <strong style={{ color: '#e8442a' }}>{importDocument?.code || '---'}</strong>
            </div>
            <span style={{ color: '#64748b', fontSize: 10 }}>
              (Điều chỉnh số lượng trả và giá trả hàng nếu cần)
            </span>
          </div>

          {/* PRODUCT RETURN TABLE */}
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
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#334155', fontWeight: 700, fontSize: 10 }}>
                  <th style={{ width: 40, padding: '8px 6px', textAlign: 'center' }}>STT</th>
                  <th style={{ width: 100, padding: '8px 8px', textAlign: 'left' }}>MÃ HÀNG</th>
                  <th style={{ padding: '8px 8px', textAlign: 'left' }}>TÊN HÀNG</th>
                  <th style={{ width: 70, padding: '8px 8px', textAlign: 'center' }}>ĐVT</th>
                  <th style={{ width: 80, padding: '8px 8px', textAlign: 'center' }}>SL NHẬP</th>
                  <th style={{ width: 80, padding: '8px 8px', textAlign: 'center' }}>ĐÃ TRẢ</th>
                  <th style={{ width: 90, padding: '8px 8px', textAlign: 'center' }}>TỐI ĐA TRẢ</th>
                  <th style={{ width: 100, padding: '8px 8px', textAlign: 'center' }}>SL TRẢ</th>
                  <th style={{ width: 100, padding: '8px 8px', textAlign: 'right' }}>GIÁ NHẬP</th>
                  <th style={{ width: 110, padding: '8px 8px', textAlign: 'right' }}>GIÁ TRẢ HÀNG</th>
                  <th style={{ width: 110, padding: '8px 8px', textAlign: 'right' }}>THÀNH TIỀN</th>
                  <th style={{ width: 36, padding: '8px 6px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      Không có sản phẩm nào trong danh sách trả hàng.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const amount = Math.round((Number(item.quantity) || 0) * (Number(item.returnPrice) || 0));
                    const isFullyReturned = (item.maxQuantity || 0) <= 0;

                    return (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9', opacity: isFullyReturned ? 0.6 : 1 }}>
                        <td style={{ textAlign: 'center', color: '#64748b', padding: '6px' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#334155', padding: '6px 8px' }}>{item.code}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a', padding: '6px 8px' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', color: '#475569', padding: '6px 8px' }}>
                          <span style={{ padding: '1px 6px', borderRadius: 4, background: '#f1f5f9', fontSize: 10 }}>
                            {item.unitName || 'Cái'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#475569', padding: '6px 8px' }}>
                          {(item.importQuantity ?? item.maxQuantity ?? 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#ea580c', padding: '6px 8px' }}>
                          {(item.alreadyReturnedQuantity ?? 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: isFullyReturned ? '#dc2626' : '#16a34a', padding: '6px 8px' }}>
                          {(item.maxQuantity ?? 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                          {isFullyReturned ? (
                            <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>
                              Đã trả hết
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={1}
                              max={item.maxQuantity}
                              value={item.quantity}
                              onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                              style={{
                                width: 70,
                                textAlign: 'center',
                                borderRadius: 4,
                                padding: '3px 6px',
                                border: '1px solid #cbd5e1',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#0f172a'
                              }}
                            />
                          )}
                        </td>
                        <td style={{ textAlign: 'right', color: '#64748b', padding: '6px 8px' }}>
                          {Math.round(item.importPrice).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 8px' }}>
                          <input
                            type="number"
                            min={0}
                            value={item.returnPrice}
                            onChange={(e) => handleItemReturnPriceChange(idx, e.target.value)}
                            style={{
                              width: 95,
                              textAlign: 'right',
                              borderRadius: 4,
                              padding: '3px 6px',
                              border: '1px solid #cbd5e1',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#0f172a'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', padding: '6px 8px' }}>
                          {amount.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                          >
                            <DeleteOutlined style={{ fontSize: 12 }} />
                          </button>
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
            width: 360,
            background: '#ffffff',
            borderLeft: '1px solid #cbd5e1',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              {/* KIOTVIET TIME & CREATOR HEADER */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#334155', fontSize: 11 }}>
                <div
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    padding: '3px 6px',
                    borderRadius: 4,
                    background: showDatePicker ? '#f1f5f9' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    {creatorName} {openTimeFormatted || dayjs().format('DD/MM/YYYY HH:mm:ss')}
                  </span>
                  <RightOutlined style={{ fontSize: 10, color: '#64748b' }} />
                </div>

                <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', borderRadius: 12, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>
                  Phiếu trả
                </span>

                {/* KIOTVIET DATE-TIME PICKER POPOVER */}
                {showDatePicker && (
                  <KiotDateTimePicker
                    value={selectedDateTime}
                    onChange={handleDateChange}
                    onClose={() => setShowDatePicker(false)}
                  />
                )}
              </div>

              {/* DEFAULT SUPPLIER DISPLAY */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <UserOutlined style={{ color: '#e8442a', fontSize: 16 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Nhà cung cấp</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                    {supplierInfo.partnerName}
                  </span>
                </div>
              </div>

              {/* TOTALS & PAYMENT CALCULATIONS */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Tổng tiền hàng ({items.length})</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                    {totalGoodsAmount.toLocaleString('vi-VN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Giảm giá</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: Math.max(0, Number(e.target.value) || 0) })}
                    style={{ width: 120, textAlign: 'right', borderRadius: 6, padding: '4px 8px', border: '1px solid #cbd5e1', fontSize: 11 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Cần thu NCC</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                    {netAmount.toLocaleString('vi-VN')}
                  </span>
                </div>

                {/* SỐ TIỀN NHÀ CUNG CẤP ĐÃ TRẢ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Số tiền nhà cung cấp đã trả</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Math.max(0, Number(e.target.value) || 0) })}
                    style={{ width: 120, textAlign: 'right', borderRadius: 6, padding: '4px 8px', border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 700, color: '#16a34a' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Tính vào công nợ</span>
                  <span style={{ fontWeight: 700, color: debtAmount > 0 ? '#ef4444' : '#0f172a', fontSize: 13 }}>
                    {debtAmount.toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={250}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ghi chú phiếu trả hàng (tối đa 250 ký tự)"
                  style={{
                    width: '100%',
                    borderRadius: 6,
                    padding: '6px 10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: 11,
                    height: 32,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(true)}
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid #e8442a',
                  color: '#e8442a',
                  fontWeight: 600,
                  borderRadius: 6,
                  padding: '8px 0',
                  cursor: 'pointer'
                }}
              >
                Lưu tạm
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(false)}
                style={{
                  flex: 1,
                  background: '#e8442a',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: 6,
                  padding: '8px 0',
                  cursor: 'pointer'
                }}
              >
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnDocumentModal;
