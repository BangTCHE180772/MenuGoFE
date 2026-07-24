import React, { useState, useEffect, useCallback } from 'react';
import { Result, Button, Spin, Alert, Tabs, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { TableOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import TableMapPage from './TableMapPage';
import OrderPage from './OrderPage';
import { useAuth } from '../context/AuthContext';
import { getMyWorkSchedules } from '../api/workScheduleApi';
import { getAllShifts } from '../api/shiftApi';

const WaiterMobileSessionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [shiftInfo, setShiftInfo] = useState(null);
  const [denyReason, setDenyReason] = useState('');
  const [activeTab, setActiveTab] = useState('tablemap');

  const checkAttendanceAndShift = useCallback(async () => {
    try {
      setLoading(true);
      const [schedulesRes, shiftsRes] = await Promise.all([
        getMyWorkSchedules(),
        getAllShifts()
      ]);

      const schedules = schedulesRes.data || [];
      const shifts = shiftsRes.data || [];

      const todayStr = dayjs().format('YYYY-MM-DD');
      const todaySchedules = schedules.filter(s => dayjs(s.workDate).format('YYYY-MM-DD') === todayStr);

      const checkedInSchedule = todaySchedules.find(s => s.checkInAt != null);

      if (!checkedInSchedule) {
        setAuthorized(false);
        setDenyReason('Bạn chưa thực hiện điểm danh (Check-in) ca làm việc hôm nay.');
        return;
      }

      const shift = shifts.find(sh => sh.id === checkedInSchedule.shiftId);
      const endStr = shift?.endTime ? shift.endTime.substring(0, 5) : '23:59';
      const shiftEndTime = dayjs(`${todayStr} ${endStr}`);
      const disconnectTime = shiftEndTime.add(30, 'minute');

      const now = dayjs();

      if (now.isAfter(disconnectTime)) {
        setAuthorized(false);
        setDenyReason('Ca làm việc hôm nay của bạn đã kết thúc quá 30 phút.');
        return;
      }

      setShiftInfo({
        name: shift?.name || 'Ca trực',
        time: `${shift?.startTime?.substring(0, 5)} - ${endStr}`,
        shiftEndTime,
        disconnectTime
      });
      setAuthorized(true);
    } catch (err) {
      console.error(err);
      setAuthorized(false);
      setDenyReason('Không thể kiểm tra thông tin điểm danh & ca làm việc.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAttendanceAndShift();
  }, [checkAttendanceAndShift]);

  useEffect(() => {
    if (!shiftInfo) return;

    const warnTime = shiftInfo.shiftEndTime.valueOf();
    const disconnectTime = shiftInfo.disconnectTime.valueOf();
    const now = Date.now();

    let warnTimer = null;
    let disconnectTimer = null;

    if (warnTime > now) {
      warnTimer = setTimeout(() => {
        message.warning({
          content: 'Ca làm việc của bạn đã hết giờ chuẩn. Bạn có 30 phút gia hạn trước khi hệ thống ngắt kết nối.',
          duration: 10,
        });
      }, warnTime - now);
    }

    if (disconnectTime > now) {
      disconnectTimer = setTimeout(() => {
        message.error('Ca làm việc đã quá 30 phút gia hạn. Đã ngắt kết nối phiên làm việc phục vụ.');
        navigate('/home');
      }, disconnectTime - now);
    } else {
      message.error('Ca làm việc đã quá 30 phút gia hạn. Đã ngắt kết nối phiên làm việc phục vụ.');
      navigate('/home');
    }

    return () => {
      if (warnTimer) clearTimeout(warnTimer);
      if (disconnectTimer) clearTimeout(disconnectTimer);
    };
  }, [shiftInfo, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Đang kiểm tra dữ liệu điểm danh..." />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
        <Result
          status="403"
          title="Chưa Thể Kết Nối Phiên Phục Vụ"
          subTitle={denyReason || "Bạn chưa thực hiện điểm danh ca làm việc hôm nay."}
          extra={[
            <Button type="primary" key="schedule" onClick={() => navigate('/work-schedule')}>
              Vào Lịch Làm Việc & Điểm Danh
            </Button>,
            <Button key="home" onClick={() => navigate('/home')}>
              Trang Chủ
            </Button>
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {shiftInfo && (
        <Alert
          message={
            <span>
              <strong> Phiên Phục Vụ Cá Nhân (Mobile)</strong> | Nhân viên: {user?.name} | Ca: {shiftInfo.name} ({shiftInfo.time}) | Ngắt kết nối lúc: {shiftInfo.disconnectTime.format('HH:mm')}
            </span>
          }
          type="info"
          showIcon
          banner
          style={{ marginBottom: 0 }}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '8px' }}
        items={[
          {
            key: 'tablemap',
            label: (
              <span>
                <TableOutlined />
                Sơ Đồ Bàn & Trạng Thái
              </span>
            ),
            children: (
              <div style={{ height: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                <TableMapPage isWaiterMode={true} />
              </div>
            )
          },
          {
            key: 'order',
            label: (
              <span>
                <ShoppingCartOutlined />
                Gọi Món Cho Khách (Order)
              </span>
            ),
            children: (
              <div style={{ height: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                <OrderPage isWaiterMode={true} />
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

export default WaiterMobileSessionPage;
