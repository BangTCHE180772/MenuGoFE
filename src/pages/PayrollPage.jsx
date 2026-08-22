import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Avatar,
  message,
  Row,
  Col,
  Statistic,
  Descriptions,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DollarCircleOutlined,
  EyeOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  MinusCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BankOutlined,
  ThunderboltOutlined,
  LockOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getPayrolls,
  getPayrollById,
  createPayroll,
  generatePayroll,
  generateBatchPayroll,
  updatePayroll,
  updatePayrollStatus,
  deletePayroll,
  lockPayroll,
  approvePayroll,
} from '../api/payrollApi';
import { getAllBranches } from '../api/branchApi';
import { getRoleRange } from '../api/accountApi';
import { useAuth } from '../context/AuthContext';

// Payroll status definitions
const PAYROLL_STATUS = {
  Draft: 1,
  Pending: 2,
  Approved: 3,
  Paid: 4,
  Cancelled: 5,
  Locked: 6,
};

const STATUS_CONFIG = {
  [PAYROLL_STATUS.Draft]: { label: 'Bản nháp', color: 'default', badge: 'default' },
  [PAYROLL_STATUS.Pending]: { label: 'Chờ duyệt', color: 'warning', badge: 'warning' },
  [PAYROLL_STATUS.Approved]: { label: 'Đã duyệt', color: 'processing', badge: 'processing' },
  [PAYROLL_STATUS.Paid]: { label: 'Đã thanh toán', color: 'success', badge: 'success' },
  [PAYROLL_STATUS.Cancelled]: { label: 'Đã hủy', color: 'error', badge: 'error' },
  [PAYROLL_STATUS.Locked]: { label: 'Đã chốt (Khóa)', color: 'purple', badge: 'purple' },

  Draft: { label: 'Bản nháp', color: 'default', badge: 'default' },
  Pending: { label: 'Chờ duyệt', color: 'warning', badge: 'warning' },
  Approved: { label: 'Đã duyệt', color: 'processing', badge: 'processing' },
  Paid: { label: 'Đã thanh toán', color: 'success', badge: 'success' },
  Cancelled: { label: 'Đã hủy', color: 'error', badge: 'error' },
  Locked: { label: 'Đã chốt (Khóa)', color: 'purple', badge: 'purple' },
};

const STATUS_TO_NUM = {
  Draft: 1,
  Pending: 2,
  Approved: 3,
  Paid: 4,
  Cancelled: 5,
  Locked: 6,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
};

const STATUS_OPTIONS = [
  { value: PAYROLL_STATUS.Draft, label: 'Bản nháp' },
  { value: PAYROLL_STATUS.Paid, label: 'Đã thanh toán' },
  { value: PAYROLL_STATUS.Cancelled, label: 'Đã hủy' },
];

const DETAIL_TYPE_OPTIONS = [
  { value: 'Allowance', label: 'Phụ cấp (+)' },
  { value: 'Bonus', label: 'Tiền thưởng (+)' },
  { value: 'Deduction', label: 'Khấu trừ (-)' },
  { value: 'Penalty', label: 'Tiền phạt (-)' },
];

const ROLES_MAP = {
  3: { label: 'Quản lý', color: 'purple' },
  4: { label: 'Thu ngân', color: 'blue' },
  5: { label: 'Bếp trưởng', color: 'orange' },
  6: { label: 'Phục vụ', color: 'green' },
};

const PayrollPage = () => {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const isOwnerOrAdmin =
    user?.roles?.some((r) => ['Admin', 'Owner', 'ADMIN', 'OWNER', 'Quản trị viên'].includes(r)) ||
    user?.roleIds?.some((id) => id === 1 || id === 2);

  const titleText = isOwnerOrAdmin ? 'Quản Lý Bảng Lương Quản Lý' : 'Quản Lý Bảng Lương Nhân Viên Chi Nhánh';
  const subtitleText = isOwnerOrAdmin
    ? 'Quản lý tính toán, phê duyệt và thanh toán tiền lương của Quản lý các chi nhánh'
    : 'Tính toán, phê duyệt và thanh toán tiền lương cho nhân viên trong chi nhánh';

  const filteredAccounts = accounts.filter((a) => {
    if (!a.roleIds || a.roleIds.length === 0) return false;
    if (isOwnerOrAdmin) {
      return a.roleIds.includes(3); // Owner only manages Manager accounts (roleId 3)
    }
    return !a.roleIds.some((rId) => [1, 2, 3].includes(rId)); // Manager only manages Staff accounts
  });

  // Group accounts by role for cleaner dropdown UX
  const groupedAccounts = useCallback(() => {
    const groups = {
      3: { label: '👑 QUẢN LÝ', items: [] },
      4: { label: '💳 THU NGÂN', items: [] },
      5: { label: '👨‍🍳 BẾP TRƯỞNG', items: [] },
      6: { label: '🤵 PHỤC VỤ', items: [] },
      other: { label: '👤 NHÂN VIÊN KHÁC', items: [] },
    };

    filteredAccounts.forEach((a) => {
      const primaryRoleId = a.roleIds && a.roleIds.length > 0 ? a.roleIds[0] : (a.roleId || 'other');
      if (groups[primaryRoleId]) {
        groups[primaryRoleId].items.push(a);
      } else {
        groups.other.items.push(a);
      }
    });

    return Object.entries(groups).filter(([_, grp]) => grp.items.length > 0);
  }, [filteredAccounts])();

  // Filter States
  const [searchText, setSearchText] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalType, setFormModalType] = useState('create'); // 'create' | 'edit'
  const [editingRecord, setEditingRecord] = useState(null);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetRecord, setStatusTargetRecord] = useState(null);

  const [form] = Form.useForm();
  const [generateForm] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  const currentSalaryType = Form.useWatch('salaryType', form);
  const isHourlyForm = currentSalaryType === 'Hourly' || currentSalaryType === 'Theo giờ' || currentSalaryType === 'TheoGio';

  // Format Currency Utility
  const formatVND = (val) => {
    if (val === undefined || val === null) return '0 đ';
    return `${new Intl.NumberFormat('vi-VN').format(val)} đ`;
  };

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const month = selectedMonthYear ? selectedMonthYear.month() + 1 : null;
      const year = selectedMonthYear ? selectedMonthYear.year() : null;

      const [payrollsRes, branchesRes, accountsRes] = await Promise.all([
        getPayrolls({
          branchId: selectedBranch || undefined,
          month: month || undefined,
          year: year || undefined,
          accountId: selectedAccount || undefined,
        }),
        getAllBranches(),
        getRoleRange(),
      ]);

      setPayrolls(payrollsRes.data || []);
      setBranches(branchesRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải dữ liệu bảng lương!');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedMonthYear, selectedAccount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Statistics
  const stats = useMemo(() => {
    let totalNet = 0;
    let paidCount = 0;
    let paidAmount = 0;
    let pendingCount = 0;
    let draftCount = 0;

    payrolls.forEach((p) => {
      totalNet += p.netSalary || 0;
      if (p.status === PAYROLL_STATUS.Paid) {
        paidCount++;
        paidAmount += p.netSalary || 0;
      } else if (p.status === PAYROLL_STATUS.Pending || p.status === PAYROLL_STATUS.Approved) {
        pendingCount++;
      } else if (p.status === PAYROLL_STATUS.Draft) {
        draftCount++;
      }
    });

    return { totalNet, paidCount, paidAmount, pendingCount, draftCount };
  }, [payrolls]);

  // Helper names
  const getAccountName = (id) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? acc.name : `Nhân viên #${id}`;
  };

  const getBranchName = (id) => {
    const br = branches.find((b) => b.id === id);
    return br ? br.name : `Chi nhánh #${id}`;
  };

  // Filter Table Data
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      if (searchText) {
        const accName = (p.accountName || getAccountName(p.accountId)).toLowerCase();
        const brName = (p.branchName || getBranchName(p.branchId)).toLowerCase();
        const note = (p.note || '').toLowerCase();
        const search = searchText.toLowerCase();
        if (!accName.includes(search) && !brName.includes(search) && !note.includes(search)) {
          return false;
        }
      }
      if (selectedStatus && p.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [payrolls, searchText, selectedStatus, accounts, branches]);

  // Open Create/Edit Modal
  const handleOpenFormModal = (type, record = null) => {
    setFormModalType(type);
    setEditingRecord(record);
    setIsFormModalOpen(true);

    if (type === 'edit' && record) {
      // Map numeric enum Type -> string name for SalaryDetails (backend returns e.g. 4 for Penalty)
      const TYPE_INT_TO_STRING = { 1: 'Allowance', 2: 'Bonus', 3: 'Deduction', 4: 'Penalty' };
      const mappedDetails = (record.salaryDetails || []).map((d) => ({
        ...d,
        type: typeof d.type === 'number' ? (TYPE_INT_TO_STRING[d.type] || d.typeName || d.type) : (d.typeName || d.type),
      }));

      const isHourlyRecord = record.salaryType === 'Hourly' || record.salaryType === 'Theo giờ' || record.salaryType === 'TheoGio';
      form.setFieldsValue({
        accountId: record.accountId,
        branchId: record.branchId,
        monthYear: dayjs(`${record.year}-${record.Month || record.month}-01`),
        salaryType: record.salaryType || 'Monthly',
        baseSalary: record.baseSalary,
        baseWorkDays: isHourlyRecord ? 0 : (record.baseWorkDays || 0),
        actualWorkDays: record.actualWorkDays || 0,
        actualWorkHours: record.actualWorkHours || 0,
        calculatedSalary: record.calculatedSalary || 0,
        totalAllowance: record.totalAllowance || 0,
        bonusAmount: record.bonusAmount || 0,
        totalDeduction: record.totalDeduction || 0,
        penaltyAmount: record.penaltyAmount || 0,
        netSalary: record.netSalary || 0,
        status: STATUS_TO_NUM[record.status] || record.status || PAYROLL_STATUS.Draft,
        note: record.note || '',
        salaryDetails: mappedDetails,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        branchId: branches[0]?.id || 1,
        monthYear: dayjs(),
        salaryType: 'Monthly',
        baseSalary: 5000000,
        baseWorkDays: 0,
        actualWorkDays: 0,
        actualWorkHours: 0,
        calculatedSalary: 5000000,
        totalAllowance: 0,
        bonusAmount: 0,
        totalDeduction: 0,
        penaltyAmount: 0,
        netSalary: 5000000,
        status: PAYROLL_STATUS.Draft,
        salaryDetails: [],
      });
    }
  };

  // Recalculate salary in form dynamically when values change
  const handleFormValuesChange = (changedValues, allValues) => {
    const salaryType = allValues.salaryType || 'Monthly';
    const isHourly = salaryType === 'Hourly' || salaryType === 'Theo giờ' || salaryType === 'TheoGio';

    const baseSalary = allValues.baseSalary || 0;
    const baseDays = isHourly ? 0 : (allValues.baseWorkDays || 0);
    const actualDays = allValues.actualWorkDays || 0;
    const actualHours = allValues.actualWorkHours || 0;
    const details = allValues.salaryDetails || [];

    // Calculate sum of detail line items
    let allowanceSum = 0;
    let bonusSum = 0;
    let deductionSum = 0;
    let penaltySum = 0;

    details.forEach((item) => {
      if (!item) return;
      const amt = Number(item.amount) || 0;
      if (item.type === 'Allowance') allowanceSum += amt;
      else if (item.type === 'Bonus') bonusSum += amt;
      else if (item.type === 'Deduction') deductionSum += amt;
      else if (item.type === 'Penalty') penaltySum += amt;
    });

    const selectedAcc = accounts.find((a) => a.id === allValues.accountId);
    const isManagerAcc = selectedAcc && (
      selectedAcc.roleIds?.includes(3) ||
      selectedAcc.roleId === 3 ||
      selectedAcc.role === 'Manager' ||
      selectedAcc.roleName === 'Manager' ||
      selectedAcc.role === 'Quản lý' ||
      selectedAcc.roleName === 'Quản lý'
    );

    let calculatedSal = 0;
    if (isManagerAcc) {
      calculatedSal = baseSalary;
    } else if (isHourly) {
      calculatedSal = Math.round(baseSalary * actualHours);
    } else {
      calculatedSal = Math.round((baseSalary / (baseDays || 1)) * actualDays);
    }

    const netSal = calculatedSal + allowanceSum + bonusSum - deductionSum - penaltySum;

    form.setFieldsValue({
      calculatedSalary: calculatedSal,
      totalAllowance: allowanceSum,
      bonusAmount: bonusSum,
      totalDeduction: deductionSum,
      penaltyAmount: penaltySum,
      netSalary: Math.max(0, netSal),
      ...(isHourly ? { baseWorkDays: 0 } : {}),
    });
  };

  // Submit Create / Edit Form
  const handleFormSubmit = async (values) => {
    try {
      const monthDate = values.monthYear;
      const payload = {
        accountId: values.accountId,
        branchId: values.branchId,
        contractId: null,
        month: monthDate.month() + 1,
        year: monthDate.year(),
        salaryType: values.salaryType || 'Monthly',
        baseSalary: values.baseSalary,
        baseWorkDays: values.baseWorkDays,
        actualWorkDays: values.actualWorkDays,
        actualWorkHours: values.actualWorkHours,
        calculatedSalary: values.calculatedSalary,
        totalAllowance: values.totalAllowance,
        bonusAmount: values.bonusAmount,
        totalDeduction: values.totalDeduction,
        penaltyAmount: values.penaltyAmount,
        netSalary: values.netSalary,
        status: values.status,
        note: values.note || '',
        createdBy: user?.id || 1,
        salaryDetails: (values.salaryDetails || []).map((d) => {
          const TYPE_STRING_TO_INT = { Allowance: 1, Bonus: 2, Deduction: 3, Penalty: 4 };
          const typeVal = typeof d.type === 'string' ? (TYPE_STRING_TO_INT[d.type] || Number(d.type) || 1) : (Number(d.type) || 1);
          return {
            type: typeVal,
            title: d.title,
            amount: Number(d.amount) || 0,
            note: d.note || '',
          };
        }),
      };

      if (formModalType === 'create') {
        await createPayroll(payload);
        message.success('Thêm bảng lương thành công!');
      } else {
        await updatePayroll({
          id: editingRecord.id,
          ...payload,
        });
        message.success('Cập nhật bảng lương thành công!');
      }

      setIsFormModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bảng lương!');
    }
  };

  // Submit Auto Generate Payroll
  const handleGenerateSubmit = async (values) => {
    setGenerateLoading(true);
    try {
      const monthDate = values.monthYear;
      const payload = {
        accountId: values.accountId,
        branchId: values.branchId,
        month: monthDate.month() + 1,
        year: monthDate.year(),
        createdBy: user?.id || 1,
      };

      const res = await generatePayroll(payload);
      message.success(`Tính lương tự động thành công cho nhân viên! Thực nhận: ${formatVND(res.data?.netSalary)}`);
      setIsGenerateModalOpen(false);
      generateForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Không thể tự động tính lương (Kiểm tra hợp đồng hoặc lịch làm việc)');
    } finally {
      setGenerateLoading(false);
    }
  };

  // Submit Batch Auto Generate Payroll
  const handleBatchSubmit = async (values) => {
    setBatchLoading(true);
    try {
      const monthDate = values.monthYear;
      const payload = {
        month: monthDate.month() + 1,
        year: monthDate.year(),
        branchId: values.branchId ? Number(values.branchId) : null,
        createdBy: user?.id || 1,
      };

      const res = await generateBatchPayroll(payload);
      const list = res.data || [];
      message.success(`Tự động tính lương hàng loạt thành công cho ${list.length} nhân sự!`);
      setIsBatchModalOpen(false);
      batchForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tự động tính lương hàng loạt!');
    } finally {
      setBatchLoading(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetail = async (record) => {
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await getPayrollById(record.id);
      setDetailRecord(res.data || record);
    } catch (err) {
      console.error(err);
      setDetailRecord(record);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Status Update Modal
  const handleOpenStatusModal = (record) => {
    setStatusTargetRecord(record);
    statusForm.setFieldsValue({
      status: STATUS_TO_NUM[record.status] || record.status || PAYROLL_STATUS.Draft,
      paymentDate: record.paymentDate ? dayjs(record.paymentDate) : dayjs(),
    });
    setIsStatusModalOpen(true);
  };

  // Submit Status Update
  const handleStatusSubmit = async (values) => {
    try {
      const isPaidStatus = values.status === PAYROLL_STATUS.Paid || values.status === 4 || values.status === 'Paid';
      const pDate = isPaidStatus
        ? (values.paymentDate ? values.paymentDate.toISOString() : new Date().toISOString())
        : null;

      await updatePayrollStatus(statusTargetRecord.id, values.status, pDate);
      message.success('Cập nhật trạng thái bảng lương thành công!');
      setIsStatusModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Không thể cập nhật trạng thái bảng lương!');
    }
  };

  // Lock Payroll Handler
  const handleLockPayroll = async (id) => {
    try {
      await lockPayroll(id);
      message.success('Đã chốt (khóa) bảng lương thành công!');
      loadData();
      if (isDetailModalOpen && detailRecord?.id === id) {
        setIsDetailModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi chốt bảng lương!');
    }
  };

  // Approve Payroll Handler
  const handleApprovePayroll = async (id) => {
    try {
      await approvePayroll(id);
      message.success('Đã phê duyệt bảng lương thành công!');
      loadData();
      if (isDetailModalOpen && detailRecord?.id === id) {
        setIsDetailModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt bảng lương!');
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await deletePayroll(id);
      message.success('Xóa bảng lương thành công!');
      loadData();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa bảng lương!');
    }
  };

  // Columns table
  const columns = [
    {
      title: 'Mã BL',
      dataIndex: 'id',
      key: 'id',
      width: 75,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Nhân viên',
      dataIndex: 'accountId',
      key: 'accountId',
      render: (id, record) => (
        <Tooltip title="Bấm để xem chi tiết bảng lương">
          <div
            onClick={() => handleOpenDetail(record)}
            style={{ cursor: 'pointer', display: 'inline-block' }}
          >
            <strong
              style={{
                color: '#e8442a',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              {record.accountName || getAccountName(id)}
              <EyeOutlined style={{ fontSize: '13px', color: '#e8442a' }} />
            </strong>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              <UserOutlined style={{ marginRight: 4 }} />
              ID: {id}
            </div>
          </div>
        </Tooltip>
      ),
    },
    ...(isOwnerOrAdmin
      ? [
          {
            title: 'Chi nhánh',
            dataIndex: 'branchId',
            key: 'branchId',
            width: 170,
            render: (id, record) => {
              const fullName = record.branchName || getBranchName(id);
              const displayName = fullName.includes(',') ? fullName.split(',')[0].trim() : fullName;
              return (
                <Tooltip title={fullName}>
                  <span>{displayName}</span>
                </Tooltip>
              );
            },
          },
        ]
      : []),
    {
      title: 'Kỳ lương',
      key: 'period',
      align: 'center',
      render: (_, record) => (
        <Tag color="blue" style={{ fontWeight: 600 }}>
          Tháng {(record.Month || record.month)}/{(record.Year || record.year)}
        </Tag>
      ),
    },
    {
      title: isOwnerOrAdmin ? 'Lương cơ bản' : 'Lương CB & Công',
      key: 'baseSalaryInfo',
      render: (_, record) => {
        const isHourly = record.salaryType === 'Hourly' || record.salaryType === 'Theo giờ' || record.salaryType === 'TheoGio';
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{formatVND(record.baseSalary)}</div>
            {!isOwnerOrAdmin && (
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                {isHourly ? (
                  <span>{record.actualWorkHours || 0} giờ làm</span>
                ) : (
                  <span>{record.actualWorkDays}{record.baseWorkDays > 0 ? `/${record.baseWorkDays}` : ''} ngày công ({record.actualWorkHours || 0} giờ)</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Lương tính toán',
      dataIndex: 'calculatedSalary',
      key: 'calculatedSalary',
      render: (val) => formatVND(val),
    },

    {
      title: 'Thực nhận',
      dataIndex: 'netSalary',
      key: 'netSalary',
      sorter: (a, b) => a.netSalary - b.netSalary,
      render: (val) => (
        <strong style={{ fontSize: '15px', color: '#e8442a' }}>
          {formatVND(val)}
        </strong>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const conf = STATUS_CONFIG[status] || { label: 'Chưa rõ', color: 'default' };
        return <Tag color={conf.color}>{conf.label}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, record) => {
        const isLocked = record.status === PAYROLL_STATUS.Locked || record.status === 6 || record.status === 'Locked';
        const isApproved = record.status === PAYROLL_STATUS.Approved || record.status === 3 || record.status === 'Approved';
        const isPaid = record.status === PAYROLL_STATUS.Paid || record.status === 4 || record.status === 'Paid';

        return (
          <Space size="small">
            {!isLocked && !isApproved && !isPaid && (
              <Tooltip title="Chốt (Khóa) bảng lương">
                <Popconfirm
                  title="Chốt bảng lương này để ngăn chỉnh sửa?"
                  okText="Chốt lương"
                  cancelText="Hủy"
                  onConfirm={() => handleLockPayroll(record.id)}
                >
                  <Button type="text" icon={<LockOutlined style={{ color: '#722ed1' }} />} />
                </Popconfirm>
              </Tooltip>
            )}

            {isLocked && !isApproved && !isPaid && (
              <Tooltip title="Phê duyệt bảng lương">
                <Popconfirm
                  title="Phê duyệt bảng lương này?"
                  okText="Duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApprovePayroll(record.id)}
                >
                  <Button type="text" icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
                </Popconfirm>
              </Tooltip>
            )}

            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                disabled={isLocked || isApproved || isPaid}
                icon={<EditOutlined style={{ color: isLocked || isApproved || isPaid ? '#ccc' : '#fa8c16' }} />}
                onClick={() => handleOpenFormModal('edit', record)}
              />
            </Tooltip>

            <Tooltip title="Xóa">
              <Popconfirm
                title="Bạn chắc chắn muốn xóa bảng lương này?"
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                disabled={isLocked || isApproved || isPaid}
                onConfirm={() => handleDelete(record.id)}
              >
                <Button type="text" danger disabled={isLocked || isApproved || isPaid} icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="payroll-page animate-fade-in" style={{ padding: '4px 0' }}>
      {/* Header Banner */}
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
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#ffefed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e8442a',
                fontSize: 24,
              }}
            >
              <DollarCircleOutlined />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#e8442a', fontWeight: 700 }}>
                {titleText}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                {subtitleText}
              </p>
            </div>
          </div>

          <Space size="middle" wrap>
            <Button
              type="default"
              icon={<CalculatorOutlined style={{ color: '#e8442a' }} />}
              size="large"
              style={{ borderRadius: '8px', borderColor: '#ffdeda' }}
              onClick={() => {
                generateForm.resetFields();
                generateForm.setFieldsValue({
                  branchId: branches[0]?.id || 1,
                  monthYear: dayjs(),
                });
                setIsGenerateModalOpen(true);
              }}
            >
              Tự động tính cá nhân
            </Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              size="large"
              style={{
                background: 'linear-gradient(135deg, #1890ff, #36cfc9)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.25)',
                fontWeight: 600,
              }}
              onClick={() => {
                batchForm.resetFields();
                batchForm.setFieldsValue({
                  monthYear: dayjs(),
                  branchId: selectedBranch ? Number(selectedBranch) : undefined,
                });
                setIsBatchModalOpen(true);
              }}
            >
              Tính lương hàng loạt
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
              onClick={() => handleOpenFormModal('create')}
            >
              Tạo bảng lương thủ công
            </Button>
          </Space>
        </div>
      </Card>



      {/* Filter and Table Card */}
      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Tìm theo tên nhân viên, chi nhánh, ghi chú..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 280, borderRadius: '8px' }}
          />

          <DatePicker.MonthPicker
            placeholder="Chọn tháng/năm"
            style={{ width: 160, borderRadius: '8px' }}
            format="MM/YYYY"
            value={selectedMonthYear}
            onChange={(val) => setSelectedMonthYear(val)}
            disabledDate={(current) => current && current.isAfter(dayjs().endOf('month'))}
          />

          {isOwnerOrAdmin && (
            <Select
              placeholder="Chi nhánh"
              style={{ width: 170 }}
              allowClear
              value={selectedBranch}
              onChange={(val) => setSelectedBranch(val)}
            >
              {branches.map((b) => (
                <Select.Option key={b.id} value={b.id}>
                  {b.name}
                </Select.Option>
              ))}
            </Select>
          )}

          <Select
            placeholder="Lọc nhân viên"
            style={{ width: 180 }}
            allowClear
            showSearch
            optionFilterProp="label"
            value={selectedAccount}
            onChange={(val) => setSelectedAccount(val)}
          >
            {filteredAccounts.map((a) => (
              <Select.Option key={a.id} value={a.id} label={a.name}>
                {a.name} (ID: {a.id})
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="Trạng thái"
            style={{ width: 160 }}
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

          {(searchText || selectedBranch || selectedMonthYear || selectedAccount || selectedStatus) && (
            <Button
              type="link"
              danger
              onClick={() => {
                setSearchText('');
                setSelectedBranch(null);
                setSelectedMonthYear(null);
                setSelectedAccount(null);
                setSelectedStatus(null);
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={filteredPayrolls}
          rowKey="id"
          loading={loading}
          pagination={{ defaultPageSize: 10, pageSizeOptions: ['5', '10', '25', '50'], showSizeChanger: true }}
          scroll={{ x: 1100 }}
          bordered
        />
      </Card>

      {/* ========================================================================= */}
      {/* 1. Modal Auto-Generate Payroll */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, color: '#e8442a' }}>
            <CalculatorOutlined />
            <span>TỰ ĐỘNG TÍNH LƯƠNG NHÂN VIÊN</span>
          </div>
        }
        open={isGenerateModalOpen}
        onCancel={() => setIsGenerateModalOpen(false)}
        onOk={() => generateForm.submit()}
        confirmLoading={generateLoading}
        okText="Tính lương ngay"
        cancelText="Hủy bỏ"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #e8442a, #ff8c42)',
            border: 'none',
          },
        }}
      >
        <Form
          form={generateForm}
          layout="vertical"
          onFinish={handleGenerateSubmit}
          initialValues={{
            monthYear: dayjs(),
          }}
          style={{ marginTop: 12 }}
        >
          <Form.Item
            name="accountId"
            label="Chọn nhân viên"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
          >
            <Select
              placeholder="Chọn nhân viên cần tính lương..."
              showSearch
              filterOption={(input, option) =>
                (option?.searchValue || option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
              optionLabelProp="label"
              dropdownStyle={{ maxHeight: 360 }}
              onChange={(val) => {
                const acc = accounts.find((a) => a.id === val);
                if (acc && acc.branchId) {
                  generateForm.setFieldsValue({ branchId: acc.branchId });
                }
              }}
            >
              {groupedAccounts.map(([roleKey, group]) => (
                <Select.OptGroup
                  key={roleKey}
                  label={
                    <div style={{ color: '#e8442a', fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px', padding: '2px 0' }}>
                      {group.label} ({group.items.length})
                    </div>
                  }
                >
                  {group.items.map((a) => {
                    const primaryRoleId = a.roleIds && a.roleIds.length > 0 ? a.roleIds[0] : (a.roleId || 6);
                    const roleInfo = ROLES_MAP[primaryRoleId] || { label: 'Nhân viên', color: 'default' };
                    const searchValue = `${a.name} ${a.id} ${a.phone || ''} ${a.email || ''} ${roleInfo.label}`;

                    return (
                      <Select.Option
                        key={a.id}
                        value={a.id}
                        label={`${a.name} (Mã: #${a.id})`}
                        searchValue={searchValue}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar
                              size={30}
                              src={a.avatarImage || undefined}
                              icon={!a.avatarImage ? <UserOutlined /> : undefined}
                              style={{ backgroundColor: a.avatarImage ? undefined : '#e8442a', flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: '#1f2937', lineHeight: '1.2' }}>
                                {a.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                Mã: #{a.id} {a.phone ? `• SĐT: ${a.phone}` : ''}
                              </div>
                            </div>
                          </div>
                          <Tag color={roleInfo.color} style={{ margin: 0, fontSize: '11px', borderRadius: '4px' }}>
                            {roleInfo.label}
                          </Tag>
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select.OptGroup>
              ))}
            </Select>
          </Form.Item>

          {isOwnerOrAdmin ? (
            <Form.Item
              name="branchId"
              label="Chi nhánh làm việc (tự động theo Quản lý)"
              rules={[{ required: true, message: 'Vui lòng chọn chi nhánh!' }]}
            >
              <Select placeholder="Tự động theo Quản lý..." disabled>
                {branches.map((b) => (
                  <Select.Option key={b.id} value={b.id}>
                    {b.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item name="branchId" hidden>
              <Input />
            </Form.Item>
          )}

          <Form.Item
            name="monthYear"
            label="Tháng/Năm tính lương"
            rules={[{ required: true, message: 'Vui lòng chọn tháng/năm!' }]}
          >
            <DatePicker.MonthPicker
              style={{ width: '100%' }}
              format="MM/YYYY"
              placeholder="Chọn tháng/năm"
              disabledDate={(current) => current && current.isAfter(dayjs().endOf('month'))}
            />
          </Form.Item>

          <div
            style={{
              padding: '10px 14px',
              background: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#0050b3',
            }}
          >
            {isOwnerOrAdmin
              ? '💡 Hệ thống sẽ tự động tính toán: Lương cơ bản từ hợp đồng đang hiệu lực của Quản lý và tự động áp dụng các khoản phụ cấp, thưởng, phạt.'
              : '💡 Hệ thống sẽ tự động tính toán: Lương cơ bản từ hợp đồng, ngày công & giờ làm thực tế từ lịch làm việc đã hoàn thành, và áp dụng phụ cấp/khấu trừ.'}
          </div>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. Modal Manual Create / Edit Payroll */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#e8442a' }}>
            <DollarCircleOutlined />
            <span>
              {formModalType === 'create' ? 'TẠO BẢNG LƯƠNG THỦ CÔNG' : 'CẬP NHẬT BẢNG LƯƠNG'}
            </span>
          </div>
        }
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        onOk={() => form.submit()}
        width={760}
        okText={formModalType === 'create' ? 'Lưu bảng lương' : 'Cập nhật'}
        cancelText="Hủy bỏ"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #e8442a, #ff8c42)',
            border: 'none',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          onValuesChange={handleFormValuesChange}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="accountId"
                label="Nhân viên"
                rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
              >
                <Select
                  placeholder="Chọn nhân viên..."
                  showSearch
                  filterOption={(input, option) =>
                    (option?.searchValue || option?.label || '').toLowerCase().includes(input.toLowerCase())
                  }
                  optionLabelProp="label"
                  dropdownStyle={{ maxHeight: 360 }}
                  onChange={(val) => {
                    const acc = accounts.find((a) => a.id === val);
                    if (acc && acc.branchId) {
                      form.setFieldsValue({ branchId: acc.branchId });
                    }
                  }}
                >
                  {groupedAccounts.map(([roleKey, group]) => (
                    <Select.OptGroup
                      key={roleKey}
                      label={
                        <div style={{ color: '#e8442a', fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px', padding: '2px 0' }}>
                          {group.label} ({group.items.length})
                        </div>
                      }
                    >
                      {group.items.map((a) => {
                        const primaryRoleId = a.roleIds && a.roleIds.length > 0 ? a.roleIds[0] : (a.roleId || 6);
                        const roleInfo = ROLES_MAP[primaryRoleId] || { label: 'Nhân viên', color: 'default' };
                        const searchValue = `${a.name} ${a.id} ${a.phone || ''} ${a.email || ''} ${roleInfo.label}`;

                        return (
                          <Select.Option
                            key={a.id}
                            value={a.id}
                            label={`${a.name} (Mã: #${a.id})`}
                            searchValue={searchValue}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar
                                  size={30}
                                  src={a.avatarImage || undefined}
                                  icon={!a.avatarImage ? <UserOutlined /> : undefined}
                                  style={{ backgroundColor: a.avatarImage ? undefined : '#e8442a', flexShrink: 0 }}
                                />
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1f2937', lineHeight: '1.2' }}>
                                    {a.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                    Mã: #{a.id} {a.phone ? `• SĐT: ${a.phone}` : ''}
                                  </div>
                                </div>
                              </div>
                              <Tag color={roleInfo.color} style={{ margin: 0, fontSize: '11px', borderRadius: '4px' }}>
                                {roleInfo.label}
                              </Tag>
                            </div>
                          </Select.Option>
                        );
                      })}
                    </Select.OptGroup>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {isOwnerOrAdmin ? (
              <Col span={12}>
                <Form.Item
                  name="branchId"
                  label="Chi nhánh (tự động theo Quản lý)"
                  rules={[{ required: true, message: 'Vui lòng chọn chi nhánh!' }]}
                >
                  <Select placeholder="Tự động theo Quản lý..." disabled>
                    {branches.map((b) => (
                      <Select.Option key={b.id} value={b.id}>
                        {b.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            ) : (
              <Form.Item name="branchId" hidden>
                <Input />
              </Form.Item>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="monthYear"
                label="Tháng/Năm tính lương"
                rules={[{ required: true, message: 'Vui lòng chọn tháng/năm!' }]}
              >
                <DatePicker.MonthPicker
                  style={{ width: '100%' }}
                  format="MM/YYYY"
                  disabledDate={(current) => current && current.isAfter(dayjs().endOf('month'))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryType" label="Hình thức lương">
                <Select disabled placeholder="Được cấu hình trong Hợp đồng">
                  <Select.Option value="Monthly">Theo tháng</Select.Option>
                  <Select.Option value="Fixed">Theo tháng</Select.Option>
                  <Select.Option value="Hourly">Theo giờ</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={isOwnerOrAdmin ? 12 : 8}>
              <Form.Item
                name="baseSalary"
                label="Lương cơ bản (VND)"
                rules={[{ required: true, message: 'Vui lòng nhập lương cơ bản!' }]}
              >
                <InputNumber
                  addonAfter="đ"
                  style={{ width: '100%' }}
                  formatter={(val) => (val != null && val !== '' ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                  parser={(val) => (val ? val.replace(/\$\s?|(,*)/g, '') : '')}
                  min={0}
                />
              </Form.Item>
            </Col>

            {!isOwnerOrAdmin && (
              <>
                {!isHourlyForm && (
                  <Col span={8}>
                    <Form.Item
                      name="baseWorkDays"
                      label="Công chuẩn (ngày)"
                      rules={[{ required: true, message: 'Nhập công chuẩn!' }]}
                    >
                      <InputNumber style={{ width: '100%' }} min={1} max={31} />
                    </Form.Item>
                  </Col>
                )}
                <Col span={isHourlyForm ? 8 : 8}>
                  <Form.Item
                    name="actualWorkDays"
                    label="Công thực tế (ngày)"
                    rules={isHourlyForm ? [] : [{ required: true, message: 'Nhập công thực tế!' }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} step={0.5} max={31} />
                  </Form.Item>
                </Col>
                {isHourlyForm && (
                  <Col span={8}>
                    <Form.Item
                      name="actualWorkHours"
                      label="Số giờ làm thực tế"
                      rules={[{ required: true, message: 'Nhập số giờ làm!' }]}
                    >
                      <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
                    </Form.Item>
                  </Col>
                )}
              </>
            )}

            {isOwnerOrAdmin && (
              <Col span={12}>
                <Form.Item name="calculatedSalary" label="Lương tính toán">
                  <InputNumber
                    addonAfter="đ"
                    style={{ width: '100%' }}
                    formatter={(val) => (val != null && val !== '' ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                    parser={(val) => (val ? val.replace(/\$\s?|(,*)/g, '') : '')}
                    readOnly
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            {!isOwnerOrAdmin && (
              <>
                {!isHourlyForm && (
                  <Col span={8}>
                    <Form.Item name="actualWorkHours" label="Số giờ làm thực tế">
                      <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
                    </Form.Item>
                  </Col>
                )}
                <Col span={isHourlyForm ? 12 : 8}>
                  <Form.Item name="calculatedSalary" label="Lương tính toán">
                    <InputNumber
                      addonAfter="đ"
                      style={{ width: '100%' }}
                      formatter={(val) => (val != null && val !== '' ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                      parser={(val) => (val ? val.replace(/\$\s?|(,*)/g, '') : '')}
                      readOnly
                    />
                  </Form.Item>
                </Col>
              </>
            )}
            <Col span={isOwnerOrAdmin ? 24 : 8}>
              <Form.Item name="status" label="Trạng thái">
                <Select placeholder="Chọn trạng thái">
                  {STATUS_OPTIONS.map((s) => (
                    <Select.Option key={s.value} value={s.value}>
                      {s.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }}>Chi tiết Phụ cấp, Thưởng & Phạt</Divider>

          <Form.List name="salaryDetails">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'type']}
                      rules={[{ required: true, message: 'Chọn loại!' }]}
                      style={{ width: 160 }}
                    >
                      <Select placeholder="Chọn loại khoản" optionLabelProp="label">
                        <Select.Option value="Allowance" label="+ Phụ cấp">
                          <span style={{ color: '#389e0d', fontWeight: 600 }}>✚ Phụ cấp</span>
                        </Select.Option>
                        <Select.Option value="Bonus" label="+ Tiền thưởng">
                          <span style={{ color: '#1677ff', fontWeight: 600 }}>✚ Tiền thưởng</span>
                        </Select.Option>
                        <Select.Option value="Deduction" label="- Khấu trừ">
                          <span style={{ color: '#cf1322', fontWeight: 600 }}>▬ Khấu trừ</span>
                        </Select.Option>
                        <Select.Option value="Penalty" label="- Tiền phạt">
                          <span style={{ color: '#d4380d', fontWeight: 600 }}>▬ Tiền phạt</span>
                        </Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'title']}
                      rules={[{ required: true, message: 'Tên khoản!' }]}
                      style={{ width: 220 }}
                    >
                      <Input placeholder="Ví dụ: Phụ cấp ăn trưa" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'amount']}
                      rules={[{ required: true, message: 'Số tiền!' }]}
                      style={{ width: 180 }}
                    >
                      <InputNumber
                        placeholder="Số tiền"
                        addonAfter="đ"
                        style={{ width: '100%' }}
                        formatter={(val) => (val != null && val !== '' ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                        parser={(val) => (val ? val.replace(/\$\s?|(,*)/g, '') : '')}
                        min={0}
                      />
                    </Form.Item>

                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }}
                    />
                  </Space>
                ))}

                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm khoản phụ cấp / thưởng / phạt
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Summary Banner in Form */}
          <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px', marginBottom: 12 }}>
            <Row gutter={16} align="middle">
              <Col span={12}>
                <span style={{ fontSize: '13px', color: '#52c41a' }}>LƯƠNG THỰC NHẬN:</span>
                <Form.Item name="netSalary" noStyle>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#3f8600' }}>
                    {formatVND(form.getFieldValue('netSalary'))}
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item name="note" label="Ghi chú thêm">
            <Input.TextArea placeholder="Ghi chú giải trình hoặc thông tin thanh toán..." rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. Modal View Payroll Detail */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#e8442a' }}>
            <EyeOutlined />
            <span>CHI TIẾT BẢNG LƯƠNG #{detailRecord?.id}</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={720}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>Đang tải chi tiết...</div>
        ) : detailRecord ? (
          <div>
            <Descriptions title="Thông tin chung" bordered size="small" column={2}>
              <Descriptions.Item label="Nhân viên">
                <strong>{detailRecord.accountName || getAccountName(detailRecord.accountId)}</strong> (ID: {detailRecord.accountId})
              </Descriptions.Item>
              <Descriptions.Item label="Chi nhánh">
                {detailRecord.branchName || getBranchName(detailRecord.branchId)}
              </Descriptions.Item>
              <Descriptions.Item label="Kỳ lương">
                Tháng {(detailRecord.Month || detailRecord.month)}/{(detailRecord.Year || detailRecord.year)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={STATUS_CONFIG[detailRecord.status]?.color}>
                  {STATUS_CONFIG[detailRecord.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Lương cơ bản">
                {formatVND(detailRecord.baseSalary)}
              </Descriptions.Item>
              {!isOwnerOrAdmin && (
                <>
                  <Descriptions.Item label="Công chuẩn / Thực tế">
                    {detailRecord.actualWorkDays}{detailRecord.baseWorkDays > 0 ? ` / ${detailRecord.baseWorkDays}` : ''} ngày công ({detailRecord.actualWorkHours || 0} giờ)
                  </Descriptions.Item>
                  <Descriptions.Item label="Lương tính theo công">
                    {formatVND(detailRecord.calculatedSalary)}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Ngày thanh toán">
                {detailRecord.paymentDate ? dayjs(detailRecord.paymentDate).format('DD/MM/YYYY HH:mm') : 'Chưa thanh toán'}
              </Descriptions.Item>
            </Descriptions>

            {/* Chi tiết ca làm việc trong tháng */}
            {((detailRecord.payrollShiftDetails && detailRecord.payrollShiftDetails.length > 0) || (detailRecord.shiftDetails && detailRecord.shiftDetails.length > 0)) && (
              <>
                <Divider style={{ margin: '16px 0 8px 0' }}>Bảng Bóc Tách Chi Tiết Theo Ca (Hệ số Lễ/Tết & Ca đêm & OT)</Divider>
                <Table
                  dataSource={detailRecord.payrollShiftDetails || detailRecord.shiftDetails || []}
                  rowKey={(r, idx) => r.id || idx}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  bordered
                  columns={[
                    {
                      title: 'Ngày làm',
                      dataIndex: 'workDate',
                      key: 'workDate',
                      width: 105,
                      render: (d) => dayjs(d).format('DD/MM/YYYY'),
                    },
                    {
                      title: 'Số giờ làm',
                      key: 'hours',
                      align: 'center',
                      width: 90,
                      render: (_, r) => (
                        <span>{r.actualHours ?? r.regularHours ?? 0}h{r.standardHours ? `/${r.standardHours}h` : ''}</span>
                      ),
                    },
                    {
                      title: 'Hệ số ngày',
                      dataIndex: 'dateCoefficient',
                      key: 'dateCoefficient',
                      align: 'center',
                      width: 90,
                      render: (coeff, r) => {
                        const val = coeff ?? r.dateMultiplier ?? 1.0;
                        return <Tag color={val > 1.0 ? 'volcano' : 'default'}>{val}x</Tag>;
                      },
                    },
                    {
                      title: 'Loại ca',
                      dataIndex: 'isNightShift',
                      key: 'isNightShift',
                      align: 'center',
                      width: 85,
                      render: (isNight) => isNight ? <Tag color="purple">Ca đêm</Tag> : <Tag color="default">Ca ngày</Tag>,
                    },
                    {
                      title: 'OT duyệt',
                      dataIndex: 'approvedOTHours',
                      key: 'approvedOTHours',
                      align: 'center',
                      width: 85,
                      render: (ot) => (ot > 0 ? <Tag color="orange">+{ot}h OT</Tag> : '0h'),
                    },
                    {
                      title: 'Tiền ca gốc',
                      dataIndex: 'baseShiftPay',
                      key: 'baseShiftPay',
                      align: 'right',
                      render: (amt, r) => formatVND(amt ?? r.shiftTotal ?? 0),
                    },
                    {
                      title: 'Thưởng Ca đêm / OT',
                      key: 'bonusPay',
                      align: 'right',
                      render: (_, r) => {
                        const night = r.nightShiftPay || 0;
                        const ot = r.oTPay || 0;
                        if (night === 0 && ot === 0) return '0 đ';
                        return (
                          <div style={{ fontSize: 11 }}>
                            {night > 0 && <span style={{ color: '#722ed1', display: 'block' }}>Đêm: +{formatVND(night)}</span>}
                            {ot > 0 && <span style={{ color: '#fa8c16', display: 'block' }}>OT: +{formatVND(ot)}</span>}
                          </div>
                        );
                      },
                    },
                    {
                      title: 'Tổng tiền ca',
                      dataIndex: 'totalShiftPay',
                      key: 'totalShiftPay',
                      align: 'right',
                      render: (amt, r) => <strong style={{ color: '#e8442a' }}>{formatVND(amt ?? r.shiftTotal ?? 0)}</strong>,
                    },
                  ]}
                />
              </>
            )}

            <Divider style={{ margin: '16px 0 8px 0' }}>Chi tiết Phụ cấp & Khoản trừ</Divider>

            <Table
              dataSource={detailRecord.salaryDetails || []}
              rowKey={(r, idx) => r.id || idx}
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: 'Loại khoản',
                  dataIndex: 'type',
                  key: 'type',
                  width: 140,
                  render: (type) => {
                    if (type === 'Allowance' || type === 'Bonus') {
                      return <Tag color="green">+{type === 'Allowance' ? 'Phụ cấp' : 'Tiền thưởng'}</Tag>;
                    }
                    return <Tag color="red">-{type === 'Deduction' ? 'Khấu trừ' : 'Tiền phạt'}</Tag>;
                  },
                },
                {
                  title: 'Tên khoản / Nội dung',
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: 'Số tiền',
                  dataIndex: 'amount',
                  key: 'amount',
                  align: 'right',
                  render: (amt, record) => {
                    const isPlus = record.type === 'Allowance' || record.type === 'Bonus';
                    return (
                      <strong style={{ color: isPlus ? '#3f8600' : '#cf1322' }}>
                        {isPlus ? '+' : '-'}{formatVND(amt)}
                      </strong>
                    );
                  },
                },
              ]}
            />

            {/* Total Net Salary Box */}
            <Card
              style={{
                marginTop: 16,
                background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
                border: '1px solid #ffa39e',
                borderRadius: '8px',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: '13px', color: '#cf1322', textTransform: 'uppercase', letterSpacing: 1 }}>
                LƯƠNG THỰC NHẬN:
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#a8071a' }}>
                {formatVND(detailRecord.netSalary)}
              </div>
            </Card>

            {detailRecord.note && (
              <div style={{ marginTop: 12, fontSize: 13, color: '#595959' }}>
                <strong>Ghi chú:</strong> {detailRecord.note}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* ========================================================================= */}
      {/* 4. Modal Quick Update Status */}
      {/* ========================================================================= */}
      <Modal
        title="CẬP NHẬT TRẠNG THÁI BẢNG LƯƠNG"
        open={isStatusModalOpen}
        onCancel={() => setIsStatusModalOpen(false)}
        onOk={() => statusForm.submit()}
        okText="Cập nhật"
        cancelText="Hủy bỏ"
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="status"
            label="Trạng thái mới"
            rules={[{ required: true, message: 'Chọn trạng thái mới!' }]}
          >
            <Select placeholder="Chọn trạng thái...">
              {STATUS_OPTIONS.map((st) => (
                <Select.Option key={st.value} value={st.value}>
                  {st.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
          >
            {({ getFieldValue }) =>
              getFieldValue('status') === PAYROLL_STATUS.Paid ? (
                <Form.Item
                  name="paymentDate"
                  label="Ngày thanh toán thực tế"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày thanh toán!' }]}
                >
                  <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. Modal Batch Generate Payroll */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, color: '#1890ff' }}>
            <ThunderboltOutlined />
            <span>TỰ ĐỘNG TÍNH BẢNG LƯƠNG HÀNG LOẠT</span>
          </div>
        }
        open={isBatchModalOpen}
        onCancel={() => setIsBatchModalOpen(false)}
        onOk={() => batchForm.submit()}
        confirmLoading={batchLoading}
        okText="Tính lương hàng loạt"
        cancelText="Hủy bỏ"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #1890ff, #36cfc9)',
            border: 'none',
          },
        }}
      >
        <Alert
          message={
            isOwnerOrAdmin
              ? 'Hệ thống sẽ tự động tính toán và khởi tạo bảng lương cho toàn bộ QUẢN LÝ thuộc các chi nhánh theo hợp đồng còn hiệu lực.'
              : 'Hệ thống sẽ tự động tính toán và khởi tạo bảng lương cho toàn bộ NHÂN VIÊN thuộc chi nhánh của bạn theo hợp đồng còn hiệu lực.'
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchSubmit}
          initialValues={{
            monthYear: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={isOwnerOrAdmin ? 12 : 24}>
              <Form.Item
                name="monthYear"
                label="Chọn Tháng / Năm"
                rules={[{ required: true, message: 'Vui lòng chọn tháng năm!' }]}
              >
                <DatePicker
                  picker="month"
                  format="MM/YYYY"
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current.isAfter(dayjs().endOf('month'))}
                />
              </Form.Item>
            </Col>
            {isOwnerOrAdmin && (
              <Col span={12}>
                <Form.Item
                  name="branchId"
                  label="Chi nhánh (Để trống = Tất cả)"
                >
                  <Select placeholder="Tất cả chi nhánh" allowClear style={{ width: '100%' }}>
                    {branches.map((b) => (
                      <Select.Option key={b.id} value={b.id}>
                        {b.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PayrollPage;
