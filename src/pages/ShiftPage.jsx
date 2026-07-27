import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Switch,
  TimePicker,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAllShifts,
  createShift,
  updateShift,
  deleteShift,
} from '../api/shiftApi';
import { useAuth } from '../context/AuthContext';

const ShiftPage = () => {
  const { user, role } = useAuth();
  const isOwnerOrAdmin = user?.roleId === 1 || user?.roleId === 2 || ['Owner', 'Admin'].includes(role);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [editingRecord, setEditingRecord] = useState(null);

  const [form] = Form.useForm();

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllShifts();
      setShifts(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải dữ liệu ca làm việc!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Create / Edit Open
  const handleOpenModal = (type, record = null) => {
    setModalType(type);
    setEditingRecord(record);
    setIsModalOpen(true);

    if (type === 'edit' && record) {
      form.setFieldsValue({
        name: record.name,
        startTime: record.startTime ? dayjs(record.startTime, 'HH:mm:ss') : null,
        endTime: record.endTime ? dayjs(record.endTime, 'HH:mm:ss') : null,
        isActive: record.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // Submit Handler
  const handleSubmit = async (values) => {
    try {
      const dataPayload = {
        name: values.name,
        startTime: values.startTime ? values.startTime.format('HH:mm:ss') : null,
        endTime: values.endTime ? values.endTime.format('HH:mm:ss') : null,
        isActive: values.isActive ?? true,
      };

      if (modalType === 'create') {
        const payload = {
          ...dataPayload,
          createdBy: user?.id || 1,
        };
        await createShift(payload);
        message.success('Thêm mới ca làm việc thành công!');
      } else {
        const payload = {
          ...dataPayload,
          id: editingRecord.id,
        };
        await updateShift(payload);
        message.success('Cập nhật ca làm việc thành công!');
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu ca làm việc!';
      message.error(errorMsg);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    try {
      await deleteShift(id);
      message.success('Xóa ca làm việc thành công!');
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi xóa ca làm việc!';
      message.error(errorMsg);
    }
  };

  // Filter
  const filteredShifts = shifts.filter((s) => {
    const search = searchText.toLowerCase();
    const name = s.name?.toLowerCase() || '';
    return name.includes(search);
  });

  // Columns
  const baseColumns = [
    {
      title: 'Mã ca',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Tên ca',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <strong style={{ color: '#e8442a' }}>{name}</strong>
      ),
    },
    {
      title: 'Giờ bắt đầu',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => {
        if (!time) return '—';
        const parsed = dayjs(time, 'HH:mm:ss');
        return parsed.isValid() ? parsed.format('HH:mm') : time;
      },
    },
    {
      title: 'Giờ kết thúc',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time) => {
        if (!time) return '—';
        const parsed = dayjs(time, 'HH:mm:ss');
        return parsed.isValid() ? parsed.format('HH:mm') : time;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '—',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
  ];

  const actionColumn = {
    title: 'Hành động',
    key: 'actions',
    fixed: 'right',
    width: 110,
    render: (_, record) => (
      <Space size="middle">
        <Tooltip title="Chỉnh sửa">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#1890ff' }} />}
            onClick={() => handleOpenModal('edit', record)}
          />
        </Tooltip>
        <Tooltip title="Xóa ca làm việc">
          <Popconfirm
            title="Bạn chắc chắn muốn xóa ca làm việc này?"
            okText="Đồng ý"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Tooltip>
      </Space>
    ),
  };

  const columns = isOwnerOrAdmin ? [...baseColumns, actionColumn] : baseColumns;

  return (
    <div className="shifts-page animate-fade-in" style={{ padding: '4px 0' }}>
      {/* Header */}
      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #fffbfb 0%, #fff6f5 100%)',
          border: '1px solid #ffdeda',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#ffefed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e8442a',
                fontSize: 22,
              }}
            >
              <ClockCircleOutlined />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#e8442a', fontWeight: 700 }}>
                Quản Lý Ca Làm Việc
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                Thiết lập các ca làm việc, thời gian bắt đầu và kết thúc
              </p>
            </div>
          </div>

          {isOwnerOrAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              style={{
                background: 'linear-gradient(135deg, #e8442a, #ff8c42)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(232, 68, 42, 0.25)',
              }}
              onClick={() => handleOpenModal('create')}
            >
              Thêm ca mới
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Tìm kiếm theo tên ca làm việc..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 450, borderRadius: '8px' }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredShifts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          bordered
        />
      </Card>

      {/* Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#e8442a' }}>
            <ClockCircleOutlined />
            <span>{modalType === 'create' ? 'TẠO MỚI CA LÀM VIỆC' : 'CẬP NHẬT CA LÀM VIỆC'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        width={520}
        okText={modalType === 'create' ? 'Tạo mới' : 'Cập nhật'}
        cancelText="Hủy bỏ"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #e8442a, #ff8c42)',
            border: 'none',
            borderRadius: '6px',
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: '6px',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Tên ca làm việc"
            rules={[{ required: true, message: 'Vui lòng nhập tên ca làm việc!' }]}
          >
            <Input placeholder="VD: Ca sáng, Ca chiều, Ca tối..." />
          </Form.Item>

          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="startTime"
              label="Giờ bắt đầu"
              rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu!' }]}
              style={{ width: 220 }}
            >
              <TimePicker
                format="HH:mm"
                style={{ width: '100%' }}
                placeholder="Chọn giờ bắt đầu"
              />
            </Form.Item>

            <Form.Item
              name="endTime"
              label="Giờ kết thúc"
              rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc!' }]}
              style={{ width: 220 }}
            >
              <TimePicker
                format="HH:mm"
                style={{ width: '100%' }}
                placeholder="Chọn giờ kết thúc"
              />
            </Form.Item>
          </Space>

          <Form.Item
            name="isActive"
            label="Trạng thái hoạt động"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Hoạt động"
              unCheckedChildren="Ngừng"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShiftPage;
