import React, { useState, useEffect, useMemo } from 'react';
import {
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  FullscreenOutlined,
  PrinterOutlined,
  RightOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { getSuppliers, getExtraPartners } from '../../../../api/partnerApi';
import { getBInventories } from '../../../../api/binventoryApi';
import { createImportDocument } from '../../../../api/documentApi';
import KiotDateTimePicker from './KiotDateTimePicker';
import QuickCreatePartnerModal from './QuickCreatePartnerModal';
import { useAuth } from '../../../../context/AuthContext';

const ImportDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = [],
  partners = []
}) => {
  const auth = useAuth ? useAuth() : {};
  const user = auth?.user;
  const creatorName = user?.name || user?.email || 'Mno';

  const [loading, setLoading] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(dayjs());
  const [openTimeFormatted, setOpenTimeFormatted] = useState('');
  const [openTimeISO, setOpenTimeISO] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [suppliersList, setSuppliersList] = useState([]);
  const [extraPartnersList, setExtraPartnersList] = useState([]);
  const [bInventoryList, setBInventoryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [createPartnerModalOpen, setCreatePartnerModalOpen] = useState(false);
  const [createPartnerDefaultType, setCreatePartnerDefaultType] = useState(1);

  const handlePartnerCreated = (newPartner) => {
    if (!newPartner) return;
    if (newPartner.type === 1 || createPartnerDefaultType === 1) {
      if (branchId) {
        getSuppliers(branchId)
          .then((res) => {
            const data = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
            setSuppliersList(data.length > 0 ? data : partners);
          })
          .catch((err) => console.error('Failed to load suppliers:', err));
      }
      if (newPartner.id) {
        setFormData((prev) => ({ ...prev, supplierId: Number(newPartner.id) }));
      }
    } else {
      if (branchId) {
        getExtraPartners(branchId)
          .then((res) => {
            const data = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
            setExtraPartnersList(data);
          })
          .catch((err) => console.error('Failed to load extra partners:', err));
      }
      if (newPartner.id) {
        setExtraPartners((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            partnerId: Number(newPartner.id),
            amountDue: 0,
            amountPaid: 0,
            note: ''
          }
        ]);
      }
    }
  };

  const [formData, setFormData] = useState({
    supplierId: undefined,
    docCode: '',
    discount: 0,
    paidAmount: 0,
    note: ''
  });

  const [items, setItems] = useState([]);
  const [extraPartners, setExtraPartners] = useState([]);

  useEffect(() => {
    if (open) {
      const now = dayjs();
      setSelectedDateTime(now);
      setOpenTimeFormatted(now.format('DD/MM/YYYY HH:mm:ss'));
      setOpenTimeISO(now.toISOString());
      setShowDatePicker(false);
      setSearchQuery('');
      setShowDropdown(false);

      setFormData({
        supplierId: undefined,
        docCode: '',
        discount: 0,
        paidAmount: 0,
        note: ''
      });
      setItems([]);
      setExtraPartners([]);

      if (branchId) {
        getSuppliers(branchId)
          .then((res) => {
            const data = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
            setSuppliersList(data.length > 0 ? data : partners);
          })
          .catch((err) => {
            console.error('Failed to load suppliers:', err);
            setSuppliersList(partners);
          });

        getExtraPartners(branchId)
          .then((res) => {
            const data = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
            setExtraPartnersList(data);
          })
          .catch((err) => {
            console.error('Failed to load extra partners:', err);
            setExtraPartnersList([]);
          });

        getBInventories(branchId, '', 'IMPORT', 1)
          .then((res) => {
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
            setBInventoryList(data);
          })
          .catch((err) => {
            console.error('Failed to load BInventories:', err);
            setBInventoryList([]);
          });
      }
    }
  }, [open, branchId, partners]);

  const handleDateChange = (newDate) => {
    setSelectedDateTime(newDate);
    setOpenTimeFormatted(newDate.format('DD/MM/YYYY HH:mm:ss'));
    setOpenTimeISO(newDate.toISOString());
  };

  const searchOptions = useMemo(() => {
    const rawList = bInventoryList.length > 0 ? bInventoryList : products;
    return rawList
      .filter((b) => b && (b.id != null || b.bInventoryId != null || b.productId != null))
      .map((b) => ({
        id: b.id ?? b.bInventoryId ?? b.productId,
        code: b.code || b.skuCode || 'SP',
        name: b.name || 'Sản phẩm',
        stock: b.quantity ?? b.stockQuantity ?? 0,
        price: b.purchasePrice || b.price || 0,
        conversions: b.unitConversions || []
      }));
  }, [bInventoryList, products]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return searchOptions;
    const q = searchQuery.toLowerCase();
    return searchOptions.filter(
      (opt) => opt.code.toLowerCase().includes(q) || opt.name.toLowerCase().includes(q)
    );
  }, [searchOptions, searchQuery]);

  const MAX_LIMIT = 10000000000; // 10 billion VNĐ

  const totalGoodsAmount = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  }, [items]);

  const rawSupplierAmount = Math.max(0, totalGoodsAmount - (Number(formData.discount) || 0));
  const supplierAmountDue = Math.round(rawSupplierAmount);

  const extraTotalDue = useMemo(() => {
    return extraPartners.reduce((sum, ep) => sum + Math.round(Number(ep.amountDue) || 0), 0);
  }, [extraPartners]);

  const extraTotalPaid = useMemo(() => {
    return extraPartners.reduce((sum, ep) => sum + (Number(ep.amountPaid) || 0), 0);
  }, [extraPartners]);

  const netAmount = supplierAmountDue + extraTotalDue;
  const supplierAmountPaid = Number(formData.paidAmount) || 0;
  const totalPaid = supplierAmountPaid + extraTotalPaid;
  const debtAmount = Math.max(0, netAmount - totalPaid);

  const handleSelectProduct = (opt) => {
    const conversions = opt.conversions || opt.unitConversions || [];
    const defaultConversion = conversions.find((uc) => uc.conversionPoint === 1 || uc.isBaseUnit) || conversions[0];

    const initialQuantity = 1;
    const initialPrice = opt.price > 0 ? Math.floor(opt.price) : 1;
    const itemTotal = initialQuantity * initialPrice;

    if (netAmount + itemTotal > MAX_LIMIT) {
      alert('Không thể thêm sản phẩm. Tổng giá trị đơn nhập (bao gồm đối tác) sẽ vượt quá 10 tỷ VNĐ!');
      return;
    }

    setItems((prevItems) => [
      ...prevItems,
      {
        rowId: `${opt.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        bInventoryId: opt.id,
        code: opt.code,
        name: opt.name,
        stock: opt.stock,
        quantity: initialQuantity,
        unitPrice: initialPrice,
        unitConversionId: defaultConversion?.id || defaultConversion?.unitConversionId || null,
        unitName: opt.unitName || defaultConversion?.unitName || '',
        unitConversions: conversions
      }
    ]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleDuplicateItem = (index) => {
    const targetItem = items[index];
    if (!targetItem) return;

    const itemTotal = (Number(targetItem.quantity) || 1) * (Number(targetItem.unitPrice) || 1);
    if (netAmount + itemTotal > MAX_LIMIT) {
      alert('Không thể nhân đôi. Tổng giá trị đơn nhập (bao gồm đối tác) sẽ vượt quá 10 tỷ VNĐ!');
      return;
    }

    const duplicatedItem = {
      ...targetItem,
      rowId: `${targetItem.bInventoryId || targetItem.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };

    const updated = [...items];
    updated.splice(index + 1, 0, duplicatedItem);
    setItems(updated);
  };

  const handleSubmit = async (isDraft = false) => {
    if (items.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const q = Number(item.quantity);
      const p = Number(item.unitPrice);

      if (isNaN(q) || q < 0.001 || q > MAX_LIMIT) {
        alert(`Số lượng sản phẩm "${item.name}" phải từ 0.001 đến 10.000.000.000.`);
        return;
      }
      if (isNaN(p) || p < 1 || p > MAX_LIMIT) {
        alert(`Đơn giá sản phẩm "${item.name}" phải là số nguyên dương từ 1 đến 10.000.000.000.`);
        return;
      }
    }

    if (!formData.supplierId) {
      alert('Vui lòng chọn nhà cung cấp.');
      return;
    }

    if (netAmount > MAX_LIMIT) {
      alert('Tổng giá trị đơn nhập (bao gồm chi phí phải trả cho đối tác khác) không được vượt quá 10 tỷ VNĐ!');
      return;
    }

    // Validate extra partners
    for (let ep of extraPartners) {
      if (!ep.partnerId) {
        alert('Vui lòng chọn đối tác cho tất cả các hàng đối tác khác.');
        return;
      }
      if (ep.amountDue != null && Number(ep.amountDue) > MAX_LIMIT) {
        alert('Số tiền cần trả cho đối tác khác không được vượt quá 10 tỷ VNĐ.');
        return;
      }
    }

    // Validate partner uniqueness
    const allSelectedPartnerIds = [
      Number(formData.supplierId),
      ...extraPartners.filter((ep) => ep.partnerId).map((ep) => Number(ep.partnerId))
    ];
    if (new Set(allSelectedPartnerIds).size !== allSelectedPartnerIds.length) {
      alert('Mỗi đối tác chỉ được chọn một lần trong phiếu nhập kho.');
      return;
    }

    setLoading(true);
    try {
      const dto = {
        branchId: Number(branchId),
        businessDate: openTimeISO || new Date().toISOString(),
        createdByAccountId: Number(user?.id || user?.accountId || 1),
        note: formData.note || '',
        details: items.map((i) => ({
          bInventoryId: Number(i.bInventoryId || i.id),
          unitConversionId: i.unitConversionId ? Number(i.unitConversionId) : null,
          quantity: Number(i.quantity),
          unitPrice: Math.floor(Number(i.unitPrice)),
          note: ''
        })),
        partners: [
          {
            partnerId: Number(formData.supplierId),
            amountPaid: Math.floor(Number(formData.paidAmount || 0)),
            note: 'Thanh toán tiền hàng cho Nhà cung cấp'
          },
          ...extraPartners
            .filter((ep) => ep.partnerId)
            .map((ep) => ({
              partnerId: Number(ep.partnerId),
              amountDue: Math.floor(Number(ep.amountDue || 0)),
              amountPaid: Math.floor(Number(ep.amountPaid || 0)),
              note: ep.note || ''
            }))
        ]
      };

      await createImportDocument(dto);
      alert(`${isDraft ? 'Lưu tạm' : 'Hoàn thành'} tạo phiếu nhập kho thành công!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.title || err.message || 'Lỗi khi tạo phiếu nhập kho.';
      alert(errMsg);
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
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 12
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          height: 48,
          background: 'linear-gradient(135deg, #e8442a 0%, #d9381e 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxShadow: '0 2px 8px rgba(232, 68, 42, 0.25)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#ffffff', letterSpacing: '0.3px' }}>
            Nhập hàng
          </span>

          {/* SEARCH PRODUCT DROPDOWN CONTAINER */}
          <div style={{ position: 'relative', width: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.95)', borderRadius: 16, padding: '3px 12px', border: '1px solid rgba(255,255,255,0.4)' }}>
              <SearchOutlined style={{ color: '#e8442a', marginRight: 6 }} />
              <input
                type="text"
                placeholder="Tìm theo mã hoặc tên hàng hóa..."
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: 11,
                  background: 'transparent',
                  color: '#0f172a'
                }}
              />
            </div>

            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 32,
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  maxHeight: 240,
                  overflowY: 'auto',
                  zIndex: 1001
                }}
              >
                {filteredOptions.length === 0 ? (
                  <div style={{ padding: 10, color: '#94a3b8', textAlign: 'center' }}>Không tìm thấy hàng hóa</div>
                ) : (
                  filteredOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectProduct(opt)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div>
                        <strong style={{ color: '#e8442a' }}>{opt.code}</strong> - <span style={{ color: '#0f172a', fontWeight: 600 }}>{opt.name}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#64748b' }}>Tồn: {opt.stock}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
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

      {/* BODY CONTENT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: SELECTED PRODUCTS TABLE */}
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
                  <th style={{ padding: '8px 10px', width: 30, textAlign: 'center' }}></th>
                  <th style={{ padding: '8px 10px', width: 40, textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>MÃ HÀNG HÓA</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>TÊN HÀNG</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', width: 110 }}>ĐƠN VỊ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: 110 }}>SỐ LƯỢNG</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>ĐƠN GIÁ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>THÀNH TIỀN</th>
                  <th style={{ padding: '8px 8px', width: 30, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                      Chưa có sản phẩm nào được chọn.
                    </td>
                  </tr>
                ) : (
                  items.map((record, index) => (
                    <tr key={record.rowId || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...items];
                            updated.splice(index, 1);
                            setItems(updated);
                          }}
                          title="Xóa dòng"
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                        >
                          <DeleteOutlined style={{ fontSize: 14 }} />
                        </button>
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ fontWeight: 600, color: '#334155', padding: '6px 10px' }}>{record.code}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{record.name}</div>
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        {record.unitConversions && record.unitConversions.length > 0 ? (
                          <select
                            value={record.unitConversionId || ''}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              const updated = [...items];
                              updated[index] = { ...updated[index], unitConversionId: val };
                              setItems(updated);
                            }}
                            style={{
                              width: '100%',
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                              padding: '2px 4px',
                              fontSize: 10,
                              background: '#ffffff'
                            }}
                          >
                            {record.unitConversions.map((uc) => (
                              <option key={uc.id || uc.unitConversionId} value={uc.id || uc.unitConversionId}>
                                {uc.unitName} (x{uc.conversionPoint})
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            min={0.001}
                            max={10000000000}
                            step="any"
                            value={record.quantity ?? 1}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const val = raw === '' ? '' : Math.min(10000000000, Math.max(0.001, Number(raw) || 0.001));
                              const updated = [...items];
                              updated[index] = { ...updated[index], quantity: val };
                              setItems(updated);
                            }}
                            style={{
                              width: 65,
                              textAlign: 'center',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              padding: '2px 4px',
                              fontSize: 11
                            }}
                          />
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>/{record.stock || 0}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 10px' }}>
                        <input
                          type="number"
                          min={1}
                          max={10000000000}
                          step={1}
                          value={record.unitPrice ?? 0}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = raw === '' ? '' : Math.min(10000000000, Math.max(1, Math.floor(Number(raw) || 1)));
                            const updated = [...items];
                            updated[index] = { ...updated[index], unitPrice: val };
                            setItems(updated);
                          }}
                          style={{
                            width: 90,
                            textAlign: 'right',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            padding: '2px 6px',
                            fontSize: 11
                          }}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', padding: '6px 10px' }}>
                        {((Number(record.quantity) || 0) * (Number(record.unitPrice) || 0)).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          title="Nhân đôi dòng"
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            width: 22,
                            height: 22,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#16a34a',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <PlusOutlined style={{ fontSize: 11 }} />
                        </button>
                      </td>
                    </tr>
                  ))
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
            justifyContent: 'space-between',
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
                  Phiếu tạm
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

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontSize: 11 }}>
                    Chọn nhà cung cấp <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatePartnerDefaultType(1);
                      setCreatePartnerModalOpen(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e8442a',
                      fontWeight: 600,
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <PlusOutlined style={{ fontSize: 10 }} /> Tạo mới
                  </button>
                </div>
                <select
                  value={formData.supplierId || ''}
                  onChange={(e) => {
                    const newSupplierId = e.target.value ? Number(e.target.value) : undefined;
                    setFormData({ ...formData, supplierId: newSupplierId });
                    if (newSupplierId) {
                      setExtraPartners((prev) => prev.filter((ep) => Number(ep.partnerId) !== newSupplierId));
                    }
                  }}
                  style={{
                    width: '100%',
                    borderRadius: 6,
                    padding: '6px 10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: 11
                  }}
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliersList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || s.phone || `NCC#${s.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 4, color: '#64748b', fontSize: 11 }}>Mã nhập hàng</div>
                <input
                  type="text"
                  value={formData.docCode}
                  onChange={(e) => setFormData({ ...formData, docCode: e.target.value })}
                  placeholder="Mã phiếu tự động"
                  style={{ width: '100%', borderRadius: 6, padding: '6px 10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: 11 }}
                />
              </div>

              {/* EXTRA PARTNERS SECTION */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>Đối tác khác</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatePartnerDefaultType(3);
                        setCreatePartnerModalOpen(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#e8442a',
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <PlusOutlined style={{ fontSize: 10 }} /> Tạo mới
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExtraPartners([
                          ...extraPartners,
                          {
                            id: `${Date.now()}-${Math.random()}`,
                            partnerId: '',
                            amountDue: 0,
                            amountPaid: 0,
                            note: ''
                          }
                        ]);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#e8442a',
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <PlusOutlined style={{ fontSize: 10 }} /> Thêm đối tác khác
                    </button>
                  </div>
                </div>

                {extraPartners.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    {extraPartners.map((ep, epIndex) => {
                      const selectedPartnerIds = [
                        formData.supplierId ? Number(formData.supplierId) : null,
                        ...extraPartners
                          .map((item, idx) => (idx !== epIndex && item.partnerId ? Number(item.partnerId) : null))
                      ].filter(Boolean);

                      const availableExtraPartners = extraPartnersList.filter(
                        (p) => !selectedPartnerIds.includes(Number(p.id))
                      );

                      return (
                        <div
                          key={ep.id}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <select
                              value={ep.partnerId || ''}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : '';
                                const updated = [...extraPartners];
                                updated[epIndex] = { ...updated[epIndex], partnerId: val };
                                setExtraPartners(updated);
                              }}
                              style={{
                                flex: 1,
                                marginRight: 6,
                                borderRadius: 4,
                                padding: '4px 6px',
                                border: '1px solid #cbd5e1',
                                fontSize: 11
                              }}
                            >
                              <option value="">-- Chọn đối tác --</option>
                              {availableExtraPartners.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.type === 3 ? 'Vận chuyển' : 'Khác'})
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...extraPartners];
                                updated.splice(epIndex, 1);
                                setExtraPartners(updated);
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <DeleteOutlined style={{ fontSize: 12 }} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Giá cần trả</div>
                              <input
                                type="number"
                                min={0}
                                value={ep.amountDue}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  const updated = [...extraPartners];
                                  updated[epIndex] = { ...updated[epIndex], amountDue: val };
                                  setExtraPartners(updated);
                                }}
                                style={{ width: '100%', borderRadius: 4, padding: '3px 6px', border: '1px solid #cbd5e1', fontSize: 10 }}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Giá đã trả</div>
                              <input
                                type="number"
                                min={0}
                                value={ep.amountPaid}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  const updated = [...extraPartners];
                                  updated[epIndex] = { ...updated[epIndex], amountPaid: val };
                                  setExtraPartners(updated);
                                }}
                                style={{ width: '100%', borderRadius: 4, padding: '3px 6px', border: '1px solid #cbd5e1', fontSize: 10 }}
                              />
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Ghi chú đối tác</div>
                            <input
                              type="text"
                              maxLength={250}
                              value={ep.note || ''}
                              onChange={(e) => {
                                const updated = [...extraPartners];
                                updated[epIndex] = { ...updated[epIndex], note: e.target.value };
                                setExtraPartners(updated);
                              }}
                              placeholder="Ghi chú (tối đa 250 ký tự)"
                              style={{ width: '100%', borderRadius: 4, padding: '3px 6px', border: '1px solid #cbd5e1', fontSize: 10 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                  <span style={{ color: '#475569' }}>Cần trả NCC</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 12 }}>
                    {supplierAmountDue.toLocaleString('vi-VN')}
                  </span>
                </div>

                {extraTotalDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>Phí đối tác khác</span>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 12 }}>
                      +{extraTotalDue.toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Tổng tiền cần trả</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                    {netAmount.toLocaleString('vi-VN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Tiền trả NCC</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Math.max(0, Number(e.target.value) || 0) })}
                    style={{ width: 120, textAlign: 'right', borderRadius: 6, padding: '4px 8px', border: '1px solid #cbd5e1', fontSize: 11 }}
                  />
                </div>

                {extraTotalPaid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>Tiền trả đối tác khác</span>
                    <span style={{ fontWeight: 600, color: '#16a34a', fontSize: 12 }}>
                      {extraTotalPaid.toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}

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
                  placeholder="Ghi chú phiếu nhập (tối đa 250 ký tự)"
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
                  border: '1px solid #e8442a',
                  color: '#ffffff',
                  fontWeight: 700,
                  borderRadius: 6,
                  padding: '8px 0',
                  cursor: 'pointer'
                }}
              >
                HOÀN THÀNH
              </button>
            </div>
          </div>
        </div>
      </div>
      <QuickCreatePartnerModal
        open={createPartnerModalOpen}
        onClose={() => setCreatePartnerModalOpen(false)}
        branchId={branchId}
        defaultType={createPartnerDefaultType}
        onSuccess={handlePartnerCreated}
      />
    </div>
  );
};

export default ImportDocumentModal;
