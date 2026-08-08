import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Modal,
  Tag,
  Tooltip,
  message,
  Badge,
  Spin,
  Select,
  Form,
  Input,
  DatePicker,
  Radio,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SwapOutlined,
  FileTextOutlined,
  CheckOutlined,
  BellOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { getMyWorkSchedules, getAllWorkSchedules, updateWorkSchedule, requestLeave, requestShiftSwap } from '../api/workScheduleApi';
import { getAllBranches } from '../api/branchApi';
import { getAllShifts } from '../api/shiftApi';
import { getAllAccounts } from '../api/accountApi';
import { useAuth } from '../context/AuthContext';

const MyWorkSchedulePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs());
  
  // Modal detail states
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Transfer modal states
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferForm] = Form.useForm();

  // Leave modal states
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let scheds = [];
      try {
        const resAll = await getAllWorkSchedules();
        scheds = resAll.data || [];
      } catch (e) {
        const resMine = await getMyWorkSchedules();
        scheds = resMine.data || [];
      }
      const [branchesRes, shiftsRes, accountsRes] = await Promise.all([
        getAllBranches(),
        getAllShifts(),
        getAllAccounts(),
      ]);
      setSchedules(scheds);
      setBranches(branchesRes.data || []);
      setShifts(shiftsRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải lịch làm việc của bạn hoặc thông tin ca trực!');
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccountName = (id) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? acc.name : `Nhân viên #${id}`;
  };

  const handleOpenTransfer = () => {
    setDetailModalOpen(false);
    transferForm.resetFields();
    setTransferModalOpen(true);
  };

  const handleOpenLeaveModal = (type = 'day', schedule = null) => {
    setDetailModalOpen(false);
    leaveForm.resetFields();
    leaveForm.setFieldsValue({
      type,
      workDate: schedule ? dayjs(schedule.workDate) : dayjs(),
      shiftScheduleId: schedule ? schedule.id : undefined,
    });
    setLeaveModalOpen(true);
  };

  const handleLeaveSubmit = async (values) => {
    setLeaveLoading(true);
    try {
      if (values.type === 'shift') {
        const targetShift = selectedSchedule || schedules.find(s => s.id === values.shiftScheduleId);
        if (!targetShift) {
          message.warning('Vui lòng chọn ca cần xin nghỉ!');
          setLeaveLoading(false);
          return;
        }
        const payload = {
          workScheduleId: targetShift.id,
          reason: values.reason || 'Xin nghỉ ca'
        };
        await requestLeave(payload);
        message.success('🟢 Đã gửi đơn xin nghỉ ca làm việc! Chờ Quản lý / Admin duyệt.');
      } else {
        const targetDateStr = dayjs(values.workDate).format('YYYY-MM-DD');
        const mySchedulesOnDay = schedules.filter(s => dayjs(s.workDate).format('YYYY-MM-DD') === targetDateStr && s.accountId === (user?.id || s.accountId));
        if (mySchedulesOnDay.length === 0) {
          message.warning('Ngày bạn chọn không có ca làm việc nào!');
          setLeaveLoading(false);
          return;
        }
        await Promise.all(mySchedulesOnDay.map(s => requestLeave({
          workScheduleId: s.id,
          reason: values.reason || 'Xin nghỉ phép ngày'
        })));
        message.success(`🟢 Đã gửi đơn xin nghỉ ngày ${targetDateStr} (${mySchedulesOnDay.length} ca)! Chờ Admin duyệt.`);
      }
      setLeaveModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi gửi đơn xin nghỉ!');
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleTransferSubmit = async (values) => {
    if (!selectedSchedule) return;
    setTransferLoading(true);
    try {
      const targetAccount = accounts.find((a) => a.id === values.targetAccountId);
      const workDateStr = dayjs(selectedSchedule.workDate).format('YYYY-MM-DD');
      
      const payload = {
        workScheduleId: selectedSchedule.id,
        targetAccountId: values.targetAccountId,
        note: values.note || 'Đổi ca'
      };

      await requestShiftSwap(payload);
      message.success(`🟢 Đã gửi yêu cầu đổi ca cho nhân viên ${targetAccount ? targetAccount.name : values.targetAccountId}! Chờ nhân viên đồng ý.`);
      setTransferModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi chuyển ca!';
      message.error(errorMsg);
    } finally {
      setTransferLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getBranchName = (id) => {
    const br = branches.find((b) => b.id === id);
    return br ? br.name : `Chi nhánh #${id}`;
  };

  const getShiftDetails = (id) => {
    const sh = shifts.find((s) => s.id === id);
    if (!sh) return { name: `Ca #${id}`, time: '', startTime: '00:00', endTime: '23:59' };
    const start = sh.startTime ? sh.startTime.substring(0, 5) : '--:--';
    const end = sh.endTime ? sh.endTime.substring(0, 5) : '--:--';
    return { name: sh.name, time: `${start} - ${end}`, startTime: sh.startTime, endTime: sh.endTime };
  };

  // Week calculation (ISO standard: Monday is first day of the week)
  const day = currentDate.day();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = currentDate.add(diffToMonday, 'day').startOf('day');
  const sunday = monday.add(6, 'day').endOf('day');

  const handlePrevWeek = () => {
    setCurrentDate(currentDate.subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentDate(currentDate.add(1, 'week'));
  };

  const getWeekLabel = () => {
    const today = dayjs();
    const todayDay = today.day();
    const todayDiffToMonday = todayDay === 0 ? -6 : 1 - todayDay;
    const currentMonday = today.add(todayDiffToMonday, 'day').startOf('day');
    
    const diffWeeks = monday.diff(currentMonday, 'week');
    if (diffWeeks === 0) return 'Tuần này';
    if (diffWeeks === 1) return 'Tuần sau';
    if (diffWeeks === -1) return 'Tuần trước';
    
    // Relative range view label
    return `Tuần từ ${monday.format('DD/MM/YYYY')}`;
  };

  const getShiftStatusTextAndColor = (record, shift) => {
    if (!shift) return { text: 'N/A', color: '#ffffff' };
    
    const now = dayjs();
    const workDateStr = dayjs(record.workDate).format('YYYY-MM-DD');
    
    const startStr = shift.startTime ? shift.startTime.substring(0, 5) : '00:00';
    const endStr = shift.endTime ? shift.endTime.substring(0, 5) : '23:59';
    const shiftStart = dayjs(`${workDateStr} ${startStr}`);
    const shiftEnd = dayjs(`${workDateStr} ${endStr}`);

    if (record.status?.startsWith('LEAVE_REQUEST')) {
      return { text: 'Đang xin nghỉ', color: '#ff4d4f' }; // Red/pink
    }
    if (record.status === 'LEAVE_APPROVED') {
      return { text: 'Đã nghỉ (Duyệt)', color: '#9c27b0' }; // Purple
    }
    if (record.status?.startsWith('TRANSFER_PENDING_EMP')) {
      return { text: 'Chờ NV nhận ca', color: '#ffa940' }; // Orange
    }
    if (record.status?.startsWith('TRANSFER_PENDING_ADMIN')) {
      return { text: 'Chờ Admin duyệt', color: '#fa8c16' }; // Gold
    }

    if (record.checkInAt && record.checkOutAt) {
      return { text: 'Hoàn thành', color: '#39f379' }; // Bright green for overlay
    }
    
    if (record.checkInAt && !record.checkOutAt) {
      return { text: 'Đang làm', color: '#ffa940' }; // Bright orange
    }

    if (record.status === 'ABSENT') {
      return { text: 'Vắng mặt', color: '#ff7875' }; // Bright red
    }

    if (now.isAfter(shiftEnd)) {
      return { text: 'Trễ/Vắng mặt', color: '#ff7875' };
    }

    const isFutureDay = dayjs(workDateStr).isAfter(now, 'day');
    if (isFutureDay || now.isBefore(shiftStart.subtract(30, 'minute'))) {
      return { text: 'Chưa đến giờ', color: '#ffffff' };
    }

    return { text: 'Chấm công', color: '#39f379' }; // Ready for attendance
  };

  // Generate 7 days for the current week list
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(monday.add(i, 'day'));
  }

  const getDayLabel = (date) => {
    const d = date.day();
    if (d === 0) return 'Chủ Nhật';
    return `Thứ ${d + 1}`;
  };

  const handleShiftClick = (record) => {
    setSelectedSchedule(record);
    setDetailModalOpen(true);
  };

  return (
    <div className="my-work-schedule-page animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
      
      {/* Header matching screenshot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined style={{ fontSize: '18px' }} />} 
          onClick={() => navigate('/home')} 
        />
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#000' }}>
          Lịch làm việc
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button 
            type="primary" 
            style={{ background: '#722ed1', borderColor: '#722ed1', fontWeight: 'bold', borderRadius: '6px' }}
            icon={<FileTextOutlined />}
            onClick={() => handleOpenLeaveModal('day')}
          >
            Xin nghỉ
          </Button>
          <Button 
            type="text" 
            icon={<ReloadOutlined style={{ fontSize: '16px' }} />} 
            onClick={loadData}
            loading={loading}
          />
        </div>
      </div>

      {/* 🔔 Yêu cầu chuyển ca cho Nhân viên (Bước 2: NV đồng ý) */}
      {schedules
        .filter((s) => s.accountId === user?.id && s.status?.startsWith('TRANSFER_PENDING_EMP'))
        .map((item) => {
          const parts = (item.status || '').split(':');
          const senderId = Number(parts[1]) || 'Đồng nghiệp';
          const senderName = getAccountName(senderId);
          const shiftInfo = getShiftDetails(item.shiftId);
          return (
            <div
              key={item.id}
              style={{
                background: '#fff7e6',
                border: '2px solid #ffa940',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(255,169,64,0.15)',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#d46b08', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BellOutlined /> LỜI MỜI NHẬN CA LÀM VIỆC (CHỜ BẠN ĐỒNG Ý)
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px', color: '#000' }}>
                  Nhân viên <strong>{senderName}</strong> muốn chuyển ca <strong>{shiftInfo.name} ({shiftInfo.time})</strong> ngày <strong>{dayjs(item.workDate).format('DD/MM/YYYY')}</strong> cho bạn.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  type="primary"
                  size="small"
                  style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 'bold', borderRadius: '4px' }}
                  icon={<CheckOutlined />}
                  onClick={async () => {
                    try {
                      await updateWorkSchedule({ ...item, status: `TRANSFER_PENDING_ADMIN:${senderId}:${item.accountId}`, managerApproved: false });
                      message.success('🟢 Bạn đã ĐỒNG Ý nhận ca! Yêu cầu đã được chuyển lên Admin phê duyệt.');
                      loadData();
                    } catch (e) {
                      message.error('Lỗi khi đồng ý ca!');
                    }
                  }}
                >
                  Đồng ý nhận ca
                </Button>
                <Button
                  danger
                  size="small"
                  style={{ borderRadius: '4px', fontWeight: 'bold' }}
                  onClick={async () => {
                    try {
                      await updateWorkSchedule({ ...item, accountId: senderId, status: 'APPROVED', managerApproved: true });
                      message.info('❌ Đã từ chối nhận ca làm việc.');
                      loadData();
                    } catch (e) {
                      message.error('Lỗi khi từ chối!');
                    }
                  }}
                >
                  Từ chối
                </Button>
              </div>
            </div>
          );
        })}

      {/* 👑 Khu vực Admin / Quản lý Phê duyệt Đơn xin nghỉ & Đổi ca */}
      {(schedules.some((s) => s.status?.startsWith('LEAVE_REQUEST') || s.status?.startsWith('TRANSFER_PENDING_ADMIN'))) && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cf1322', fontSize: '15px', fontWeight: 'bold' }}>
              <SafetyCertificateOutlined />
              <span>DUYỆT ĐƠN XIN NGHỈ & ĐỔI CA (ADMIN / QUẢN LÝ)</span>
            </div>
          }
          style={{ marginBottom: '20px', border: '2px solid #cf1322', borderRadius: '8px', background: '#fff1f0' }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Đơn xin nghỉ */}
            {schedules.filter((s) => s.status?.startsWith('LEAVE_REQUEST')).map((item) => {
              const parts = (item.status || '').split(':');
              const reason = parts.slice(1).join(':') || 'Xin nghỉ phép';
              const empName = getAccountName(item.accountId);
              const shiftInfo = getShiftDetails(item.shiftId);
              return (
                <div key={item.id} style={{
                  background: '#fff', border: '1px solid #ffccc7', borderRadius: '6px', padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                }}>
                  <div>
                    <Tag color="purple">🕒 XIN NGHỈ</Tag>
                    <strong>{empName}</strong> xin nghỉ ca <strong>{shiftInfo.name} ({shiftInfo.time})</strong> ngày <strong>{dayjs(item.workDate).format('DD/MM/YYYY')}</strong>.
                    <div style={{ fontSize: '13px', color: '#595959', marginTop: 4 }}>💬 Lý do: <em>{reason}</em></div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button type="primary" size="small" style={{ background: '#722ed1', borderColor: '#722ed1', fontWeight: 'bold' }} onClick={async () => {
                      try {
                        await updateWorkSchedule({ ...item, status: 'LEAVE_APPROVED', managerApproved: true });
                        message.success(`🟢 Đã duyệt cho nhân viên ${empName} nghỉ làm ca này!`);
                        loadData();
                      } catch (e) { message.error('Lỗi khi duyệt nghỉ!'); }
                    }}>
                      Duyệt nghỉ
                    </Button>
                    <Button danger size="small" onClick={async () => {
                      try {
                        await updateWorkSchedule({ ...item, status: 'APPROVED', managerApproved: true });
                        message.info(`❌ Đã từ chối đơn xin nghỉ của ${empName}.`);
                        loadData();
                      } catch (e) { message.error('Lỗi từ chối!'); }
                    }}>
                      Từ chối
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Đơn đổi ca (đã 2 bên đồng ý) */}
            {schedules.filter((s) => s.status?.startsWith('TRANSFER_PENDING_ADMIN')).map((item) => {
              const parts = (item.status || '').split(':');
              const senderId = Number(parts[1]) || item.accountId;
              const senderName = getAccountName(senderId);
              const receiverName = getAccountName(item.accountId);
              const shiftInfo = getShiftDetails(item.shiftId);
              return (
                <div key={item.id} style={{
                  background: '#fff', border: '1px solid #ffe58f', borderRadius: '6px', padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                }}>
                  <div>
                    <Tag color="gold">🔄 ĐỔI CA LÀM</Tag>
                    <strong>{senderName}</strong> ➔ <strong>{receiverName}</strong> (2 NV đã đồng ý).
                    <div style={{ fontSize: '13px', color: '#595959', marginTop: 4 }}>
                      📅 Ca: <strong>{shiftInfo.name} ({shiftInfo.time})</strong> - Ngày: <strong>{dayjs(item.workDate).format('DD/MM/YYYY')}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button type="primary" size="small" style={{ background: '#fa8c16', borderColor: '#fa8c16', fontWeight: 'bold' }} onClick={async () => {
                      try {
                        await updateWorkSchedule({ ...item, status: 'APPROVED', managerApproved: true });
                        message.success(`🟢 Đã duyệt đổi ca chính thức cho ${receiverName}!`);
                        loadData();
                      } catch (e) { message.error('Lỗi khi duyệt đổi ca!'); }
                    }}>
                      Duyệt đổi ca
                    </Button>
                    <Button danger size="small" onClick={async () => {
                      try {
                        await updateWorkSchedule({ ...item, accountId: senderId, status: 'APPROVED', managerApproved: true });
                        message.info('❌ Đã từ chối yêu cầu đổi ca.');
                        loadData();
                      } catch (e) { message.error('Lỗi từ chối!'); }
                    }}>
                      Từ chối
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Week Selector Container */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        border: '2px solid #000000',
        borderRadius: '6px',
        marginBottom: '20px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Button
          type="text"
          style={{ height: 'auto', borderRadius: 0, padding: '12px 18px', background: '#e0e0e0', borderRight: '2px solid #000000' }}
          icon={<ArrowLeftOutlined style={{ fontSize: '16px', fontWeight: 'bold' }} />}
          onClick={handlePrevWeek}
        />
        <div style={{
          flex: 1,
          textAlign: 'center',
          padding: '10px 0',
          background: '#dcdcdc',
          color: '#000000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{getWeekLabel()}</div>
          <div style={{ fontSize: '14px', marginTop: '2px', letterSpacing: '0.5px' }}>
            {monday.format('DD/MM/YYYY')} - {sunday.format('DD/MM/YYYY')}
          </div>
        </div>
        <Button
          type="text"
          style={{ height: 'auto', borderRadius: 0, padding: '12px 18px', background: '#e0e0e0', borderLeft: '2px solid #000000' }}
          icon={<ArrowRightOutlined style={{ fontSize: '16px', fontWeight: 'bold' }} />}
          onClick={handleNextWeek}
        />
      </div>

      {/* Day List */}
      <Spin spinning={loading}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {weekDays.map((dayItem) => {
            const dateStr = dayItem.format('YYYY-MM-DD');
            const daySchedules = schedules.filter(
              (item) => dayjs(item.workDate).format('YYYY-MM-DD') === dateStr
            );

            return (
              <div 
                key={dateStr}
                style={{
                  background: '#ffffff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  padding: '16px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                {/* Day Header row */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '14px',
                  color: '#000000'
                }}>
                  <span style={{ fontWeight: '500', fontSize: '16px' }}>{getDayLabel(dayItem)}</span>
                  <span style={{ fontSize: '14px' }}>{dayItem.format('DD/MM/YYYY')}</span>
                </div>

                {/* Grid for shifts on this day */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {daySchedules.length > 0 ? (
                    daySchedules.map((item) => {
                      const shiftInfo = getShiftDetails(item.shiftId);
                      const statusDetails = getShiftStatusTextAndColor(item, shiftInfo);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleShiftClick(item)}
                          style={{
                            background: '#1890ff', // Vivid blue block matching photo layout
                            border: '1px solid #000000', // Black thin border
                            borderRadius: '4px',
                            padding: '10px 14px',
                            minWidth: '160px',
                            flex: '1',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(30,136,229,0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>
                            {shiftInfo.name} ({shiftInfo.time})
                          </div>
                          <div style={{ 
                            color: statusDetails.color, 
                            fontSize: '13px', 
                            marginTop: '4px', 
                            fontWeight: 'bold' 
                          }}>
                            {statusDetails.text}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ 
                      color: '#bfbfbf', 
                      fontStyle: 'italic', 
                      fontSize: '13px',
                      padding: '4px 0' 
                    }}>
                      Không có ca trực
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Spin>

      {/* Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '18px', color: '#1e88e5' }}>
            <CalendarOutlined />
            <span>CHI TIẾT CA LÀM VIỆC</span>
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={(() => {
          const shiftInfo = selectedSchedule ? getShiftDetails(selectedSchedule.shiftId) : null;
          let isShiftPast = false;
          if (selectedSchedule && shiftInfo && shiftInfo.endTime) {
            const dateStr = dayjs(selectedSchedule.workDate).format('YYYY-MM-DD');
            const endStr = shiftInfo.endTime.length > 5 ? shiftInfo.endTime : `${shiftInfo.endTime}:00`;
            isShiftPast = dayjs(`${dateStr} ${endStr}`).isBefore(dayjs());
          }
          
          return [
            <Button
              key="leave"
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => handleOpenLeaveModal('shift', selectedSchedule)}
              style={{ background: '#722ed1', borderColor: '#722ed1', fontWeight: 'bold' }}
            >
              Xin nghỉ ca này
            </Button>,
            <Tooltip title={isShiftPast ? "Ca làm việc đã kết thúc, không thể chuyển ca." : ""} key="transfer-tooltip">
              <Button
                key="transfer"
                type="primary"
                icon={<SwapOutlined />}
                onClick={handleOpenTransfer}
                disabled={isShiftPast}
                style={{ 
                  background: isShiftPast ? '#d9d9d9' : '#fa8c16', 
                  borderColor: isShiftPast ? '#d9d9d9' : '#fa8c16', 
                  fontWeight: 'bold',
                  color: isShiftPast ? '#8c8c8c' : '#fff'
                }}
              >
                Đổi ca
              </Button>
            </Tooltip>,
            <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)} style={{ background: '#1890ff', borderColor: '#1890ff' }}>
              Đóng
            </Button>
          ];
        })()}
        width={420}
      >
        {selectedSchedule && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div>
              <strong>Chi nhánh:</strong> {getBranchName(selectedSchedule.branchId)}
            </div>
            <div>
              <strong>Ca trực:</strong> {getShiftDetails(selectedSchedule.shiftId).name} ({getShiftDetails(selectedSchedule.shiftId).time})
            </div>
            <div>
              <strong>Ngày làm việc:</strong> {dayjs(selectedSchedule.workDate).format('DD/MM/YYYY dddd')}
            </div>
            <div>
              <strong>Nhân viên trực:</strong> {getAccountName(selectedSchedule.accountId)}
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
              <strong>Thời gian ghi nhận thực tế:</strong>
              <div style={{ paddingLeft: '12px', marginTop: '4px' }}>
                <div>Vào ca: {selectedSchedule.checkInAt ? dayjs(selectedSchedule.checkInAt).format('HH:mm:ss dddd DD/MM') : '—'}</div>
                <div>Ra ca: {selectedSchedule.checkOutAt ? dayjs(selectedSchedule.checkOutAt).format('HH:mm:ss dddd DD/MM') : '—'}</div>
                {selectedSchedule.actualHours !== null && (
                  <div style={{ color: '#52c41a', fontWeight: 'bold', marginTop: '4px' }}>
                    Tổng giờ công: {selectedSchedule.actualHours} giờ
                  </div>
                )}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Phê duyệt của quản lý:</strong>
              {selectedSchedule.managerApproved ? (
                <Tag icon={<CheckCircleOutlined />} color="success">Đã duyệt công</Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="warning">Chờ duyệt công</Tag>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Transfer Shift Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '18px', color: '#fa8c16' }}>
            <SwapOutlined />
            <span>CHUYỂN CA LÀM VIỆC</span>
          </div>
        }
        open={transferModalOpen}
        onCancel={() => setTransferModalOpen(false)}
        footer={null}
        width={450}
        destroyOnClose
      >
        {selectedSchedule && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '6px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#595959'
            }}>
              <div style={{ fontWeight: 'bold', color: '#d46b08', marginBottom: '6px', fontSize: '15px' }}>
                Thông tin ca cần chuyển:
              </div>
              <div><strong>Chi nhánh:</strong> {getBranchName(selectedSchedule.branchId)}</div>
              <div><strong>Ca trực:</strong> {getShiftDetails(selectedSchedule.shiftId).name} ({getShiftDetails(selectedSchedule.shiftId).time})</div>
              <div><strong>Ngày làm việc:</strong> {dayjs(selectedSchedule.workDate).format('DD/MM/YYYY (dddd)')}</div>
              <div><strong>Nhân viên hiện tại:</strong> {getAccountName(selectedSchedule.accountId)}</div>
            </div>

            <Form
              form={transferForm}
              layout="vertical"
              onFinish={handleTransferSubmit}
            >
              <Form.Item
                name="targetAccountId"
                label={<span style={{ fontWeight: '600', fontSize: '14px', color: '#000' }}>Chọn nhân viên nhận ca:</span>}
                rules={[{ required: true, message: 'Vui lòng chọn nhân viên muốn chuyển ca!' }]}
              >
                <Select
                  showSearch
                  placeholder="Tìm kiếm theo tên nhân viên..."
                  optionFilterProp="children"
                  size="large"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={accounts
                    .filter((acc) => acc.id !== selectedSchedule.accountId)
                    .map((acc) => ({
                      value: acc.id,
                      label: `${acc.name} ${acc.phone ? `(${acc.phone})` : ''} - ID #${acc.id}`,
                    }))}
                />
              </Form.Item>

              <Form.Item
                name="note"
                label={<span style={{ fontWeight: '600', fontSize: '14px', color: '#000' }}>Ghi chú / Lý do chuyển ca (tùy chọn):</span>}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập lý do chuyển ca hoặc lời nhắn gửi đồng nghiệp..."
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <Button 
                  size="large" 
                  onClick={() => setTransferModalOpen(false)}
                  style={{ borderRadius: '6px' }}
                >
                  Hủy
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  loading={transferLoading}
                  icon={<SwapOutlined />}
                  style={{ background: '#fa8c16', borderColor: '#fa8c16', fontWeight: 'bold', borderRadius: '6px', color: '#fff' }}
                >
                  Xác nhận chuyển ca
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Leave Request Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '18px', color: '#722ed1' }}>
            <FileTextOutlined />
            <span>TẠO ĐƠN XIN NGHỈ PHÉP</span>
          </div>
        }
        open={leaveModalOpen}
        onCancel={() => setLeaveModalOpen(false)}
        footer={null}
        width={450}
        destroyOnClose
      >
        <Form
          form={leaveForm}
          layout="vertical"
          onFinish={handleLeaveSubmit}
          initialValues={{ type: 'day', workDate: dayjs() }}
        >
          <Form.Item name="type" label={<span style={{ fontWeight: 600 }}>Hình thức nghỉ:</span>}>
            <Radio.Group buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
              <Radio.Button value="day" style={{ flex: 1, textAlign: 'center' }}>Nghỉ theo ngày (nhiều ca)</Radio.Button>
              <Radio.Button value="shift" style={{ flex: 1, textAlign: 'center' }}>Nghỉ theo ca cụ thể</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type === 'day') {
                return (
                  <Form.Item
                    name="workDate"
                    label={<span style={{ fontWeight: 600 }}>Chọn ngày xin nghỉ (Tất cả ca trong ngày):</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn ngày xin nghỉ!' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
                  </Form.Item>
                );
              }
              return (
                <Form.Item
                  name="shiftScheduleId"
                  label={<span style={{ fontWeight: 600 }}>Chọn ca trực muốn xin nghỉ:</span>}
                  rules={[{ required: true, message: 'Vui lòng chọn ca!' }]}
                >
                  <Select
                    size="large"
                    placeholder="Chọn ca trực..."
                    options={schedules
                      .filter(s => (s.accountId === (user?.id || s.accountId)) && s.status !== 'ABSENT' && s.status !== 'LEAVE_APPROVED')
                      .map(s => {
                        const sh = getShiftDetails(s.shiftId);
                        return {
                          value: s.id,
                          label: `${dayjs(s.workDate).format('DD/MM')} - ${sh.name} (${sh.time})`,
                        };
                      })}
                    onChange={(val) => {
                      const found = schedules.find(s => s.id === val);
                      if (found) setSelectedSchedule(found);
                    }}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            name="reason"
            label={<span style={{ fontWeight: 600 }}>Lý do xin nghỉ:</span>}
            rules={[{ required: true, message: 'Vui lòng nhập lý do xin nghỉ!' }]}
          >
            <Input.TextArea rows={3} placeholder="Ví dụ: Bận việc cá nhân, ốm đau..." style={{ borderRadius: '6px' }} />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <Button size="large" onClick={() => setLeaveModalOpen(false)} style={{ borderRadius: '6px' }}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={leaveLoading}
              icon={<FileTextOutlined />}
              style={{ background: '#722ed1', borderColor: '#722ed1', fontWeight: 'bold', borderRadius: '6px', color: '#fff' }}
            >
              Gửi đơn xin nghỉ
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MyWorkSchedulePage;
