import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Table,
  Space,
  Row,
  Col,
  Tag,
  Divider,
  message,
  Card,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  SwapOutlined,
  AuditOutlined,
  BuildOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  createImportDocument,
  createExportDeleteDocument,
  createTransferDocument,
  receiveTransferDocument,
  createReturnDocument,
  createCheckDocument,
  createProductionDocument
} from '../../api/documentApi';

// ==========================================
// 1. IMPORT MODAL (Nhập kho)
// ==========================================
export const ImportModal = ({ open, onClose, onSuccess, branchId, products = [], partners = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // Lọc sản phẩm không được nhập Processed & Manufactured
  const allowedProducts = products.filter(
    (p) => p.type !== 'Processed' && p.type !== 'Manufactured'
  );

  const handleAddItem = (productId) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    if (items.some((i) => i.productId === productId)) {
      message.warning('Sản phẩm đã có trong danh sách nhập.');
      return;
    }
    setItems([
      ...items,
      {
        key: prod.id,
        productId: prod.id,
        productName: prod.name,
        code: prod.code,
        unitName: prod.unitName || 'Cái',
        bInventoryId: prod.binventoryId || prod.id,
        quantity: 1,
        unitPrice: prod.purchasePrice || 0
      }
    ]);
  };

  const handleRemoveItem = (key) => {
    setItems(items.filter((i) => i.key !== key));
  };

  const handleQuantityChange = (key, val) => {
    setItems(items.map((i) => (i.key === key ? { ...i, quantity: val } : i)));
  };

  const handleUnitPriceChange = (key, val) => {
    setItems(items.map((i) => (i.key === key ? { ...i, unitPrice: val } : i)));
  };

  const totalGoodsAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.error('Vui lòng chọn ít nhất 1 sản phẩm nhập kho.');
        return;
      }
      setLoading(true);

      const dto = {
        branchId: branchId,
        businessDate: values.businessDate.toISOString(),
        details: items.map((i) => ({
          bInventoryId: i.bInventoryId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          note: i.note || ''
        })),
        partners: [
          {
            partnerId: values.supplierId,
            cost: totalGoodsAmount,
            note: 'Thanh toán tiền hàng NCC'
          }
        ]
      };

      if (values.extraCost > 0 && values.transporterId) {
        dto.partners.push({
          partnerId: values.transporterId,
          cost: values.extraCost,
          note: 'Phí vận chuyển'
        });
      }

      await createImportDocument(dto);
      message.success('Tạo phiếu nhập kho thành công!');
      form.resetFields();
      setItems([]);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tạo phiếu nhập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Space><ImportOutlined style={{ color: '#52c41a' }} /> TẠO PHIẾU NHẬP KHO (IMPORT)</Space>}
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="back" onClick={onClose}>Hủy</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit} icon={<ImportOutlined />}>
          Lưu Phiếu Nhập
        </Button>
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ businessDate: dayjs(), extraCost: 0 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="businessDate" label="Ngày chứng từ (Business Date)" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: 'Vui lòng chọn NCC' }]}>
              <Select placeholder="Chọn Nhà cung cấp" showSearch optionFilterProp="children">
                {partners.filter(p => p.type === 'Supplier' || p.type === 1).map(p => (
                  <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="transporterId" label="Đơn vị vận chuyển (Chi phí phụ)">
              <Select placeholder="Chọn đơn vị vận chuyển (Option)" allowClear>
                {partners.map(p => (
                  <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="extraCost" label="Phí vận chuyển / Chi phí khác (VNĐ)">
              <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\,/g, '')} min={0} />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }}>DANH SÁCH MẶT HÀNG NHẬP KHO</Divider>

        <Select
          showSearch
          placeholder="➕ Chọn mặt hàng nhập kho (Chỉ nhập Tool, Regular, Ingredient)..."
          style={{ width: '100%', marginBottom: 12 }}
          onSelect={handleAddItem}
          value={null}
          optionFilterProp="children"
        >
          {allowedProducts.map((p) => (
            <Select.Option key={p.id} value={p.id}>
              [{p.code}] {p.name} - Loại: <Tag color="blue">{p.type}</Tag>
            </Select.Option>
          ))}
        </Select>

        <Table
          dataSource={items}
          rowKey="key"
          pagination={false}
          size="small"
          columns={[
            { title: 'Tên hàng', dataIndex: 'productName' },
            { title: 'ĐVT', dataIndex: 'unitName', width: 80 },
            {
              title: 'Số lượng',
              width: 120,
              render: (_, record) => (
                <InputNumber
                  min={0.001}
                  value={record.quantity}
                  onChange={(val) => handleQuantityChange(record.key, val)}
                  style={{ width: '100%' }}
                />
              )
            },
            {
              title: 'Đơn giá (VNĐ)',
              width: 150,
              render: (_, record) => (
                <InputNumber
                  min={0}
                  value={record.unitPrice}
                  onChange={(val) => handleUnitPriceChange(record.key, val)}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => v.replace(/\,/g, '')}
                  style={{ width: '100%' }}
                />
              )
            },
            {
              title: 'Thành tiền',
              width: 140,
              render: (_, record) => <b>{(record.quantity * record.unitPrice).toLocaleString()} đ</b>
            },
            {
              title: '',
              width: 50,
              render: (_, record) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(record.key)} />
              )
            }
          ]}
        />

        <div style={{ textAlign: 'right', marginTop: 16, fontSize: 16 }}>
          <b>Tổng tiền hàng: <span style={{ color: '#1677ff' }}>{totalGoodsAmount.toLocaleString()} VNĐ</span></b>
        </div>
      </Form>
    </Modal>
  );
};

// ==========================================
// 2. EXPORT DELETE MODAL (Xuất hủy)
// ==========================================
export const ExportModal = ({ open, onClose, onSuccess, branchId, products = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // Không cho xuất hủy Processed
  const allowedProducts = products.filter((p) => p.type !== 'Processed');

  const handleAddItem = (productId) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    if (items.some((i) => i.productId === productId)) return;
    setItems([
      ...items,
      {
        key: prod.id,
        productId: prod.id,
        productName: prod.name,
        code: prod.code,
        bInventoryId: prod.binventoryId || prod.id,
        quantity: 1,
        note: ''
      }
    ]);
  };

  const handleRemoveItem = (key) => setItems(items.filter((i) => i.key !== key));

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.error('Vui lòng chọn sản phẩm xuất hủy.');
        return;
      }
      setLoading(true);

      const dto = {
        branchId: branchId,
        businessDate: values.businessDate.toISOString(),
        details: items.map((i) => ({
          bInventoryId: i.bInventoryId,
          quantity: i.quantity,
          note: i.note || 'Xuất hủy sản phẩm hỏng/hết hạn'
        }))
      };

      await createExportDeleteDocument(dto);
      message.success('Tạo phiếu xuất hủy thành công!');
      form.resetFields();
      setItems([]);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi xuất hủy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Space><ExportOutlined style={{ color: '#ff4d4f' }} /> TẠO PHIẾU XUẤT HỦY (EXPORT DELETE)</Space>}
      open={open}
      onCancel={onClose}
      width={750}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" initialValues={{ businessDate: dayjs() }}>
        <Form.Item name="businessDate" label="Ngày chứng từ" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />
        </Form.Item>

        <Select
          showSearch
          placeholder="➕ Chọn mặt hàng xuất hủy (Tool, Regular, Manufactured, Ingredient)..."
          style={{ width: '100%', marginBottom: 12 }}
          onSelect={handleAddItem}
          value={null}
        >
          {allowedProducts.map((p) => (
            <Select.Option key={p.id} value={p.id}>[{p.code}] {p.name}</Select.Option>
          ))}
        </Select>

        <Table
          dataSource={items}
          rowKey="key"
          pagination={false}
          size="small"
          columns={[
            { title: 'Tên hàng', dataIndex: 'productName' },
            {
              title: 'Số lượng xuất',
              width: 140,
              render: (_, record) => (
                <InputNumber
                  min={0.001}
                  value={record.quantity}
                  onChange={(v) => setItems(items.map((i) => (i.key === record.key ? { ...i, quantity: v } : i)))}
                />
              )
            },
            {
              title: 'Ghi chú',
              render: (_, record) => (
                <Input
                  placeholder="Lý do xuất hủy..."
                  value={record.note}
                  onChange={(e) => setItems(items.map((i) => (i.key === record.key ? { ...i, note: e.target.value } : i)))}
                />
              )
            },
            {
              title: '',
              width: 50,
              render: (_, record) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(record.key)} />
              )
            }
          ]}
        />
      </Form>
    </Modal>
  );
};

// ==========================================
// 3. TRANSFER MODAL (Chuyển kho 2 bước)
// ==========================================
export const TransferModal = ({ open, onClose, onSuccess, fromBranchId, branches = [], products = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const allowedProducts = products.filter((p) => p.type !== 'Processed');

  const handleAddItem = (productId) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || items.some((i) => i.productId === productId)) return;
    setItems([
      ...items,
      {
        key: prod.id,
        productId: prod.id,
        productName: prod.name,
        code: prod.code,
        fromBInventoryId: prod.binventoryId || prod.id,
        toBInventoryId: prod.binventoryId || prod.id,
        quantity: 1
      }
    ]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.error('Vui lòng chọn sản phẩm chuyển kho.');
        return;
      }
      setLoading(true);

      const dto = {
        fromBranchId: fromBranchId,
        toBranchId: values.toBranchId,
        businessDate: values.businessDate.toISOString(),
        note: values.note,
        details: items.map((i) => ({
          fromBInventoryId: i.fromBInventoryId,
          toBInventoryId: i.toBInventoryId,
          quantity: i.quantity
        }))
      };

      await createTransferDocument(dto);
      message.success('Tạo phiếu chuyển kho thành công (Đã treo hàng chờ kho nhận xác nhận)!');
      form.resetFields();
      setItems([]);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tạo phiếu chuyển kho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Space><SwapOutlined style={{ color: '#1677ff' }} /> BƯỚC 1: TẠO PHIẾU CHUYỂN KHO (KHO GỬI)</Space>}
      open={open}
      onCancel={onClose}
      width={750}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" initialValues={{ businessDate: dayjs() }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="toBranchId" label="Chi nhánh Nhận" rules={[{ required: true, message: 'Chọn chi nhánh nhận' }]}>
              <Select placeholder="Chọn Chi nhánh Nhận">
                {branches.filter((b) => b.id !== fromBranchId).map((b) => (
                  <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="businessDate" label="Ngày xuất chuyển" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />
            </Form.Item>
          </Col>
        </Row>

        <Select showSearch placeholder="➕ Chọn sản phẩm chuyển kho..." style={{ width: '100%', marginBottom: 12 }} onSelect={handleAddItem} value={null}>
          {allowedProducts.map((p) => (
            <Select.Option key={p.id} value={p.id}>[{p.code}] {p.name}</Select.Option>
          ))}
        </Select>

        <Table
          dataSource={items}
          rowKey="key"
          pagination={false}
          size="small"
          columns={[
            { title: 'Tên sản phẩm', dataIndex: 'productName' },
            {
              title: 'Số lượng chuyển',
              width: 160,
              render: (_, record) => (
                <InputNumber
                  min={0.001}
                  value={record.quantity}
                  onChange={(v) => setItems(items.map((i) => (i.key === record.key ? { ...i, quantity: v } : i)))}
                />
              )
            },
            {
              title: '',
              width: 50,
              render: (_, record) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setItems(items.filter(i => i.key !== record.key))} />
              )
            }
          ]}
        />
      </Form>
    </Modal>
  );
};

// BƯỚC 2: XÁC NHẬN NHẬN CHUYỂN KHO
export const TransferReceiveModal = ({ open, onClose, onSuccess, transferDoc }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transferDoc) {
      form.setFieldsValue({
        receivedDate: dayjs()
      });
    }
  }, [transferDoc, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const dto = {
        transferDocumentId: transferDoc.id,
        receivedDate: values.receivedDate.toISOString(),
        details: transferDoc.details.map((d) => ({
          toBInventoryId: d.bInventoryId,
          receivedQuantity: d.quantity
        }))
      };

      await receiveTransferDocument(dto);
      message.success('Đã xác nhận nhận kho thành công!');
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi nhận hàng chuyển kho.');
    } finally {
      setLoading(false);
    }
  };

  if (!transferDoc) return null;

  return (
    <Modal
      title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> BƯỚC 2: XÁC NHẬN NHẬN HÀNG CHUYỂN KHO</Space>}
      open={open}
      onCancel={onClose}
      width={650}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Alert
          message={`Phiếu chuyển: ${transferDoc.code} | Ngày gửi: ${dayjs(transferDoc.businessDate).format('DD/MM/YYYY HH:mm')}`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item name="receivedDate" label="Ngày thực nhận (Received Date)" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />
        </Form.Item>

        <Table
          dataSource={transferDoc.details || []}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            { title: 'Tên sản phẩm', dataIndex: ['bInventory', 'product', 'name'], render: (text, r) => text || r.productName || 'Sản phẩm' },
            { title: 'Số lượng gửi', dataIndex: 'quantity' },
            { title: 'Số lượng thực nhận', dataIndex: 'quantity', render: (val) => <Tag color="green"><b>{val}</b></Tag> }
          ]}
        />
      </Form>
    </Modal>
  );
};

// ==========================================
// 4. CHECK MODAL (Kiểm kho - ActualQuantity)
// ==========================================
export const CheckModal = ({ open, onClose, onSuccess, branchId, products = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const allowedProducts = products.filter((p) => p.type !== 'Processed');

  const handleAddItem = (productId) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || items.some((i) => i.productId === productId)) return;
    setItems([
      ...items,
      {
        key: prod.id,
        productId: prod.id,
        productName: prod.name,
        code: prod.code,
        bInventoryId: prod.binventoryId || prod.id,
        actualQuantity: prod.currentStock || 0
      }
    ]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.error('Vui lòng chọn sản phẩm kiểm kho.');
        return;
      }
      setLoading(true);

      const dto = {
        branchId: branchId,
        businessDate: values.businessDate.toISOString(),
        details: items.map((i) => ({
          bInventoryId: i.bInventoryId,
          actualQuantity: i.actualQuantity
        }))
      };

      await createCheckDocument(dto);
      message.success('Tạo phiếu kiểm kho thành công (Số liệu đã chốt mốc thực tế)!');
      form.resetFields();
      setItems([]);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi kiểm kho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Space><AuditOutlined style={{ color: '#fa8c16' }} /> TẠO PHIẾU KIỂM KHO (CHECK / ADJUSTMENT)</Space>}
      open={open}
      onCancel={onClose}
      width={750}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" initialValues={{ businessDate: dayjs() }}>
        <Form.Item name="businessDate" label="Ngày kiểm kê" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />
        </Form.Item>

        <Select showSearch placeholder="➕ Chọn sản phẩm kiểm kê..." style={{ width: '100%', marginBottom: 12 }} onSelect={handleAddItem} value={null}>
          {allowedProducts.map((p) => (
            <Select.Option key={p.id} value={p.id}>[{p.code}] {p.name}</Select.Option>
          ))}
        </Select>

        <Table
          dataSource={items}
          rowKey="key"
          pagination={false}
          size="small"
          columns={[
            { title: 'Tên hàng', dataIndex: 'productName' },
            {
              title: 'Số đếm thực tế (Actual Qty)',
              width: 180,
              render: (_, record) => (
                <InputNumber
                  min={0}
                  value={record.actualQuantity}
                  onChange={(v) => setItems(items.map((i) => (i.key === record.key ? { ...i, actualQuantity: v } : i)))}
                />
              )
            },
            {
              title: '',
              width: 50,
              render: (_, record) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setItems(items.filter(i => i.key !== record.key))} />
              )
            }
          ]}
        />
      </Form>
    </Modal>
  );
};

// ==========================================
// 5. PRODUCTION MODAL (Sản xuất)
// ==========================================
export const ProductionModal = ({ open, onClose, onSuccess, branchId, products = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rawItems, setRawItems] = useState([]);

  // Thành phẩm bắt buộc là Manufactured
  const finishedProducts = products.filter((p) => p.type === 'Manufactured');
  // Nguyên liệu không được là Processed
  const rawProducts = products.filter((p) => p.type !== 'Processed');

  const handleAddRawItem = (productId) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || rawItems.some((i) => i.productId === productId)) return;
    setRawItems([
      ...rawItems,
      {
        key: prod.id,
        productId: prod.id,
        productName: prod.name,
        code: prod.code,
        bInventoryId: prod.binventoryId || prod.id,
        quantity: 1
      }
    ]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (rawItems.length === 0) {
        message.error('Vui lòng chọn ít nhất 1 nguyên vật liệu tiêu hao.');
        return;
      }
      setLoading(true);

      const dto = {
        branchId: branchId,
        businessDate: values.businessDate.toISOString(),
        finishedBInventoryId: values.finishedBInventoryId,
        finishedQuantity: values.finishedQuantity,
        rawMaterials: rawItems.map((r) => ({
          bInventoryId: r.bInventoryId,
          quantity: r.quantity
        }))
      };

      await createProductionDocument(dto);
      message.success('Tạo phiếu sản xuất chế biến thành công!');
      form.resetFields();
      setRawItems([]);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tạo phiếu sản xuất.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Space><BuildOutlined style={{ color: '#722ed1' }} /> TẠO PHIẾU SẢN XUẤT CHẾ BIẾN (PRODUCTION)</Space>}
      open={open}
      onCancel={onClose}
      width={780}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" initialValues={{ businessDate: dayjs(), finishedQuantity: 1 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="businessDate" label="Ngày sản xuất" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="finishedBInventoryId" label="Thành phẩm (Loại Manufactured)" rules={[{ required: true, message: 'Chọn thành phẩm' }]}>
              <Select placeholder="Chọn sản phẩm Manufactured">
                {finishedProducts.map((p) => (
                  <Select.Option key={p.id} value={p.binventoryId || p.id}>[{p.code}] {p.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="finishedQuantity" label="Số lượng Thành phẩm tạo ra" rules={[{ required: true }]}>
          <InputNumber min={0.001} style={{ width: '100%' }} />
        </Form.Item>

        <Divider style={{ margin: '12px 0' }}>DANH SÁCH NGUYÊN VẬT LIỆU TIÊU HAO</Divider>

        <Select showSearch placeholder="➕ Chọn Nguyên vật liệu tiêu hao..." style={{ width: '100%', marginBottom: 12 }} onSelect={handleAddRawItem} value={null}>
          {rawProducts.map((p) => (
            <Select.Option key={p.id} value={p.id}>[{p.code}] {p.name}</Select.Option>
          ))}
        </Select>

        <Table
          dataSource={rawItems}
          rowKey="key"
          pagination={false}
          size="small"
          columns={[
            { title: 'Tên Nguyên vật liệu', dataIndex: 'productName' },
            {
              title: 'Số lượng tiêu hao',
              width: 160,
              render: (_, record) => (
                <InputNumber
                  min={0.001}
                  value={record.quantity}
                  onChange={(v) => setRawItems(rawItems.map((i) => (i.key === record.key ? { ...i, quantity: v } : i)))}
                />
              )
            },
            {
              title: '',
              width: 50,
              render: (_, record) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setRawItems(rawItems.filter(i => i.key !== record.key))} />
              )
            }
          ]}
        />
      </Form>
    </Modal>
  );
};
