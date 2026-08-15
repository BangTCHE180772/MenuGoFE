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
  
  const isManagerOrAdmin =
    user?.roles?.some((r) => ['Admin', 'Owner', 'ADMIN', 'OWNER', 'Quản trị viên', 'Quản lý', 'Manager'].includes(r)) ||
    user?.roleIds?.some((id) => [1, 2, 3].includes(id));

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
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn xin nghỉ!';
      message.error(errorMsg);
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

    // Lắng nghe event từ SignalR (dispatch ở MainLayout)
    const handleUpdate = () => loadData();
    window.addEventListener('work-schedule-updated', handleUpdate);

    return () => {
      window.removeEventListener('work-schedule-updated', handleUpdate);
    };
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

  const getShiftGradientClass = (shiftInfo, status) => {
    if (status === 'Absent') return 'shift-gradient-absent';
    if (status === 'Working' || status === 'Completed') return 'shift-gradient-working';
    if (status && (status.startsWith('LEAVE_REQUEST') || status.startsWith('TRANSFER'))) return 'shift-gradient-pending';
    
    const startHour = shiftInfo.startTime ? parseInt(shiftInfo.startTime.split(':')[0]) : 0;
    if (startHour < 12) return 'shift-gradient-morning';
    if (startHour < 18) return 'shift-gradient-afternoon';
    return 'shift-gradient-evening';
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
    <div className="my-work-schedule-page animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      
      {/* Header matching screenshot */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '16px 24px', borderRadius: '16px' }}>
        <Button 
          type="text" 
          shape="circle"
          size="large"
          icon={<ArrowLeftOutlined style={{ fontSize: '18px' }} />} 
          onClick={() => navigate('/home')} 
        />
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1f2937', letterSpacing: '-0.5px' }}>
          Lịch làm việc
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button 
            type="primary" 
            size="large"
            style={{ background: 'linear-gradient(135deg, #e8442a, #ff8c42)', border: 'none', fontWeight: 'bold', borderRadius: '12px', boxShadow: '0 4px 12px rgba(232, 68, 42, 0.3)' }}
            icon={<FileTextOutlined />}
            onClick={() => handleOpenLeaveModal('day')}
          >
            Xin nghỉ
          </Button>
          <Button 
            type="text" 
            shape="circle"
            size="large"
            icon={<ReloadOutlined style={{ fontSize: '18px', color: '#6b7280' }} />} 
            onClick={loadData}
            loading={loading}
          />
        </div>
      </div>
      {/* 📊 Tổng hợp tháng hiện tại */}
      {(() => {
        const now = dayjs();
        const monthStart = now.startOf('month');
        const monthEnd = now.endOf('month');
        const LATE_GRACE = 5; // phút
        const myMonthSchedules = schedules.filter((s) => {
          const d = dayjs(s.workDate);
          return !d.isBefore(monthStart, 'day') && !d.isAfter(monthEnd, 'day') && s.accountId === user?.id;
        });
        const totalScheduled = myMonthSchedules.length;
        let worked = 0, absent = 0, onTime = 0, late = 0, totalHours = 0;
        myMonthSchedules.forEach((s) => {
          const st = (s.status || '').toUpperCase();
          if (st === 'ABSENT' || st === 'VắNG MặT' || st === 'LEAVE_APPROVED' || st.startsWith('LEAVE_APPROVED')) {
            absent++;
          } else if (s.checkInAt) {
            worked++;
            totalHours += s.actualHours || 0;
            const sh = shifts.find((x) => x.id === s.shiftId);
            if (sh && sh.startTime) {
              const dateStr = dayjs(s.workDate).format('YYYY-MM-DD');
              const shiftStart = dayjs(`${dateStr} ${sh.startTime.substring(0, 5)}`);
              const checkIn = dayjs(s.checkInAt);
              if (checkIn.isAfter(shiftStart.add(LATE_GRACE, 'minute'))) late++;
              else onTime++;
            } else {
              onTime++;
            }
          }
        });
        if (totalScheduled === 0) return null;
        const stats = [
          { label: 'Ca phân', value: totalScheduled, color: '#4f46e5', bg: '#f5f3ff' },
          { label: 'Đi làm', value: worked, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Vắng', value: absent, color: '#dc2626', bg: '#fff1f0' },
          { label: 'Đúng giờ', value: onTime, color: '#0284c7', bg: '#f0f9ff' },
          { label: 'Muộn', value: late, color: '#d97706', bg: '#fffbeb' },
          { label: `${Number(totalHours).toFixed(1)}h`, value: null, color: '#7c3aed', bg: '#f5f3ff', isHours: true },
        ];
        return (
          <div
            style={{
              background: 'linear-gradient(135deg, #fafafa 0%, #f9f5ff 100%)',
              border: '1px solid #e9d5ff',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(124,58,237,0.08)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#6d28d9', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              📊 Tổng hợp tháng {now.format('MM/YYYY')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {stats.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.color}22`,
                    borderRadius: '8px',
                    padding: '10px 8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>
                    {s.isHours ? s.label : s.value}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    {s.isHours ? 'Tổng giờ công' : s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
      {isManagerOrAdmin && (schedules.some((s) => s.status?.startsWith('LEAVE_REQUEST') || s.status?.startsWith('TRANSFER_PENDING'))) && (
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

            {/* Đơn đổi ca (đang xử lý) */}
            {schedules.filter((s) => s.status?.startsWith('TRANSFER_PENDING')).map((item) => {
              const parts = (item.status || '').split(':');
              const isPendingEmp = item.status.startsWith('TRANSFER_PENDING_EMP');
              const senderId = Number(parts[1]) || (isPendingEmp ? undefined : item.accountId);
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
                    <strong>{senderName}</strong> ➔ <strong>{receiverName}</strong> 
                    {isPendingEmp ? (
                      <span style={{ color: '#fa8c16', marginLeft: 8 }}>(Đang chờ {receiverName} xác nhận)</span>
                    ) : (
                      <span style={{ color: '#52c41a', marginLeft: 8 }}>(2 NV đã đồng ý)</span>
                    )}
                    <div style={{ fontSize: '13px', color: '#595959', marginTop: 4 }}>
                      📅 Ca: <strong>{shiftInfo.name} ({shiftInfo.time})</strong> - Ngày: <strong>{dayjs(item.workDate).format('DD/MM/YYYY')}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button type="primary" size="small" style={{ background: '#fa8c16', borderColor: '#fa8c16', fontWeight: 'bold' }} 
                      disabled={isPendingEmp}
                      onClick={async () => {
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
                        message.info('❌ Đã hủy/từ chối yêu cầu đổi ca.');
                        loadData();
                      } catch (e) { message.error('Lỗi từ chối!'); }
                    }}>
                      {isPendingEmp ? 'Hủy yêu cầu' : 'Từ chối'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Week Selector Container */}
      <div className="glass-card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px',
        marginBottom: '24px',
        padding: '16px 24px',
      }}>
        <Button
          shape="circle"
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={handlePrevWeek}
          style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '800', fontSize: '18px', color: '#1f2937' }}>
            {getWeekLabel()}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px', fontWeight: '500' }}>
            {monday.format('DD/MM/YYYY')} - {sunday.format('DD/MM/YYYY')}
          </div>
        </div>
        <Button
          shape="circle"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={handleNextWeek}
          style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        />
      </div>

      {/* Day List */}
      <Spin spinning={loading}>
        <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '16px', 
            minWidth: '1050px' 
          }}>
            {weekDays.map((dayItem, index) => {
            const dateStr = dayItem.format('YYYY-MM-DD');
            const daySchedules = schedules.filter(
              (item) => dayjs(item.workDate).format('YYYY-MM-DD') === dateStr
            );
            
            const isToday = dayItem.isSame(dayjs(), 'day');

            return (
              <div 
                key={dateStr}
                className="glass-card animate-fade-in-up"
                style={{
                  borderRadius: '16px',
                  padding: '20px',
                  animationDelay: `${index * 0.05}s`,
                  borderTop: isToday ? '4px solid #e8442a' : undefined
                }}
              >
                {/* Day Header row */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '16px',
                  color: isToday ? '#e8442a' : '#1f2937',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  paddingBottom: '12px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontWeight: '800', fontSize: '16px', textTransform: 'uppercase' }}>
                    {isToday ? 'Hôm nay' : getDayLabel(dayItem)}
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: '400', marginTop: '4px', color: isToday ? '#e8442a' : '#4b5563' }}>
                    {dayItem.format('DD')}
                  </span>
                </div>

                {/* Grid for shifts on this day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {daySchedules.length > 0 ? (
                    daySchedules.map((item) => {
                      const shiftInfo = getShiftDetails(item.shiftId);
                      const statusDetails = getShiftStatusTextAndColor(item, shiftInfo);
                      const gradientClass = getShiftGradientClass(shiftInfo, item.status);
                      
                      let isShiftPast = false;
                      if (shiftInfo && shiftInfo.endTime) {
                        const endStr = shiftInfo.endTime.length > 5 ? shiftInfo.endTime : `${shiftInfo.endTime}:00`;
                        isShiftPast = dayjs(`${dateStr} ${endStr}`).isBefore(dayjs());
                      }

                      return (
                        <div
                          key={item.id}
                          className={`shift-card ${gradientClass}`}
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleShiftClick(item)}
                        >
                          {(!isShiftPast && item.status !== 'Working' && item.status !== 'Completed') && (
                             <Tooltip title="Đổi ca nhanh">
                               <div 
                                 className="shift-action-btn"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setSelectedSchedule(item);
                                   handleOpenTransfer();
                                 }}
                               >
                                 <SwapOutlined />
                               </div>
                             </Tooltip>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                             <ClockCircleOutlined style={{ fontSize: '14px' }} />
                             <span style={{ fontWeight: '700', fontSize: '14px', lineHeight: 1.2 }}>
                               {shiftInfo.name}
                             </span>
                          </div>
                          
                          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>
                             {shiftInfo.time}
                          </div>
                          
                          <div style={{ 
                            background: 'rgba(0, 0, 0, 0.04)', 
                            padding: '4px 8px', 
                            borderRadius: '6px',
                            display: 'inline-block',
                            fontSize: '11px', 
                            fontWeight: '700',
                            border: '1px solid rgba(0,0,0,0.08)',
                            textTransform: 'uppercase'
                          }}>
                            {statusDetails.text}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ 
                      color: '#9ca3af', 
                      fontStyle: 'italic', 
                      fontSize: '14px',
                      textAlign: 'center',
                      padding: '24px 0',
                      background: 'rgba(249, 250, 251, 0.5)',
                      borderRadius: '12px',
                      border: '1px dashed #d1d5db'
                    }}>
                      Chưa có lịch làm việc
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
            <Tooltip title={isShiftPast ? "Ca làm việc đã kết thúc, không thể xin nghỉ." : ""} key="leave-tooltip">
              <Button
                key="leave"
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => handleOpenLeaveModal('shift', selectedSchedule)}
                disabled={isShiftPast}
                style={{ 
                  background: isShiftPast ? '#d9d9d9' : '#722ed1', 
                  borderColor: isShiftPast ? '#d9d9d9' : '#722ed1', 
                  fontWeight: 'bold',
                  color: isShiftPast ? '#8c8c8c' : '#fff'
                }}
              >
                Xin nghỉ ca này
              </Button>
            </Tooltip>,
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
              {(() => {
                const shiftDetails = getShiftDetails(selectedSchedule.shiftId);
                const statusInfo = getShiftStatusTextAndColor(selectedSchedule, shiftDetails);
                
                if (statusInfo.text === 'Trễ/Vắng mặt' || statusInfo.text === 'Vắng mặt') {
                  return <Tag color="error">Trễ/Vắng mặt</Tag>;
                }
                if (statusInfo.text === 'Chưa đến giờ') {
                  return <Tag color="default">Chưa làm</Tag>;
                }
                
                if (selectedSchedule.managerApproved) {
                  return <Tag icon={<CheckCircleOutlined />} color="success">Đã duyệt công</Tag>;
                }
                return <Tag icon={<CloseCircleOutlined />} color="warning">Chờ duyệt công</Tag>;
              })()}
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
                    .filter((acc) => {
                      if (acc.id === selectedSchedule.accountId) return false;
                      const currentAccount = accounts.find(a => a.id === selectedSchedule.accountId);
                      const currentRoles = currentAccount?.roleIds || [];
                      const accRoles = acc.roleIds || [];
                      
                      // Cannot swap with Admin(1), Owner(2), Manager(3)
                      const isAdminOrManager = accRoles.some(r => [1, 2, 3].includes(r));
                      if (isAdminOrManager) return false;

                      // Must have at least one shared role
                      const hasSharedRole = currentRoles.some(r => accRoles.includes(r));
                      return hasSharedRole;
                    })
                    .map((acc) => ({
                      value: acc.id,
                      label: `${acc.name} ${acc.phone ? `(${acc.phone})` : ''}`,
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
                    <DatePicker 
                      style={{ width: '100%' }} 
                      format="DD/MM/YYYY" 
                      size="large" 
                      disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
                    />
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
                      .filter(s => {
                        const sh = getShiftDetails(s.shiftId);
                        if (!sh || !sh.endTime) return true;
                        const dateStr = dayjs(s.workDate).format('YYYY-MM-DD');
                        const endStr = sh.endTime.length > 5 ? sh.endTime : `${sh.endTime}:00`;
                        return !dayjs(`${dateStr} ${endStr}`).isBefore(dayjs());
                      })
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
