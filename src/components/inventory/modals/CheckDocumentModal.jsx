import React, { useState, useEffect, useMemo } from 'react';
import {
  Input,
  Select,
  InputNumber,
  Button,
  Table,
  Space,
  Tag,
  Tooltip,
  message
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  FullscreenOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { getBInventories } from '../../../api/binventoryApi';
import { createCheckDocument } from '../../../api/documentApi';

// ─── PHIẾU KIỂM KHO (CHECK / AUDIT) ──────────────────────────────────────────
const CheckDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = []
}) => {
  const [loading, setLoading] = useState(false);
  const [openTimeFormatted, setOpenTimeFormatted] = useState('');
  const [openTimeISO, setOpenTimeISO] = useState('');
  const [bInventoryList, setBInventoryList] = useState([]);
  const [searchVal, setSearchVal] = useState(undefined);

  const [formData, setFormData] = useState({
    auditor: '',
    docCode: '',
    note: ''
  });
  const [items, setItems] = useState([]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      const now = dayjs();
      setOpenTimeFormatted(now.format('YYYY-MM-DD HH:mm:ss'));
      setOpenTimeISO(now.toISOString());
      setSearchVal(undefined);

      setFormData({
        auditor: '',
        docCode: '',
        note: ''
      });
      setItems([]);

      if (branchId) {
        getBInventories(branchId, '', 'CHECK', 2)
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
  }, [open, branchId]);

  const handleSelectProduct = (bInvId) => {
    if (!bInvId) return;

    const binv = bInventoryList.find((b) => b.id === bInvId || b.bInventoryId === bInvId);
    const prod = products.find((p) => p.id === bInvId);

    const itemId = binv ? binv.bInventoryId || binv.id : (prod ? prod.id : bInvId);
    const name = binv ? binv.name : (prod ? prod.name : `Sản phẩm #${bInvId}`);
    const code = binv ? binv.code : (prod ? prod.code : `SP${bInvId}`);
    const systemStock = binv ? (binv.stockQuantity ?? binv.quantity ?? 0) : (prod ? prod.stockQuantity || 0 : 0);

    const existingIndex = items.findIndex((i) => i.bInventoryId === itemId);

    if (existingIndex >= 0) {
      message.info(`${name} đã có trong danh sách kiểm kho.`);
    } else {
      setItems([
        ...items,
        {
          bInventoryId: itemId,
          code,
          name,
          systemStock,
          actualQuantity: systemStock,
          difference: 0
        }
      ]);
    }
    setSearchVal(undefined);
  };

  // Total difference value
  const totalDifference = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.difference || 0), 0);
  }, [items]);

  const handleSubmit = async (isDraft = false) => {
    if (items.length === 0) {
      message.error('Vui lòng chọn ít nhất 1 sản phẩm để kiểm kho.');
      return;
    }

    setLoading(true);
    try {
      const dto = {
        branchId: Number(branchId),
        businessDate: openTimeISO || new Date().toISOString(),
        details: items.map((i) => ({
          bInventoryId: Number(i.bInventoryId),
          actualQuantity: Number(i.actualQuantity),
          note: ''
        }))
      };
      await createCheckDocument(dto);
      message.success(`${isDraft ? 'Lưu tạm' : 'Hoàn thành'} Kiểm kho thành công!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.title || err.message || 'Lỗi khi tạo phiếu kiểm kho.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const searchOptions = useMemo(() => {
    return bInventoryList.length > 0
      ? bInventoryList
          .filter((b) => b && (b.id != null || b.bInventoryId != null || b.productId != null))
          .map((b) => ({
            value: b.id ?? b.bInventoryId ?? b.productId,
            label: `${b.code || 'SP'} - ${b.name || 'Sản phẩm'} (Tồn: ${b.quantity ?? 0})`
          }))
      : products
          .filter((p) => p && p.id != null)
          .map((p) => ({
            value: p.id,
            label: `${p.code || `SP${p.id}`} - ${p.name || 'Sản phẩm'}`
          }));
  }, [bInventoryList, products]);

  if (!open) return null;

  const columns = [
    {
      title: '',
      key: 'actions',
      width: 40,
      align: 'center',
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined style={{ fontSize: 14 }} />}
          onClick={() => {
            const updated = [...items];
            updated.splice(index, 1);
            setItems(updated);
          }}
        />
      )
    },
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Mã hàng hóa',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (val) => <span style={{ fontWeight: 600, color: '#334155' }}>{val}</span>
    },
    {
      title: 'Tên hàng',
      dataIndex: 'name',
      key: 'name',
      render: (val) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{val}</span>
    },
    {
      title: 'Tồn hệ thống',
      dataIndex: 'systemStock',
      key: 'systemStock',
      width: 120,
      align: 'right',
      render: (val) => <span style={{ color: '#64748b' }}>{val != null ? val.toLocaleString('vi-VN') : '0'}</span>
    },
    {
      title: 'Tồn thực tế',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 150,
      align: 'center',
      render: (_, record, index) => (
        <InputNumber
          min={0}
          value={record.actualQuantity ?? 0}
          onChange={(v) => {
            const val = v != null ? Math.max(0, Number(v) || 0) : 0;
            const updated = [...items];
            updated[index] = {
              ...updated[index],
              actualQuantity: val,
              difference: val - (updated[index].systemStock || 0)
            };
            setItems(updated);
          }}
          style={{ width: 90, borderRadius: 16, textAlign: 'center' }}
        />
      )
    },
    {
      title: 'Số lượng lệch',
      key: 'difference',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const diff = (record.actualQuantity || 0) - (record.systemStock || 0);
        const color = diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#64748b';
        return (
          <span style={{ fontWeight: 700, color }}>
            {diff > 0 ? '+' : ''}{diff}
          </span>
        );
      }
    }
  ];

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
          background: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}
      >
        <Space size="large">
          <span style={{ fontWeight: 700, fontSize: 16, color: '#38bdf8' }}>
            Kiểm kho & Điều chỉnh
          </span>

          <div style={{ width: 420 }}>
            <Select
              showSearch
              placeholder="Tìm theo mã hoặc tên hàng hóa... (F1)"
              optionFilterProp="label"
              value={searchVal}
              onChange={handleSelectProduct}
              options={searchOptions}
              suffixIcon={<SearchOutlined style={{ color: '#94a3b8' }} />}
              style={{ width: '100%', borderRadius: 16 }}
              popupMatchSelectWidth={false}
            />
          </div>
        </Space>

        <Space size="middle">
          <Tooltip title="Toàn màn hình">
            <Button type="text" icon={<FullscreenOutlined style={{ color: '#94a3b8', fontSize: 16 }} />} />
          </Tooltip>
          <Tooltip title="In phiếu">
            <Button type="text" icon={<PrinterOutlined style={{ color: '#94a3b8', fontSize: 16 }} />} />
          </Tooltip>
          <Button
            type="text"
            icon={<CloseOutlined style={{ color: '#f87171', fontSize: 18 }} />}
            onClick={onClose}
          />
        </Space>
      </div>

      {/* BODY WORKSPACE */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT PRODUCT TABLE */}
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Table
              dataSource={items}
              rowKey="bInventoryId"
              columns={columns}
              pagination={false}
              scroll={{ y: 'calc(100vh - 170px)' }}
              size="small"
              locale={{ emptyText: 'Chưa có sản phẩm nào được chọn để kiểm kho.' }}
            />
          </div>
        </div>

        {/* RIGHT CONTROL SIDEBAR */}
        <div
          style={{
            width: 340,
            background: '#ffffff',
            borderLeft: '1px solid #cbd5e1',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: 11 }}>
                <span>Thời gian: <strong>{openTimeFormatted || 'Hôm nay'}</strong></span>
                <Tag color="gold" style={{ borderRadius: 12, padding: '0 8px' }}>Kiểm kho</Tag>
              </div>

              {/* NGƯỜI KIỂM KHO */}
              <div>
                <div style={{ marginBottom: 4, color: '#64748b', fontSize: 11 }}>
                  Người kiểm kho (F4)
                </div>
                <Input
                  value={formData.auditor}
                  onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
                  placeholder="Nhập tên người kiểm kho..."
                  style={{ borderRadius: 6 }}
                />
              </div>

              {/* MÃ KIỂM KHO */}
              <div>
                <div style={{ marginBottom: 4, color: '#64748b', fontSize: 11 }}>Mã kiểm kho</div>
                <Input
                  value={formData.docCode}
                  onChange={(e) => setFormData({ ...formData, docCode: e.target.value })}
                  placeholder="Mã phiếu tự động"
                  style={{ borderRadius: 6 }}
                />
              </div>

              {/* TỔNG KẾT KIỂM KHO */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Tổng mặt hàng kiểm ({items.length})</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                    {items.length} sản phẩm
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Tổng chênh lệch</span>
                  <span style={{ fontWeight: 700, color: totalDifference !== 0 ? '#ef4444' : '#059669', fontSize: 13 }}>
                    {totalDifference > 0 ? '+' : ''}{totalDifference}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Mặt hàng lệch</span>
                  <span style={{ fontWeight: 700, color: '#ef4444', fontSize: 13 }}>
                    {items.filter((i) => (i.actualQuantity || 0) !== (i.systemStock || 0)).length} mặt hàng
                  </span>
                </div>
              </div>

              {/* GHI CHÚ */}
              <div>
                <Input.TextArea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  placeholder="Ghi chú kiểm kho"
                  style={{ borderRadius: 6 }}
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <Button
                type="default"
                style={{ flex: 1, borderColor: '#2563eb', color: '#2563eb', fontWeight: 600, borderRadius: 6 }}
                loading={loading}
                onClick={() => handleSubmit(true)}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                style={{ flex: 1, background: '#e8442a', borderColor: '#e8442a', fontWeight: 700, borderRadius: 6 }}
                loading={loading}
                onClick={() => handleSubmit(false)}
              >
                HOÀN THÀNH
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckDocumentModal;
