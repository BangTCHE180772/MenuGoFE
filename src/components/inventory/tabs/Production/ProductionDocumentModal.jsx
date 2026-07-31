import React, { useState, useEffect } from 'react';
import {
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Checkbox,
  Tabs,
  Table,
  Row,
  Col,
  Modal,
  message
} from 'antd';
import dayjs from 'dayjs';

import { getBInventories } from '../../../../api/binventoryApi';
import { createProductionDocument } from '../../../../api/documentApi';

const ProductionDocumentModal = ({
  open,
  onClose,
  onSuccess,
  branchId,
  products = []
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [manufacturedBInvs, setManufacturedBInvs] = useState([]);

  const [formData, setFormData] = useState({
    productId: undefined,
    quantity: 1,
    createdDate: null,
    autoDeductSecondary: true,
    docCode: '',
    note: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        productId: undefined,
        quantity: 1,
        createdDate: dayjs(),
        autoDeductSecondary: true,
        docCode: '',
        note: ''
      });
      setActiveTab('1');

      if (branchId) {
        getBInventories(branchId, '', 'PRODUCTION', 3)
          .then((res) => {
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
            setManufacturedBInvs(data);
          })
          .catch((err) => {
            console.error('Failed to load manufactured BInventories:', err);
            setManufacturedBInvs([]);
          });
      }
    }
  }, [open, branchId]);

  if (!open) return null;

  const manufacturedProductsList = manufacturedBInvs.length > 0
    ? manufacturedBInvs
    : products.filter((p) => p.type === 'Manufactured');

  const selectedProduct = products.find((p) => p.id === formData.productId);

  const ingredients = selectedProduct?.ingredients || [
    { id: 101, code: 'NL001', name: 'Đường cát trắng', unitName: 'kg', normQty: 0.1, stockQty: 50 },
    { id: 102, code: 'NL002', name: 'Sữa tươi không đường', unitName: 'lít', normQty: 0.2, stockQty: 30 },
    { id: 103, code: 'NL003', name: 'Hương liệu cốt', unitName: 'chai', normQty: 0.05, stockQty: 10 }
  ];

  const ingredientColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      align: 'center',
      render: (_, __, idx) => idx + 1
    },
    {
      title: 'Mã nguyên liệu',
      dataIndex: 'code',
      key: 'code',
      width: 120
    },
    {
      title: 'Tên nguyên liệu',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Định lượng',
      dataIndex: 'normQty',
      key: 'normQty',
      width: 100,
      align: 'right',
      render: (val, record) => `${val} ${record.unitName}`
    },
    {
      title: 'Số lượng cần dùng',
      key: 'requiredQty',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <span style={{ fontWeight: 700, color: '#2563eb' }}>
          {(record.normQty * (formData.quantity || 1)).toFixed(2)} {record.unitName}
        </span>
      )
    },
    {
      title: 'Tồn kho hiện tại',
      dataIndex: 'stockQty',
      key: 'stockQty',
      width: 120,
      align: 'right',
      render: (val, record) => `${val} ${record.unitName}`
    }
  ];

  const handleSubmit = async (isDraft = false) => {
    if (!formData.productId) {
      message.error('Vui lòng chọn sản phẩm sản xuất.');
      return;
    }
    if (formData.quantity == null || formData.quantity < 1) {
      message.error('Số lượng sản xuất tối thiểu là 1.');
      return;
    }

    setLoading(true);
    try {
      const dto = {
        branchId: Number(branchId),
        businessDate: formData.createdDate ? formData.createdDate.toISOString() : new Date().toISOString(),
        details: [
          {
            bInventoryId: Number(formData.productId),
            quantity: Number(formData.quantity),
            note: formData.note || ''
          }
        ]
      };

      await createProductionDocument(dto);
      message.success(`${isDraft ? 'Lưu tạm' : 'Hoàn thành'} tạo phiếu sản xuất thành công!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || err.message || 'Lỗi tạo phiếu sản xuất.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
          Tạo phiếu sản xuất
        </span>
      }
      open={open}
      onCancel={onClose}
      width={720}
      style={{ top: 40 }}
      styles={{ body: { padding: '12px 24px 24px' } }}
      footer={[
        <Button key="ghost" type="text" onClick={onClose} style={{ color: '#475569', fontWeight: 500 }}>
          Bỏ qua
        </Button>,
        <Button
          key="draft"
          style={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 600, borderRadius: 8, padding: '0 20px' }}
          loading={loading}
          onClick={() => handleSubmit(true)}
        >
          Lưu tạm
        </Button>,
        <Button
          key="submit"
          type="primary"
          style={{ background: '#e8442a', borderColor: '#e8442a', fontWeight: 700, borderRadius: 8, padding: '0 24px' }}
          loading={loading}
          onClick={() => handleSubmit(false)}
        >
          Hoàn thành
        </Button>
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: '1',
            label: 'Thông tin chung',
            children: (
              <div style={{ paddingTop: 8 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 4, fontWeight: 500, color: '#334155' }}>
                      Mặt hàng sản xuất <span style={{ color: '#ef4444' }}>*</span>
                    </div>
                    <Select
                      value={formData.productId}
                      onChange={(val) => setFormData({ ...formData, productId: val ? Number(val) : undefined })}
                      placeholder="Chọn sản phẩm sản xuất"
                      options={manufacturedProductsList.map((p) => ({
                        value: p.id || p.bInventoryId,
                        label: `${p.code || `SP${p.id}`} - ${p.name}`
                      }))}
                      style={{ width: '100%', borderRadius: 6 }}
                    />
                  </Col>

                  <Col span={12}>
                    <div style={{ marginBottom: 4, fontWeight: 500, color: '#334155' }}>
                      Số lượng <span style={{ color: '#ef4444' }}>*</span>
                    </div>
                    <InputNumber
                      min={1}
                      value={formData.quantity}
                      onChange={(val) => setFormData({ ...formData, quantity: val != null ? Math.max(1, Number(val) || 1) : 1 })}
                      style={{ width: '100%', borderRadius: 6 }}
                    />
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={12}>
                    <div style={{ marginBottom: 4, fontWeight: 500, color: '#334155' }}>Mã sản xuất</div>
                    <Input
                      value={formData.docCode}
                      onChange={(e) => setFormData({ ...formData, docCode: e.target.value })}
                      placeholder="Tự động"
                      style={{ borderRadius: 6 }}
                    />
                  </Col>

                  <Col span={12}>
                    <div style={{ marginBottom: 4, fontWeight: 500, color: '#334155' }}>Thời gian tạo</div>
                    <DatePicker
                      value={formData.createdDate ? dayjs(formData.createdDate) : undefined}
                      onChange={(date) => setFormData({ ...formData, createdDate: date })}
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      style={{ width: '100%', borderRadius: 6 }}
                    />
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={24}>
                    <Checkbox
                      checked={formData.autoDeductSecondary}
                      onChange={(e) => setFormData({ ...formData, autoDeductSecondary: e.target.checked })}
                      style={{ color: '#475569', fontSize: 12 }}
                    >
                      Tự động trừ tồn kho thành phần (Nguyên liệu) khi hoàn thành sản xuất
                    </Checkbox>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={24}>
                    <div style={{ marginBottom: 4, fontWeight: 500, color: '#334155' }}>Ghi chú</div>
                    <Input.TextArea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      rows={3}
                      placeholder="Ghi chú quy trình sản xuất..."
                      style={{ borderRadius: 6 }}
                    />
                  </Col>
                </Row>
              </div>
            )
          },
          {
            key: '2',
            label: 'Thành phần nguyên liệu (BOM)',
            children: (
              <div style={{ paddingTop: 8 }}>
                <Table
                  dataSource={ingredients}
                  columns={ingredientColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  bordered
                />
              </div>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default ProductionDocumentModal;
