import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Tag,
  Tooltip,
  message,
  Badge,
  Tabs,
  Calendar,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SolutionOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getMyWorkSchedules } from '../api/workScheduleApi';
import { getAllBranches } from '../api/branchApi';
import { getAllShifts } from '../api/shiftApi';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ thực hiện (Pending)', color: 'warning' },
  { value: 'APPROVED', label: 'Đã duyệt (Approved)', color: 'processing' },
  { value: 'COMPLETED', label: 'Hoàn thành (Completed)', color: 'success' },
  { value: 'ABSENT', label: 'Vắng mặt (Absent)', color: 'error' },
];

const MyWorkSchedulePage = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesRes, branchesRes, shiftsRes] = await Promise.all([
        getMyWorkSchedules(),
        getAllBranches(),
        getAllShifts(),
      ]);
      setSchedules(schedulesRes.data || []);
      setBranches(branchesRes.data || []);
      setShifts(shiftsRes.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải lịch làm việc của bạn hoặc thông tin ca trực!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getBranchName = (id) => {
    const br = branches.find((b) => b.id === id);
    return br ? br.name : `Chi nhánh #${id}`;
  };

  const getShiftDetails = (id) => {
    const sh = shifts.find((s) => s.id === id);
    if (!sh) return { name: `Ca #${id}`, time: '', color: '#ff7a45' };
    const start = sh.startTime ? sh.startTime.substring(0, 5) : '--:--';
    const end = sh.endTime ? sh.endTime.substring(0, 5) : '--:--';
    return { name: sh.name, time: `${start} - ${end}`, color: '#ff7a45' };
  };

  // Monthly calendar cell renderer
  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const daySchedules = schedules.filter((item) => {
      return dayjs(item.workDate).format('YYYY-MM-DD') === dateStr;
    });

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {daySchedules.map((item) => {
          const shiftInfo = getShiftDetails(item.shiftId);
          const statusOpt = STATUS_OPTIONS.find((s) => s.value === item.status) || { color: 'default' };
          
          return (
            <li
              key={item.id}
              style={{
                margin: '2px 0',
                padding: '2px 6px',
                borderRadius: '4px',
                background: item.managerApproved ? '#f6ffed' : '#fffbe6',
                borderLeft: `3px solid ${item.managerApproved ? '#52c41a' : '#faad14'}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                fontSize: '11px',
              }}
            >
              <Tooltip
                title={
                  <div>
                    <p style={{ margin: 0 }}><strong>Ca trực:</strong> {shiftInfo.name} ({shiftInfo.time})</p>
                    <p style={{ margin: 0 }}><strong>Chi nhánh:</strong> {getBranchName(item.branchId)}</p>
                    <p style={{ margin: 0 }}><strong>Duyệt:</strong> {item.managerApproved ? 'Đã duyệt công' : 'Chờ duyệt'}</p>
                    {item.actualHours !== null && <p style={{ margin: 0 }}><strong>H.Thực tế:</strong> {item.actualHours}h</p>}
                  </div>
                }
              >
                <div>
                  <strong style={{ color: '#262626' }}>{shiftInfo.name}</strong>
                  <div style={{ color: '#8c8c8c', fontSize: '10px' }}>{shiftInfo.time}</div>
                  <Badge 
                    status={item.managerApproved ? 'success' : 'warning'} 
                    text={<span style={{ fontSize: '9px', color: '#595959' }}>{item.managerApproved ? 'Được duyệt' : 'Chờ duyệt'}</span>} 
                  />
                </div>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    );
  };

  const columns = [
    {
      title: 'Mã lịch trực',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{code || 'N/A'}</span>,
      width: 140,
    },
    {
      title: 'Chi nhánh làm việc',
      dataIndex: 'branchId',
      key: 'branchId',
      render: (id) => <strong>{getBranchName(id)}</strong>,
    },
    {
      title: 'Ca làm việc',
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
      defaultSortOrder: 'descend',
    },
    {
      title: 'Giờ check-in/out thực tế',
      key: 'actualTime',
      render: (_, record) => {
        const inTime = record.checkInAt ? dayjs(record.checkInAt).format('HH:mm') : '--';
        const outTime = record.checkOutAt ? dayjs(record.checkOutAt).format('HH:mm') : '--';
        return (
          <div>
            <div>Vào: {inTime} - Ra: {outTime}</div>
            {record.actualHours !== null && (
              <div style={{ fontSize: '11px', color: '#52c41a', fontWeight: '500' }}>
                Tổng giờ công: {record.actualHours} giờ
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Trạng thái ca trực',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const opt = STATUS_OPTIONS.find((s) => s.value === status) || { label: status, color: 'default' };
        return <Tag color={opt.color}>{opt.label}</Tag>;
      },
    },
    {
      title: 'Quản lý phê duyệt',
      dataIndex: 'managerApproved',
      key: 'approved',
      align: 'center',
      render: (approved) => (
        <Tooltip title={approved ? 'Đã được quản lý phê duyệt công' : 'Chờ quản lý kiểm tra và phê duyệt'}>
          {approved ? (
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ borderRadius: '12px' }}>
              Đã duyệt
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="warning" style={{ borderRadius: '12px' }}>
              Chờ duyệt
            </Tag>
          )}
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="my-work-schedule-page animate-fade-in" style={{ padding: '0px 0' }}>
      {/* Header Card */}
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
                Lịch Làm Việc Của Tôi
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                Theo dõi ca làm việc, thời gian check-in/out và trạng thái phê duyệt giờ công của bạn.
              </p>
            </div>
          </div>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadData();
              message.success('Đã làm mới lịch trực!');
            }}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* Navigation tabs for views */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        items={[
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
                  <span><Badge status="success" /> Ca trực đã duyệt công</span>
                  <span><Badge status="warning" /> Ca trực chờ phê duyệt</span>
                </div>
                <Calendar cellRender={dateCellRender} />
              </div>
            ),
          },
          {
            key: 'list',
            label: (
              <span>
                <HistoryOutlined /> Lịch sử ca trực (Dạng bảng)
              </span>
            ),
            children: (
              <Table
                columns={columns}
                dataSource={schedules}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                bordered
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default MyWorkSchedulePage;
