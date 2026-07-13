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
  InputNumber,
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
  FileProtectOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getContracts,
  createContract,
  updateContract,
  deleteContract,
} from '../api/contractApi';
import { getAllBranches } from '../api/branchApi';
import { getRoleRange } from '../api/accountApi';
import { useAuth } from '../context/AuthContext';

const CONTRACT_TYPES = [
  { value: 'Full-time', label: 'Toàn thời gian (Full-time)' },
  { value: 'Part-time', label: 'Bán thời gian (Part-time)' },
  { value: 'Seasonal', label: 'Thời vụ (Seasonal)' },
];

const SALARY_TYPES = [
  { value: 'Fixed', label: 'Lương cố định (Fixed)' },
  { value: 'Hourly', label: 'Lương theo giờ (Hourly)' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Hiệu lực (Active)', color: 'success' },
  { value: 'Expired', label: 'Hết hiệu lực (Expired)', color: 'warning' },
  { value: 'Terminated', label: 'Đã chấm dứt (Terminated)', color: 'error' },
];

const ROLES_LIST = [
  { value: 3, label: 'Quản lý (Manager)' },
  { value: 4, label: 'Thu ngân (Cashier)' },
  { value: 5, label: 'Bếp trưởng (Chef)' },
  { value: 6, label: 'Phục vụ (Waiter)' },
];

const ContractPage = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [editingRecord, setEditingRecord] = useState(null);
  
  const [form] = Form.useForm();

  // Load lists
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [contractsRes, branchesRes, accountsRes] = await Promise.all([
        getContracts(),
        getAllBranches(),
        getRoleRange(),
      ]);
      setContracts(contractsRes.data || []);
      setBranches(branchesRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải dữ liệu hợp đồng/chi nhánh/nhân viên!');
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
        accountId: record.accountId,
        roleId: record.roleId,
        branchId: record.branchId,
        type: record.type,
        salaryType: record.salaryType,
        baseSalary: record.baseSalary,
        baseWorkDay: record.baseWorkDay,
        status: record.status,
        note: record.note,
        startDate: record.startDate ? dayjs(record.startDate) : null,
        endDate: record.endDate ? dayjs(record.endDate) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'Active',
        salaryType: 'Fixed',
        type: 'Full-time',
        baseWorkDay: 26,
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
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
      };

      if (modalType === 'create') {
        const payload = {
          ...dataPayload,
          createdBy: user?.id || 1, // Default fallback if no user id
        };
        await createContract(payload);
        message.success('Thêm mới hợp đồng thành công!');
      } else {
        const payload = {
          ...dataPayload,
          id: editingRecord.id,
        };
        await updateContract(payload);
        message.success('Cập nhật hợp đồng thành công!');
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu hợp đồng!';
      message.error(errorMsg);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    try {
      await deleteContract(id);
      message.success('Xóa hợp đồng thành công!');
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi xóa hợp đồng!';
      message.error(errorMsg);
    }
  };

  // Helper mappings
  const getAccountName = (id) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? acc.name : `Nhân viên #${id}`;
  };

  const getBranchName = (id) => {
    const br = branches.find((b) => b.id === id);
    return br ? br.name : `Chi nhánh #${id}`;
  };

  const getRoleName = (id) => {
    const r = ROLES_LIST.find((item) => item.value === id);
    return r ? r.label : `Chức vụ #${id}`;
  };

  // Auto set RoleId based on Account selected (UX enhancement)
  const handleAccountChange = (accountId) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc && acc.roleId) {
      form.setFieldsValue({ roleId: acc.roleId });
    }
  };

  // Filter Table Data
  const filteredContracts = contracts.filter((c) => {
    const accName = getAccountName(c.accountId).toLowerCase();
    const branchName = getBranchName(c.branchId).toLowerCase();
    const typeLabel = c.type?.toLowerCase() || '';
    const noteText = c.note?.toLowerCase() || '';
    const search = searchText.toLowerCase();
    return (
      accName.includes(search) ||
      branchName.includes(search) ||
      typeLabel.includes(search) ||
      noteText.includes(search)
    );
  });

  // Columns definition
  const columns = [
    {
      title: 'Mã HĐ',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Nhân viên',
      dataIndex: 'accountId',
      key: 'accountId',
      render: (id) => (
        <div>
          <strong style={{ color: '#e8442a' }}>{getAccountName(id)}</strong>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>ID: {id}</div>
        </div>
      ),
    },
    {
      title: 'Chức danh',
      dataIndex: 'roleId',
      key: 'roleId',
      render: (id) => getRoleName(id),
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'branchId',
      key: 'branchId',
      render: (id) => getBranchName(id),
    },
    {
      title: 'Loại HĐ',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const found = CONTRACT_TYPES.find((t) => t.value === type);
        return found ? found.label.split(' ')[0] : type;
      },
    },
    {
      title: 'Mức lương cơ bản',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (val) => `${new Intl.NumberFormat('vi-VN').format(val)} đ`,
      sorter: (a, b) => a.baseSalary - b.baseSalary,
    },
    {
      title: 'Ngày công chuẩn',
      dataIndex: 'baseWorkDay',
      key: 'baseWorkDay',
      align: 'center',
    },
    {
      title: 'Thời gian hợp đồng',
      key: 'duration',
      render: (_, record) => {
        const start = record.startDate ? dayjs(record.startDate).format('DD/MM/YYYY') : 'Chưa rõ';
        const end = record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : 'Không thời hạn';
        return `${start} - ${end}`;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const opt = STATUS_OPTIONS.find((s) => s.value === status) || { label: status, color: 'default' };
        return <Tag color={opt.color}>{opt.label}</Tag>;
      },
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
          <Tooltip title="Xóa hợp đồng">
            <Popconfirm
              title="Bạn chắc chắn muốn xóa hợp đồng này?"
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
    <div className="contracts-page animate-fade-in" style={{ padding: '4px 0' }}>
      {/* Header section with styling */}
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
              <FileProtectOutlined />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#e8442a', fontWeight: 700 }}>
                Quản Lý Hợp Đồng Nhân Sự
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                Danh sách, trạng thái và chế độ đãi ngộ trong hợp đồng của các nhân viên
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
            Thêm hợp đồng mới
          </Button>
        </div>
      </Card>

      {/* Filter and Table view */}
      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Tìm kiếm theo tên nhân viên, chi nhánh, loại hợp đồng, ghi chú..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 450, borderRadius: '8px' }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredContracts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          bordered
        />
      </Card>

      {/* Add / Edit Modal Form */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#e8442a' }}>
            <FileProtectOutlined />
            <span>{modalType === 'create' ? 'TẠO MỚI HỢP ĐỒNG LAO ĐỘNG' : 'CẬP NHẬT HỢP ĐỒNG LAO ĐỘNG'}</span>
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
          {/* Row 1: Account Selection & Role Selection */}
          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="accountId"
              label="Nhân viên hợp đồng"
              rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
              style={{ width: 330 }}
            >
              <Select
                placeholder="Chọn nhân viên..."
                showSearch
                optionFilterProp="label"
                onChange={handleAccountChange}
                disabled={modalType === 'edit'}
              >
                {accounts.map((a) => (
                  <Select.Option key={a.id} value={a.id} label={a.name}>
                    {a.name} (Code: {a.id})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="roleId"
              label="Chức danh"
              rules={[{ required: true, message: 'Vui lòng chọn chức danh!' }]}
              style={{ width: 330 }}
            >
              <Select placeholder="Chọn chức danh/vai trò...">
                {ROLES_LIST.map((r) => (
                  <Select.Option key={r.value} value={r.value}>
                    {r.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          {/* Row 2: Branch Selection & Status Selection */}
          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="branchId"
              label="Chi nhánh áp dụng"
              rules={[{ required: true, message: 'Vui lòng chọn chi nhánh!' }]}
              style={{ width: 330 }}
            >
              <Select placeholder="Chọn chi nhánh...">
                {branches.map((b) => (
                  <Select.Option key={b.id} value={b.id}>
                    {b.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái hợp đồng"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
              style={{ width: 330 }}
            >
              <Select placeholder="Chọn trạng thái...">
                {STATUS_OPTIONS.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          {/* Row 3: Contract Type & Salary Type */}
          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="type"
              label="Loại hợp đồng"
              rules={[{ required: true, message: 'Vui lòng chọn loại hợp đồng!' }]}
              style={{ width: 330 }}
            >
              <Select placeholder="Chọn loại hợp đồng...">
                {CONTRACT_TYPES.map((t) => (
                  <Select.Option key={t.value} value={t.value}>
                    {t.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="salaryType"
              label="Hình thức lương"
              rules={[{ required: true, message: 'Vui lòng chọn hình thức lương!' }]}
              style={{ width: 330 }}
            >
              <Select placeholder="Chọn hình thức lương...">
                {SALARY_TYPES.map((st) => (
                  <Select.Option key={st.value} value={st.value}>
                    {st.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          {/* Row 4: Base Salary & Base Work Day */}
          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="baseSalary"
              label="Lương cơ bản (VND)"
              rules={[{ required: true, message: 'Vui lòng nhập lương cơ bản!' }]}
              style={{ width: 330 }}
            >
              <InputNumber
                addonAfter="đ"
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="baseWorkDay"
              label="Số ngày công chuẩn / tháng"
              rules={[{ required: true, message: 'Vui lòng nhập ngày công chuẩn!' }]}
              style={{ width: 330 }}
            >
              <InputNumber style={{ width: '100%' }} min={1} max={31} />
            </Form.Item>
          </Space>

          {/* Row 5: Start Date & End Date */}
          <Space style={{ display: 'flex', width: '100%' }} size="large" align="start">
            <Form.Item
              name="startDate"
              label="Ngày bắt đầu hiệu lực"
              rules={[{ required: true, message: 'Vui lòng chọn ngày hiệu lực!' }]}
              style={{ width: 330 }}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày bắt đầu" />
            </Form.Item>

            <Form.Item
              name="endDate"
              label={
                <span>
                  Ngày hết hạn (Nếu có){' '}
                  <Tooltip title="Bỏ trống nếu là hợp đồng vô thời hạn.">
                    <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                  </Tooltip>
                </span>
              }
              style={{ width: 330 }}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn" />
            </Form.Item>
          </Space>

          {/* Row 6: Note */}
          <Form.Item name="note" label="Ghi chú thêm">
            <Input.TextArea placeholder="Nhập ghi chú chi tiết hoặc thỏa thuận riêng..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractPage;
