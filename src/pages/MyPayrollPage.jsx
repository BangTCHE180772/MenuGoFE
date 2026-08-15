import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Tag,
  Spin,
  Button,
  Select,
  Empty,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  Table,
  Badge,
  message,
} from 'antd';
import {
  DollarOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
  BankOutlined,
  UserOutlined,
  GiftOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { getMyPayrolls } from '../api/payrollApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const STATUS_CONFIG = {
  Draft: { label: 'Bản nháp', color: 'default', icon: <ClockCircleOutlined /> },
  Approved: { label: 'Đã duyệt', color: 'processing', icon: <ClockCircleOutlined /> },
  Paid: { label: 'Đã thanh toán', color: 'success', icon: <CheckCircleOutlined /> },
  Cancelled: { label: 'Đã hủy', color: 'error', icon: <WarningOutlined /> },
};

const SALARY_TYPE_LABELS = {
  Fixed: 'Lương cố định (Tháng)',
  Hourly: 'Lương theo giờ',
};

const TYPE_TAGS = {
  Allowance: { label: 'Phụ cấp', color: 'blue', icon: <GiftOutlined /> },
  Bonus: { label: 'Khen thưởng', color: 'green', icon: <RiseOutlined /> },
  Deduction: { label: 'Khấu trừ', color: 'orange', icon: <FallOutlined /> },
  Penalty: { label: 'Xử phạt', color: 'magenta', icon: <WarningOutlined /> },
};

const MyPayrollPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);

  const [filterMonth, setFilterMonth] = useState(dayjs().month() + 1);
  const [filterYear, setFilterYear] = useState(dayjs().year());

  const fetchMyPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPayrolls({ month: filterMonth, year: filterYear });
      const data = res.data || [];
      setPayrolls(data);
      if (data.length > 0) {
        setSelectedPayrollId(data[0].id);
      } else {
        setSelectedPayrollId(null);
      }
    } catch (err) {
      console.error(err);
      message.error('Không thể tải thông tin bảng lương của bạn!');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchMyPayrolls();
  }, [fetchMyPayrolls]);

  const selectedPayroll = payrolls.find((p) => p.id === selectedPayrollId) || (payrolls.length > 0 ? payrolls[0] : null);

  // Month options (1-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  // Year options (current - 2 to current + 1)
  const currentY = dayjs().year();
  const yearOptions = [currentY - 1, currentY, currentY + 1].map((y) => ({
    value: y,
    label: `Năm ${y}`,
  }));

  const detailColumns = [
    {
      title: 'Khoản mục',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Phân loại',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const config = TYPE_TAGS[type] || { label: type, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (val, record) => {
        const isNegative = record.type === 'Deduction' || record.type === 'Penalty';
        return (
          <Text strong style={{ color: isNegative ? '#ff4d4f' : '#52c41a' }}>
            {isNegative ? '-' : '+'}{new Intl.NumberFormat('vi-VN').format(val)} đ
          </Text>
        );
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (note) => note || '-',
    },
  ];

  return (
    <div className="my-payroll-page animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: '20px' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ fontSize: '18px' }} />}
          onClick={() => navigate('/home')}
          style={{ position: 'absolute', left: 0 }}
        />
        <h2 style={{ width: '100%', textAlign: 'center', margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#000' }}>
          Phiếu Lương Của Tôi
        </h2>
        <Button
          type="text"
          icon={<ReloadOutlined style={{ fontSize: '16px' }} />}
          onClick={fetchMyPayrolls}
          loading={loading}
          style={{ position: 'absolute', right: 0 }}
        />
      </div>

      {/* Month / Year Filters */}
      <Card style={{ borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="middle">
            <span style={{ fontWeight: '600' }}><CalendarOutlined /> Kỳ lương:</span>
            <Select
              value={filterMonth}
              onChange={setFilterMonth}
              options={monthOptions}
              style={{ width: 120 }}
            />
            <Select
              value={filterYear}
              onChange={setFilterYear}
              options={yearOptions}
              style={{ width: 110 }}
            />
          </Space>

          {payrolls.length > 1 && (
            <Space style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: '13px', color: '#8c8c8c' }}>Chọn phiếu lương:</span>
              <Select
                value={selectedPayrollId}
                onChange={setSelectedPayrollId}
                style={{ width: 220 }}
                options={payrolls.map((p) => ({
                  value: p.id,
                  label: `Bảng lương #${p.id} (${p.branchName || 'Chi nhánh'})`,
                }))}
              />
            </Space>
          )}
        </div>
      </Card>

      <Spin spinning={loading}>
        {!selectedPayroll ? (
          <Card style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '12px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text strong style={{ fontSize: '16px', color: '#595959' }}>
                    Chưa có dữ liệu bảng lương Tháng {filterMonth}/{filterYear}
                  </Text>
                  <div style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '6px' }}>
                    Bảng lương tháng này có thể chưa được chốt hoặc tạo bởi Quản lý.
                  </div>
                </div>
              }
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Main Payslip Card */}
            <Card
              style={{
                borderRadius: '16px',
                border: '1px solid #d9f7be',
                background: 'linear-gradient(135deg, #ffffff 0%, #f6ffed 100%)',
                boxShadow: '0 4px 16px rgba(82, 196, 26, 0.08)',
                overflow: 'hidden',
              }}
              bodyStyle={{ padding: '24px' }}
            >
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#e6f7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1890ff',
                      fontSize: '24px',
                    }}
                  >
                    <DollarOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#262626' }}>
                      Phiếu Lương Tháng {selectedPayroll.month}/{selectedPayroll.year}
                    </div>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {selectedPayroll.branchName} • Mã phiếu: #{selectedPayroll.id}
                    </Text>
                  </div>
                </div>

                <div>
                  {STATUS_CONFIG[selectedPayroll.status] ? (
                    <Tag
                      icon={STATUS_CONFIG[selectedPayroll.status].icon}
                      color={STATUS_CONFIG[selectedPayroll.status].color}
                      style={{ padding: '4px 12px', fontSize: '14px', borderRadius: '20px', fontWeight: '600' }}
                    >
                      {STATUS_CONFIG[selectedPayroll.status].label}
                    </Tag>
                  ) : (
                    <Tag style={{ padding: '4px 12px', fontSize: '14px', borderRadius: '20px' }}>
                      {selectedPayroll.status}
                    </Tag>
                  )}
                </div>
              </div>

              {/* NET SALARY HIGHLIGHT */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center',
                  border: '1px solid #b7eb8f',
                  boxShadow: '0 2px 8px rgba(82, 196, 26, 0.12)',
                  marginBottom: '20px',
                }}
              >
                <Text type="secondary" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                  THỰC LĨNH
                </Text>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a', margin: '6px 0' }}>
                  {new Intl.NumberFormat('vi-VN').format(selectedPayroll.netSalary)} đ
                </div>
                {selectedPayroll.paymentDate && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                    Ngày thanh toán: {dayjs(selectedPayroll.paymentDate).format('DD/MM/YYYY')}
                  </Text>
                )}
              </div>

              {/* Key Metrics Grid */}
              <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                <Col xs={12} sm={8}>
                  <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Lương cơ bản</Text>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#262626', marginTop: '2px' }}>
                      {new Intl.NumberFormat('vi-VN').format(selectedPayroll.baseSalary)} đ
                    </div>
                  </div>
                </Col>

                <Col xs={12} sm={8}>
                  <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Công / Giờ làm thực tế</Text>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1890ff', marginTop: '2px' }}>
                      {selectedPayroll.salaryType === 'Hourly' || selectedPayroll.salaryType === 'Theo giờ' || selectedPayroll.salaryType === 'TheoGio'
                        ? `${selectedPayroll.actualWorkHours || 0} giờ làm`
                        : `${selectedPayroll.actualWorkDays} / ${selectedPayroll.baseWorkDays || 26} ngày (${selectedPayroll.actualWorkHours || 0}h)`}
                    </div>
                  </div>
                </Col>

                <Col xs={12} sm={8}>
                  <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Lương theo công</Text>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#262626', marginTop: '2px' }}>
                      {new Intl.NumberFormat('vi-VN').format(selectedPayroll.calculatedSalary)} đ
                    </div>
                  </div>
                </Col>

                <Col xs={12} sm={6}>
                  <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Tổng Phụ cấp</Text>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1890ff', marginTop: '2px' }}>
                      +{new Intl.NumberFormat('vi-VN').format(selectedPayroll.totalAllowance)} đ
                    </div>
                  </div>
                </Col>

                <Col xs={12} sm={6}>
                  <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Tổng Khen thưởng</Text>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#52c41a', marginTop: '2px' }}>
                      +{new Intl.NumberFormat('vi-VN').format(selectedPayroll.bonusAmount)} đ
                    </div>
                  </div>
                </Col>

                <Col xs={12} sm={6}>
                  <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Khấu trừ</Text>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fa8c16', marginTop: '2px' }}>
                      -{new Intl.NumberFormat('vi-VN').format(selectedPayroll.totalDeduction)} đ
                    </div>
                  </div>
                </Col>

                <Col xs={12} sm={6}>
                  <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Xử phạt</Text>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff4d4f', marginTop: '2px' }}>
                      -{new Intl.NumberFormat('vi-VN').format(selectedPayroll.penaltyAmount)} đ
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Salary Breakdown Details */}
              <Card
                type="inner"
                title={
                  <Space style={{ fontSize: '15px', fontWeight: 'bold' }}>
                    <FileTextOutlined />
                    <span>Chi Tiết Các Khoản Lương / Phụ Cấp / Phạt</span>
                  </Space>
                }
                style={{ borderRadius: '12px', background: '#ffffff' }}
              >
                {selectedPayroll.salaryDetails && selectedPayroll.salaryDetails.length > 0 ? (
                  <Table
                    columns={detailColumns}
                    dataSource={selectedPayroll.salaryDetails}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có khoản bổ sung hoặc khấu trừ chi tiết nào"
                  />
                )}
              </Card>

              {selectedPayroll.note && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Ghi chú từ quản lý:</Text>
                  <div style={{ fontSize: '14px', color: '#595959', fontStyle: 'italic', marginTop: '2px' }}>
                    "{selectedPayroll.note}"
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default MyPayrollPage;
