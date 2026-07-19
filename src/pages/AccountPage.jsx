import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Avatar,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getRoleRange,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../api/accountApi';
import { useAuth } from '../context/AuthContext';

const GENDER_OPTIONS = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
  { value: 'Khác', label: 'Khác' },
];

const ROLES_MAP = {
  3: { label: 'Quản lý', color: 'purple' },
  4: { label: 'Thu ngân', color: 'blue' },
  5: { label: 'Bếp trưởng', color: 'orange' },
  6: { label: 'Phục vụ', color: 'green' },
};

const AccountPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [editingRecord, setEditingRecord] = useState(null);

  const [form] = Form.useForm();

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRoleRange();
      setAccounts(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách nhân viên!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal
  const handleOpenModal = (type, record = null) => {
    setModalType(type);
    setEditingRecord(record);
    setIsModalOpen(true);

    if (type === 'edit' && record) {
      form.setFieldsValue({
        name: record.name,
        email: record.email,
        phone: record.phone,
        gender: record.gender || undefined,
        dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
        citizenIdCode: record.citizenIdCode,
        avatarImage: record.avatarImage,
        isActive: record.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
        gender: 'Nam',
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // Submit handler
  const handleSubmit = async (values) => {
    try {
      const dataPayload = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
      };

      if (modalType === 'create') {
        const payload = {
          ...dataPayload,
          createdBy: user?.id || 1,
        };
        await createAccount(payload);
        message.success('Thêm mới nhân viên thành công!');
      } else {
        const payload = {
          ...dataPayload,
          id: editingRecord.id,
        };
        // Remove password field on update (API doesn't accept it)
        delete payload.password;
        await updateAccount(payload);
        message.success('Cập nhật nhân viên thành công!');
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin nhân viên!';
      message.error(errorMsg);
    }
  };

  // Delete handler
  const handleDelete = async (id) => {
    try {
      await deleteAccount(id);
      message.success('Xóa nhân viên thành công!');
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi xóa nhân viên!';
      message.error(errorMsg);
    }
  };

  // Filter
  const filteredAccounts = accounts.filter((a) => {
    const search = searchText.toLowerCase();
    const matchText =
      (a.name || '').toLowerCase().includes(search) ||
      (a.email || '').toLowerCase().includes(search) ||
      (a.phone || '').toLowerCase().includes(search) ||
      (a.citizenIdCode || '').toLowerCase().includes(search);
    if (!matchText) return false;
    if (selectedRole && !(a.roleIds || []).includes(selectedRole)) return false;
    return true;
  });

  // Columns
  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Nhân viên',
      key: 'employee',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={38}
            src={record.avatarImage || undefined}
            icon={!record.avatarImage ? <UserOutlined /> : undefined}
            style={{
              backgroundColor: record.avatarImage ? undefined : '#e8442a',
              flexShrink: 0,
            }}
          />
          <div>
            <strong style={{ color: '#e8442a' }}>{record.name}</strong>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>ID: {record.id}</div>
          </div>
        </div>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <span>
          <MailOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
          {email}
        </span>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <span>
          <PhoneOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
          {phone}
        </span>
      ),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
      align: 'center',
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (val) => val ? dayjs(val).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'CCCD',
      dataIndex: 'citizenIdCode',
      key: 'citizenIdCode',
      render: (val) => val || '—',
    },
    {
      title: 'Vai trò',
      dataIndex: 'roleIds',
      key: 'roleIds',
      render: (roleIds) => (
        <Space size={4} wrap>
          {(roleIds || []).map((rid) => {
            const info = ROLES_MAP[rid] || { label: `Role #${rid}`, color: 'default' };
            return <Tag key={rid} color={info.color}>{info.label}</Tag>;
          })}
          {(!roleIds || roleIds.length === 0) && <span style={{ color: '#bfbfbf' }}>—</span>}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      align: 'center',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Hoạt động' : 'Vô hiệu'}
        </Tag>
      ),
    },
    {
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
          <Tooltip title="Xóa nhân viên">
            <Popconfirm
              title="Bạn chắc chắn muốn xóa nhân viên này?"
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
    },
  ];

  return (
    <div className="accounts-page animate-fade-in" style={{ padding: '4px 0' }}>
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
              <TeamOutlined />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#e8442a', fontWeight: 700 }}>
                Quản Lý Nhân Sự
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                Quản lý thông tin tài khoản, trạng thái và vai trò của nhân viên
              </p>
            </div>
          </div>

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
            Thêm nhân viên mới
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Tìm kiếm theo tên, email, SĐT, CCCD..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400, borderRadius: '8px' }}
          />
          <Select
            placeholder="Lọc theo vai trò"
            style={{ width: 180 }}
            allowClear
            value={selectedRole}
            onChange={(val) => setSelectedRole(val)}
          >
            {Object.entries(ROLES_MAP).map(([id, info]) => (
              <Select.Option key={id} value={Number(id)}>
                {info.label}
              </Select.Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredAccounts}
          rowKey="id"
          loading={loading}
          pagination={{ defaultPageSize: 10, pageSizeOptions: ['5', '10', '25'], showSizeChanger: true }}
          scroll={{ x: 1200 }}
          bordered
        />
      </Card>

      {/* Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#e8442a' }}>
            <TeamOutlined />
            <span>{modalType === 'create' ? 'THÊM NHÂN VIÊN MỚI' : 'CẬP NHẬT THÔNG TIN NHÂN VIÊN'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        width={720}
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
          style: { borderRadius: '6px' },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          {/* Row 1: Name & Email */}
          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="name"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              style={{ width: 330 }}
            >
              <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên..." />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
              style={{ width: 330 }}
            >
              <Input prefix={<MailOutlined />} placeholder="Nhập email..." />
            </Form.Item>
          </Space>

          {/* Row 2: Phone & Password */}
          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              style={{ width: 330 }}
            >
              <Input prefix={<PhoneOutlined />} placeholder="Nhập SĐT..." />
            </Form.Item>

            {modalType === 'create' && (
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                style={{ width: 330 }}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu..." />
              </Form.Item>
            )}

            {modalType === 'edit' && (
              <Form.Item
                name="isActive"
                label="Trạng thái hoạt động"
                valuePropName="checked"
                style={{ width: 330 }}
              >
                <Switch
                  checkedChildren="Hoạt động"
                  unCheckedChildren="Vô hiệu"
                />
              </Form.Item>
            )}
          </Space>

          {/* Row 3: Gender & Date of Birth */}
          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="gender"
              label="Giới tính"
              style={{ width: 330 }}
            >
              <Select placeholder="Chọn giới tính...">
                {GENDER_OPTIONS.map((g) => (
                  <Select.Option key={g.value} value={g.value}>
                    {g.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="dateOfBirth"
              label="Ngày sinh"
              style={{ width: 330 }}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
            </Form.Item>
          </Space>

          {/* Row 4: CCCD & Avatar */}
          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="citizenIdCode"
              label="Số CMND/CCCD"
              style={{ width: 330 }}
            >
              <Input placeholder="Nhập số CMND/CCCD..." />
            </Form.Item>

            <Form.Item
              name="avatarImage"
              label="Link ảnh đại diện"
              style={{ width: 330 }}
            >
              <Input placeholder="Nhập URL ảnh đại diện..." />
            </Form.Item>
          </Space>

          {/* Switch for Create mode */}
          {modalType === 'create' && (
            <Form.Item
              name="isActive"
              label="Trạng thái hoạt động"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Hoạt động"
                unCheckedChildren="Vô hiệu"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AccountPage;
