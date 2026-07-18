import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, Select, 
  InputNumber, DatePicker, message, Tag, Switch 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllVouchers, createVoucher, updateVoucher, deleteVoucher } from '../api/voucherApi';
import { getAllBranches } from '../api/branchApi';

const { Option } = Select;
const { RangePicker } = DatePicker;

const VoucherPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchVouchers();
    fetchBranches();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await getAllVouchers();
      setVouchers(data);
    } catch (error) {
      message.error('Lỗi tải danh sách Khuyến mãi');
    }
    setLoading(false);
  };

  const fetchBranches = async () => {
    try {
      const data = await getAllBranches();
      setBranches(data);
    } catch (error) {
      console.error('Lỗi tải chi nhánh:', error);
    }
  };

  const showModal = (record = null) => {
    setEditingVoucher(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        dateRange: [dayjs(record.startDate), dayjs(record.endDate)]
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        discountType: 'Percentage',
        isActive: true,
        quantity: 100,
        minOrderValue: 0
      });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        const payload = {
          ...values,
          startDate: values.dateRange[0].toISOString(),
          endDate: values.dateRange[1].toISOString(),
        };
        delete payload.dateRange;

        if (editingVoucher) {
          await updateVoucher({ ...payload, id: editingVoucher.id });
          message.success('Cập nhật khuyến mãi thành công');
        } else {
          await createVoucher(payload);
          message.success('Thêm khuyến mãi thành công');
        }
        setIsModalVisible(false);
        fetchVouchers();
      } catch (error) {
        message.error(error.response?.data?.message || 'Lỗi xử lý');
      }
    });
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xóa Khuyến mãi',
      content: 'Bạn có chắc chắn muốn xóa khuyến mãi này không?',
      onOk: async () => {
        try {
          await deleteVoucher(id);
          message.success('Xóa thành công');
          fetchVouchers();
        } catch (error) {
          message.error('Xóa thất bại');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Mã Voucher',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Tên CTKM',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Giá trị giảm',
      key: 'discount',
      render: (_, record) => {
        if (record.discountType === 'Fixed') {
          return `${record.discountValue.toLocaleString()} đ`;
        }
        return `${record.discountValue}% (Tối đa ${record.maxDiscount.toLocaleString()} đ)`;
      }
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'minOrderValue',
      render: (val) => `${val.toLocaleString()} đ`
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'branchName',
      render: (val) => val || 'Toàn hệ thống'
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => (
        <span style={{fontSize: 12}}>
          {dayjs(record.startDate).format('DD/MM/YYYY')} - {dayjs(record.endDate).format('DD/MM/YYYY')}
        </span>
      )
    },
    {
      title: 'SL',
      key: 'quantity',
      render: (_, record) => `${record.usedCount} / ${record.quantity}`
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Hoạt động' : 'Đã khóa'}</Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Quản lý Khuyến mãi & Voucher</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Tạo Khuyến mãi mới
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={vouchers} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingVoucher ? 'Cập nhật Khuyến mãi' : 'Tạo Khuyến mãi mới'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã Voucher" rules={[{ required: true, message: 'Vui lòng nhập mã Voucher' }]}>
            <Input placeholder="VD: SUMMER2026" />
          </Form.Item>
          
          <Form.Item name="name" label="Tên Chương trình" rules={[{ required: true, message: 'Vui lòng nhập tên CTKM' }]}>
            <Input placeholder="Khuyến mãi mùa hè" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="discountType" label="Loại giảm giá" style={{ flex: 1 }}>
              <Select>
                <Option value="Percentage">Theo phần trăm (%)</Option>
                <Option value="Fixed">Số tiền cố định (đ)</Option>
              </Select>
            </Form.Item>

            <Form.Item name="discountValue" label="Giá trị giảm" rules={[{ required: true, message: 'Nhập giá trị' }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>

          <Form.Item noStyle dependencies={['discountType']}>
            {({ getFieldValue }) => (
              getFieldValue('discountType') === 'Percentage' ? (
                <Form.Item name="maxDiscount" label="Giảm tối đa (đ)">
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              ) : null
            )}
          </Form.Item>

          <Form.Item name="minOrderValue" label="Đơn hàng tối thiểu (đ)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Form.Item name="branchId" label="Chi nhánh áp dụng (Để trống = Toàn hệ thống)">
            <Select allowClear placeholder="Chọn chi nhánh">
              {branches.map(b => (
                <Option key={b.id} value={b.id}>{b.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="Thời gian áp dụng" rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}>
            <RangePicker style={{ width: '100%' }} showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="quantity" label="Số lượng phát hành" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>

            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default VoucherPage;
