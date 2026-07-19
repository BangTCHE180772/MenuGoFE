import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Switch,
  TimePicker,
  Badge,
  Tabs,
  Divider,
  Calendar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  SolutionOutlined,
  ReloadOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAllWorkSchedules,
  createWorkSchedule,
  updateWorkSchedule,
  deleteWorkSchedule,
  assignWorkSchedules,
} from '../api/workScheduleApi';
import { getAllBranches } from '../api/branchApi';
import { getRoleRange } from '../api/accountApi';
import { getAllShifts } from '../api/shiftApi';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ thực hiện (Pending)', color: 'warning' },
  { value: 'APPROVED', label: 'Đã duyệt (Approved)', color: 'processing' },
  { value: 'COMPLETED', label: 'Hoàn thành (Completed)', color: 'success' },
  { value: 'ABSENT', label: 'Vắng mặt (Absent)', color: 'error' },
];

const WorkSchedulePage = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering states
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchDate, setSearchDate] = useState(null);

  // Modal states - Single Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // Modal states - Bulk Assign
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkForm] = Form.useForm();

  // Active view tab
  const [activeTab, setActiveTab] = useState('table');

  // Load all lists
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesRes, branchesRes, accountsRes, shiftsRes] = await Promise.all([
        getAllWorkSchedules(),
        getAllBranches(),
        getRoleRange(),
        getAllShifts(),
      ]);
      setSchedules(schedulesRes.data || []);
      setBranches(branchesRes.data || []);
      setAccounts(accountsRes.data || []);
      setShifts(shiftsRes.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải dữ liệu lịch làm việc / chi nhánh / nhân viên / ca trực!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper mappings
  const getAccountName = (id) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? acc.name : `Nhân viên #${id}`;
  };

  const getBranchName = (id) => {
    const br = branches.find((b) => b.id === id);
    return br ? br.name : `Chi nhánh #${id}`;
  };

  const getShiftDetails = (id) => {
    const sh = shifts.find((s) => s.id === id);
    if (!sh) return { name: `Ca #${id}`, time: '' };
    // StartTime / EndTime formatted as HH:mm
    const start = sh.startTime ? sh.startTime.substring(0, 5) : '--:--';
    const end = sh.endTime ? sh.endTime.substring(0, 5) : '--:--';
    return { name: sh.name, time: `${start} - ${end}` };
  };

  // Open Modal logic - Single Add/Edit
  const handleOpenModal = (type, record = null) => {
    setModalType(type);
    setEditingRecord(record);
    setIsModalOpen(true);

    if (type === 'edit' && record) {
      // Parse inputs
      const checkInVal = record.checkInAt ? dayjs(record.checkInAt) : null;
      const checkOutVal = record.checkOutAt ? dayjs(record.checkOutAt) : null;
      
      form.setFieldsValue({
        accountId: record.accountId,
        branchId: record.branchId,
        shiftId: record.shiftId,
        code: record.code,
        workDate: record.workDate ? dayjs(record.workDate) : null,
        checkInTime: checkInVal,
        checkOutTime: checkOutVal,
        actualHours: record.actualHours,
        status: record.status,
        managerApproved: record.managerApproved,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'PENDING',
        managerApproved: true,
        workDate: dayjs(),
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // Submit Handler - Single
  const handleSubmit = async (values) => {
    try {
      const workDateStr = values.workDate.format('YYYY-MM-DD');
      
      // Combine date and time
      let checkInAt = null;
      if (values.checkInTime) {
        checkInAt = dayjs(`${workDateStr} ${values.checkInTime.format('HH:mm:ss')}`).format('YYYY-MM-DDTHH:mm:ss');
      }

      let checkOutAt = null;
      if (values.checkOutTime) {
        checkOutAt = dayjs(`${workDateStr} ${values.checkOutTime.format('HH:mm:ss')}`).format('YYYY-MM-DDTHH:mm:ss');
      }

      // Validations
      if (checkInAt && checkOutAt && dayjs(checkOutAt).isBefore(dayjs(checkInAt))) {
        message.error('Giờ check-out không thể trước giờ check-in!');
        return;
      }

      const payload = {
        accountId: values.accountId,
        branchId: values.branchId,
        shiftId: values.shiftId,
        code: values.code || '',
        workDate: workDateStr,
        checkInAt,
        checkOutAt,
        actualHours: values.actualHours,
        status: values.status,
        managerApproved: values.managerApproved,
      };

      if (modalType === 'create') {
        const createPayload = {
          ...payload,
          createdBy: user?.id || 1,
        };
        await createWorkSchedule(createPayload);
        message.success('Tạo lịch làm việc thành công!');
      } else {
        const updatePayload = {
          ...payload,
          id: editingRecord.id,
        };
        await updateWorkSchedule(updatePayload);
        message.success('Cập nhật lịch làm việc thành công!');
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu lịch làm việc!';
      message.error(errorMsg);
    }
  };

  // Quick Inline Approve Switch
  const handleToggleApprove = async (record, checked) => {
    try {
      const updatePayload = {
        id: record.id,
        accountId: record.accountId,
        branchId: record.branchId,
        shiftId: record.shiftId,
        code: record.code,
        workDate: record.workDate,
        checkInAt: record.checkInAt,
        checkOutAt: record.checkOutAt,
        actualHours: record.actualHours,
        status: checked ? 'APPROVED' : record.status === 'APPROVED' ? 'PENDING' : record.status,
        managerApproved: checked,
      };
      await updateWorkSchedule(updatePayload);
      message.success(checked ? 'Đã phê duyệt ca trực!' : 'Đã hủy phê duyệt ca trực!');
      loadData();
    } catch (err) {
      console.error(err);
      message.error('Không thể thay đổi trạng thái phê duyệt!');
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    try {
      await deleteWorkSchedule(id);
      message.success('Xóa lịch làm việc thành công!');
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi xóa lịch làm việc!';
      message.error(errorMsg);
    }
  };

  // Submit Handler - Bulk Assign
  const handleBulkAssignSubmit = async (values) => {
    try {
      const { accountIds, branchId, shiftId, dateRange } = values;
      if (!dateRange || dateRange.length < 2) {
        message.error('Vui lòng chọn khoảng ngày phân ca!');
        return;
      }

      const start = dateRange[0];
      const end = dateRange[1];
      const workDates = [];
      let current = dayjs(start);
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        workDates.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
      }

      const payload = {
        accountIds,
        branchId,
        shiftId,
        workDates,
        createdBy: user?.id || 1,
      };

      const res = await assignWorkSchedules(payload);
      const assignedCount = res.data?.length || 0;
      message.success(`Đã phân ca thành công: tạo mới ${assignedCount} lịch làm việc!`);
      
      setIsBulkModalOpen(false);
      bulkForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi phân ca hàng loạt!';
      message.error(errorMsg);
    }
  };

  // Filter schedules
  const filteredSchedules = schedules.filter((item) => {
    if (selectedAccount && item.accountId !== selectedAccount) return false;
    if (selectedApprovalStatus !== null && item.managerApproved !== selectedApprovalStatus) return false;
    if (selectedShift && item.shiftId !== selectedShift) return false;
    if (selectedStatus && item.status !== selectedStatus) return false;
    if (searchDate) {
      const itemDate = dayjs(item.workDate).format('YYYY-MM-DD');
      const filterDate = dayjs(searchDate).format('YYYY-MM-DD');
      if (itemDate !== filterDate) return false;
    }
    return true;
  });

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedAccount(null);
    setSelectedApprovalStatus(null);
    setSelectedShift(null);
    setSelectedStatus(null);
    setSearchDate(null);
    message.info('Đã xóa tất cả bộ lọc');
  };

  // Columns for Table
  const columns = [
    {
      title: 'Mã lịch',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{code}</span>,
      width: 140,
    },
    {
      title: 'Nhân viên',
      dataIndex: 'accountId',
      key: 'accountId',
      render: (id) => (
        <div>
          <strong style={{ color: '#e8442a' }}>{getAccountName(id)}</strong>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>ID: {id}</div>
        </div>
      ),
      sorter: (a, b) => getAccountName(a.accountId).localeCompare(getAccountName(b.accountId)),
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'branchId',
      key: 'branchId',
      render: (id) => getBranchName(id),
    },
    {
      title: 'Ca trực',
      dataIndex: 'shiftId',
      key: 'shiftId',
      render: (id) => {
        const info = getShiftDetails(id);
        return (
          <div>
            <strong>{info.name}</strong>
            <div style={{ fontSize: '11px', color: '#1890ff' }}>
              <ClockCircleOutlined /> {info.time}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ngày làm việc',
      dataIndex: 'workDate',
      key: 'workDate',
      render: (val) => dayjs(val).format('DD/MM/YYYY dddd'),
      sorter: (a, b) => dayjs(a.workDate).unix() - dayjs(b.workDate).unix(),
    },
    {
      title: 'Thời gian thực tế',
      key: 'actualTime',
      render: (_, record) => {
        const inTime = record.checkInAt ? dayjs(record.checkInAt).format('HH:mm') : '--';
        const outTime = record.checkOutAt ? dayjs(record.checkOutAt).format('HH:mm') : '--';
        return (
          <div>
            <div>In: {inTime} - Out: {outTime}</div>
            {record.actualHours !== null && (
              <div style={{ fontSize: '11px', color: '#52c41a' }}>
                Tổng giờ: {record.actualHours} giờ
              </div>
            )}
          </div>
        );
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
      title: 'Quản lý duyệt',
      key: 'approved',
      align: 'center',
      render: (_, record) => (
        <Tooltip title={record.managerApproved ? 'Đã phê duyệt - Click để hủy' : 'Chưa phê duyệt - Click để phê duyệt'}>
          <Switch
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<CloseCircleOutlined />}
            checked={record.managerApproved}
            onChange={(checked) => handleToggleApprove(record, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 110,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa ca trực">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleOpenModal('edit', record)}
            />
          </Tooltip>
          <Tooltip title="Xóa lịch làm việc">
            <Popconfirm
              title="Bạn chắc chắn muốn xóa lịch làm việc này?"
              okText="Đồng ý"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Calendar render helper
  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const daySchedules = schedules.filter((item) => item.workDate === dateStr);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, overflow: 'hidden' }}>
        {daySchedules.slice(0, 3).map((item) => {
          const shiftInfo = getShiftDetails(item.shiftId);
          const name = getAccountName(item.accountId);
          return (
            <li key={item.id} style={{ margin: '1px 0', padding: '1px 3px', borderRadius: '3px', background: '#fff2e8', borderLeft: '3px solid #ff7a45', fontSize: '11px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              <Badge status={item.managerApproved ? 'success' : 'warning'} text={<strong>{shiftInfo.name}:</strong>} /> {name}
            </li>
          );
        })}
        {daySchedules.length > 3 && (
          <li style={{ fontSize: '11px', color: '#ff7a45', fontWeight: 'bold' }}>
            + {daySchedules.length - 3} nhân viên khác...
          </li>
        )}
      </ul>
    );
  };

  return (
    <div className="work-schedule-page animate-fade-in" style={{ padding: '0px 0' }}>
      {/* Page Header */}
      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #fffbfb 0%, #fff7f6 100%)',
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
              <CalendarOutlined />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#e8442a', fontWeight: 700 }}>
                Quản Lý Phân Ca & Lịch Làm Việc
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                Thiết lập ca trực, duyệt giờ công thực tế và phân lịch làm việc cho từng nhân viên theo chi nhánh
              </p>
            </div>
          </div>

          <Space size="middle">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadData();
                message.success('Đã làm mới dữ liệu!');
              }}
            >
              Làm mới
            </Button>
            <Button
              type="default"
              icon={<TeamOutlined />}
              size="large"
              style={{
                borderRadius: '8px',
                borderColor: '#e8442a',
                color: '#e8442a',
              }}
              onClick={() => setIsBulkModalOpen(true)}
            >
              Phân ca hàng loạt
            </Button>
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
              Thêm ca trực lẻ
            </Button>
          </Space>
        </div>
      </Card>

      {/* Main Container Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        items={[
          {
            key: 'table',
            label: (
              <span>
                <SolutionOutlined /> Danh sách lịch trực
              </span>
            ),
            children: (
              <>
                {/* Advanced Search & Filtering Box */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                  <Select
                    placeholder="Lọc nhân viên"
                    style={{ width: 180 }}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    value={selectedAccount}
                    onChange={(val) => setSelectedAccount(val)}
                  >
                    {accounts.map((a) => (
                      <Select.Option key={a.id} value={a.id} label={a.name}>
                        {a.name}
                      </Select.Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Lọc trạng thái duyệt"
                    style={{ width: 180 }}
                    allowClear
                    value={selectedApprovalStatus}
                    onChange={(val) => setSelectedApprovalStatus(val)}
                  >
                    <Select.Option value={true}>Đã duyệt</Select.Option>
                    <Select.Option value={false}>Chưa duyệt</Select.Option>
                  </Select>

                  <Select
                    placeholder="Lọc ca làm việc"
                    style={{ width: 180 }}
                    allowClear
                    value={selectedShift}
                    onChange={(val) => setSelectedShift(val)}
                  >
                    {shifts.map((s) => (
                      <Select.Option key={s.id} value={s.id}>
                        {s.name} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)})
                      </Select.Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Lọc trạng thái"
                    style={{ width: 180 }}
                    allowClear
                    value={selectedStatus}
                    onChange={(val) => setSelectedStatus(val)}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <Select.Option key={st.value} value={st.value}>
                        {st.label}
                      </Select.Option>
                    ))}
                  </Select>

                  <DatePicker
                    placeholder="Lọc ngày cụ thể"
                    style={{ width: 160 }}
                    value={searchDate}
                    onChange={(date) => setSearchDate(date)}
                    format="DD/MM/YYYY"
                  />

                  {(selectedAccount || selectedApprovalStatus !== null || selectedShift || selectedStatus || searchDate) && (
                    <Button type="link" danger onClick={handleResetFilters} icon={<CloseCircleOutlined />}>
                      Xóa lọc
                    </Button>
                  )}
                </div>

                {/* Table View */}
                <Table
                  columns={columns}
                  dataSource={filteredSchedules}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 12 }}
                  scroll={{ x: 1100 }}
                  bordered
                />
              </>
            ),
          },
          {
            key: 'calendar',
            label: (
              <span>
                <CalendarOutlined /> Lịch trực quan (Lịch tháng)
              </span>
            ),
            children: (
              <div style={{ padding: '8px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                <div style={{ marginBottom: 12, display: 'flex', gap: 16 }}>
                  <span><Badge status="success" /> Đã phê duyệt</span>
                  <span><Badge status="warning" /> Chờ phê duyệt</span>
                </div>
                <Calendar cellRender={dateCellRender} />
              </div>
            ),
          },
        ]}
      />

      {/* SINGLE Create / Edit Modal Form */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#e8442a' }}>
            <CalendarOutlined />
            <span>{modalType === 'create' ? 'TẠO MỚI LỊCH PHÂN CA' : 'CHỈNH SỬA CA LÀM VIỆC'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        width={680}
        okText={modalType === 'create' ? 'Tạo ca' : 'Cập nhật'}
        cancelText="Hủy bỏ"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #e8442a, #ff8c42)',
            border: 'none',
            borderRadius: '6px',
          },
        }}
        cancelButtonProps={{ style: { borderRadius: '6px' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          {/* Row 1: Employee & Branch */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="accountId"
              label="Nhân viên"
              rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Chọn nhân viên..." showSearch optionFilterProp="label">
                {accounts.map((a) => (
                  <Select.Option key={a.id} value={a.id} label={a.name}>
                    {a.name} (ID: {a.id})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="branchId"
              label="Chi nhánh làm việc"
              rules={[{ required: true, message: 'Vui lòng chọn chi nhánh!' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Chọn chi nhánh...">
                {branches.map((b) => (
                  <Select.Option key={b.id} value={b.id}>
                    {b.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Row 2: Shift & WorkDate */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="shiftId"
              label="Ca làm việc"
              rules={[{ required: true, message: 'Vui lòng chọn ca!' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Chọn ca trực...">
                {shifts.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="workDate"
              label="Ngày làm việc"
              rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Divider orientation="left" style={{ margin: '12px 0 16px 0', fontSize: '14px', color: '#8c8c8c' }}>
            Thời gian Check-in / Out thực tế (Tùy chọn)
          </Divider>

          {/* Row 3: Checkin & Checkout */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="checkInTime" label="Giờ Check-in" style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Chọn giờ vào" />
            </Form.Item>

            <Form.Item name="checkOutTime" label="Giờ Check-out" style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Chọn giờ ra" />
            </Form.Item>
          </div>

          {/* Row 4: Actual Hours & Status */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="actualHours" label="Tổng giờ làm việc thực tế" style={{ flex: 1 }}>
              <InputNumber min={0} max={24} step={0.5} style={{ width: '100%' }} placeholder="Nhập số giờ" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Đổi trạng thái...">
                {STATUS_OPTIONS.map((st) => (
                  <Select.Option key={st.value} value={st.value}>
                    {st.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Code (optional/display) */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Form.Item name="code" label="Mã phân ca (Hệ thống tự tạo nếu bỏ trống)" style={{ flex: 1 }}>
              <input className="ant-input" placeholder="Ví dụ: WS-BRANCH-SHIFT-DATE" />
            </Form.Item>

            <Form.Item name="managerApproved" label="Quản lý phê duyệt ngay" valuePropName="checked" style={{ width: 200, marginBottom: 0 }}>
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* BULK Assign Modal Form */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#e8442a' }}>
            <TeamOutlined />
            <span>PHÂN CA HÀNG LOẠT (BULK SHIFT ASSIGNMENT)</span>
          </div>
        }
        open={isBulkModalOpen}
        onCancel={() => {
          setIsBulkModalOpen(false);
          bulkForm.resetFields();
        }}
        onOk={() => bulkForm.submit()}
        width={720}
        okText="Tiến hành lập lịch"
        cancelText="Hủy"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #e8442a, #ff8c42)',
            border: 'none',
            borderRadius: '6px',
          },
        }}
        cancelButtonProps={{ style: { borderRadius: '6px' } }}
      >
        <Form bulkForm={bulkForm} form={bulkForm} layout="vertical" onFinish={handleBulkAssignSubmit} style={{ marginTop: 16 }}>
          {/* Employees picker (multiselect) */}
          <Form.Item
            name="accountIds"
            label="Chọn danh sách nhân viên tham gia ca trực"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một nhân viên!' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn các nhân viên..."
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
            >
              {accounts.map((a) => (
                <Select.Option key={a.id} value={a.id} label={a.name}>
                  {a.name} (ID: {a.id})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="branchId"
              label="Chọn chi nhánh làm việc"
              rules={[{ required: true, message: 'Vui lòng chọn chi nhánh!' }]}
              style={{ flex: 1 }}
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
              name="shiftId"
              label="Chọn ca làm việc"
              rules={[{ required: true, message: 'Vui lòng chọn ca!' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Chọn ca trực...">
                {shifts.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Date range picker */}
          <Form.Item
            name="dateRange"
            label="Chọn thời gian lập lịch (Lập lịch cho toàn bộ các ngày trong khoảng này)"
            rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian!' }]}
          >
            <DatePicker.RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          
          <div style={{ padding: '8px 12px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff', display: 'flex', gap: 8, alignItems: 'center' }}>
            <FileDoneOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            <span style={{ fontSize: '13px', color: '#1890ff' }}>
              <strong>Lưu ý:</strong> Hệ thống sẽ tự động bỏ qua nếu nhân viên đã được phân trong cùng ca và ngày được chọn.
            </span>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkSchedulePage;
