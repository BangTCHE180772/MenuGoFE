import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Input,
  DatePicker,
  Radio,
  Button,
  Table,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Tabs,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getLeftoverRecordsByBranch, createLeftoverRecord, deleteLeftoverRecord } from '../api/leftoverApi';
import { getCancelledHistory } from '../api/orderApi';
import { getAllProducts } from '../api/productApi';
import { getAllShifts } from '../api/shiftApi';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

const { Title } = Typography;

const HANDLING_ACTION_LABELS = {
  Discard: 'Huỷ',
  StaffUse: 'Nhân viên dùng',
  Reuse: 'Tái sử dụng',
};

const LeftoverPage = () => {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();
  const branchId = currentBranchId || user?.branchId;

  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);

  const [products, setProducts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState(undefined);

  // ── Lịch sử hủy món (đơn đã hoàn thành vs đơn chờ xác nhận) ──────────
  const [cancelledHistory, setCancelledHistory] = useState([]);
  const [cancelledLoading, setCancelledLoading] = useState(false);
  const [cancelledCategoryFilter, setCancelledCategoryFilter] = useState(undefined);

  const fetchCancelledHistory = useCallback(async () => {
    if (!branchId) return;
    setCancelledLoading(true);
    try {
      const res = await getCancelledHistory(branchId);
      setCancelledHistory(res.data || []);
    } catch {
      message.error('Không thể tải lịch sử hủy món.');
    } finally {
      setCancelledLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchCancelledHistory();
  }, [fetchCancelledHistory]);

  const fetchRecords = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await getLeftoverRecordsByBranch(branchId, filterType ? { type: filterType } : {});
      setRecords(res.data || []);
    } catch {
      message.error('Không thể tải danh sách món thừa.');
    } finally {
      setLoading(false);
    }
  }, [branchId, filterType]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, shiftRes] = await Promise.all([getAllProducts(), getAllShifts()]);
        setProducts(prodRes.data || []);
        setShifts(shiftRes.data || []);
      } catch {
        message.error('Không thể tải danh mục sản phẩm/ca làm việc.');
      }
    })();
  }, []);

  const handleSubmit = async (values) => {
    if (!branchId) {
      message.error('Không xác định được chi nhánh hiện tại.');
      return;
    }
    setSaving(true);
    try {
      await createLeftoverRecord({
        branchId,
        type: values.type,
        productId: values.productId,
        quantity: values.quantity,
        reason: values.reason,
        orderDetailId: values.type === 'Return' ? values.orderDetailId : null,
        handlingAction: values.type === 'Return' ? values.handlingAction : null,
        refundAmount: values.type === 'Return' ? values.refundAmount ?? null : null,
        discountAmount: values.type === 'Return' ? values.discountAmount ?? null : null,
        shiftId: values.shiftId ?? null,
        recordDate: (values.recordDate || dayjs()).format('YYYY-MM-DD'),
      });
      message.success('Đã ghi nhận món thừa');
      form.resetFields();
      form.setFieldsValue({ type: values.type, recordDate: dayjs() });
      fetchRecords();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lỗi khi ghi nhận món thừa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLeftoverRecord(id);
      message.success('Đã xóa bản ghi');
      fetchRecords();
    } catch {
      message.error('Không thể xóa bản ghi.');
    }
  };

  const columns = [
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (t) => (t === 'Return' ? <Tag color="volcano">Khách trả món</Tag> : <Tag color="orange">Bếp làm dư</Tag>),
    },
    { title: 'Món', dataIndex: 'productName', key: 'productName' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', width: 60 },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason' },
    {
      title: 'Bàn / Xử lý',
      key: 'detail',
      render: (_, r) =>
        r.type === 'Return' ? (
          <Space direction="vertical" size={0}>
            {r.tableName && <span>Bàn: {r.tableName}</span>}
            {r.handlingAction && <Tag>{HANDLING_ACTION_LABELS[r.handlingAction] || r.handlingAction}</Tag>}
            {(r.refundAmount || r.discountAmount) && (
              <span style={{ color: '#cf1322', fontSize: 12 }}>
                {r.refundAmount ? `Hoàn: ${r.refundAmount.toLocaleString('vi-VN')}đ` : ''}
                {r.discountAmount ? ` Giảm: ${r.discountAmount.toLocaleString('vi-VN')}đ` : ''}
              </span>
            )}
          </Space>
        ) : (
          <span>{r.shiftName || '—'}</span>
        ),
    },
    { title: 'Ngày', dataIndex: 'recordDate', key: 'recordDate' },
    { title: 'Người ghi', dataIndex: 'createdByName', key: 'createdByName' },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, r) => (
        <Popconfirm title="Xóa bản ghi này?" onConfirm={() => handleDelete(r.id)} okText="Đồng ý" cancelText="Hủy">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const cancelledColumns = [
    {
      title: 'Trạng thái khi huỷ',
      dataIndex: 'category',
      key: 'category',
      render: (c) =>
        c === 'Completed' ? (
          <Tag color="red">Đơn đã hoàn thành (bếp làm chậm)</Tag>
        ) : (
          <Tag color="default">Đơn chờ xác nhận</Tag>
        ),
    },
    { title: 'Món', dataIndex: 'productName', key: 'productName' },
    { title: 'Bàn', dataIndex: 'tableName', key: 'tableName' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', width: 60 },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const filteredCancelledHistory = cancelledCategoryFilter
    ? cancelledHistory.filter((r) => r.category === cancelledCategoryFilter)
    : cancelledHistory;

  const completedCancelCount = cancelledHistory.filter((r) => r.category === 'Completed').length;

  const leftoverTab = (
    <>
      <Card title="Ghi nhận món thừa" style={{ marginBottom: 20, borderRadius: 12 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: 'Return', recordDate: dayjs() }}
        >
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio.Button value="Return">Khách trả món (Return)</Radio.Button>
              <Radio.Button value="Extra">Bếp làm dư (Extra)</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Space style={{ display: 'flex' }} size="large" align="start" wrap>
            <Form.Item name="productId" label="Món" rules={[{ required: true, message: 'Chọn món' }]} style={{ width: 260 }}>
              <Select
                showSearch
                placeholder="Chọn món"
                optionFilterProp="label"
                options={products.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>

            <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: 'Nhập số lượng' }]} style={{ width: 120 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            {type === 'Return' && (
              <Form.Item name="orderDetailId" label="Mã chi tiết đơn (OrderDetailId)" rules={[{ required: true, message: 'Nhập mã chi tiết đơn' }]} style={{ width: 220 }}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Xem trên màn hình đơn hàng" />
              </Form.Item>
            )}

            {type === 'Extra' && (
              <Form.Item name="shiftId" label="Ca làm việc" style={{ width: 200 }}>
                <Select allowClear placeholder="Chọn ca" options={shifts.map((s) => ({ value: s.id, label: s.name }))} />
              </Form.Item>
            )}

            <Form.Item name="recordDate" label="Ngày" style={{ width: 160 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Space>

          {type === 'Return' && (
            <Space style={{ display: 'flex' }} size="large" align="start" wrap>
              <Form.Item name="handlingAction" label="Cách xử lý" rules={[{ required: true, message: 'Chọn cách xử lý' }]} style={{ width: 220 }}>
                <Select
                  placeholder="Chọn cách xử lý"
                  options={[
                    { value: 'Discard', label: 'Huỷ' },
                    { value: 'StaffUse', label: 'Nhân viên dùng' },
                    { value: 'Reuse', label: 'Tái sử dụng (nếu cho phép)' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="refundAmount" label="Số tiền hoàn (nếu có)" style={{ width: 200 }}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
              <Form.Item name="discountAmount" label="Số tiền giảm giá (nếu có)" style={{ width: 200 }}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Space>
          )}

          <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input.TextArea
              rows={2}
              placeholder={type === 'Extra' ? 'VD: làm dư, ước tính sai...' : 'VD: món bị nguội, khách gọi nhầm...'}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} htmlType="submit" loading={saving}>
              Ghi nhận
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="Lịch sử món thừa"
        style={{ borderRadius: 12 }}
        extra={
          <Select
            allowClear
            placeholder="Lọc theo loại"
            style={{ width: 180 }}
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'Return', label: 'Khách trả món' },
              { value: 'Extra', label: 'Bếp làm dư' },
            ]}
          />
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </>
  );

  const cancelledHistoryTab = (
    <Card
      title="Lịch sử hủy món"
      style={{ borderRadius: 12 }}
      extra={
        <Select
          allowClear
          placeholder="Lọc theo trạng thái"
          style={{ width: 220 }}
          value={cancelledCategoryFilter}
          onChange={setCancelledCategoryFilter}
          options={[
            { value: 'Completed', label: 'Đơn đã hoàn thành' },
            { value: 'Pending', label: 'Đơn chờ xác nhận' },
          ]}
        />
      }
    >
      {completedCancelCount > 0 && (
        <div style={{ marginBottom: 12, color: '#cf1322' }}>
          Bếp làm chậm (khách không nhận món đã hoàn thành): <strong>{completedCancelCount}</strong> lần
        </div>
      )}
      <Table
        rowKey="orderDetailId"
        columns={cancelledColumns}
        dataSource={filteredCancelledHistory}
        loading={cancelledLoading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <Title level={3}>Món thừa &amp; Lịch sử hủy món</Title>

      <Tabs
        defaultActiveKey="leftover"
        items={[
          { key: 'leftover', label: 'Món thừa', children: leftoverTab },
          { key: 'cancelled', label: 'Lịch sử hủy món', children: cancelledHistoryTab },
        ]}
      />
    </div>
  );
};

export default LeftoverPage;
