import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Input, Select, Button, message, Tag, Tabs, List, Card, Spin, Row, Col } from 'antd';
import { MessageOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { createShiftFeedback, getMyShiftFeedbacks } from '../../api/shiftFeedbackApi';

dayjs.extend(isoWeek);

const formatOtStatus = (status) => {
  switch (status) {
    case 'Approved':
      return 'Đã duyệt';
    case 'Pending':
      return 'Chờ duyệt';
    case 'Rejected':
      return 'Từ chối';
    case 'None':
    default:
      return 'Không có';
  }
};

const getDayName = (dateStr) => {
  const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const d = dayjs(dateStr).day();
  return days[d] || '';
};

const ShiftFeedbackModal = ({ open, onClose, schedule, allSchedules = [], shifts = [], branches = [], onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [selectedWeekKey, setSelectedWeekKey] = useState(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  const fetchMyFeedbacks = async () => {
    setHistoryLoading(true);
    try {
      const res = await getMyShiftFeedbacks();
      setMyFeedbacks(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải lịch sử phản hồi!');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 1. Group unique weeks from allSchedules
  const weekOptions = useMemo(() => {
    if (!allSchedules || allSchedules.length === 0) return [];
    const weekMap = new Map();
    const currentWeekStart = dayjs().startOf('isoWeek');

    allSchedules.forEach((item) => {
      const d = dayjs(item.workDate);
      const startOfWeek = d.startOf('isoWeek');
      const endOfWeek = d.endOf('isoWeek');
      const weekKey = startOfWeek.format('YYYY-MM-DD');

      if (!weekMap.has(weekKey)) {
        const isCurrentWeek = currentWeekStart.isSame(startOfWeek, 'day');
        const label = `Tuần ${startOfWeek.format('DD/MM')} - ${endOfWeek.format('DD/MM/YYYY')}${isCurrentWeek ? ' (Tuần này)' : ''}`;
        weekMap.set(weekKey, {
          value: weekKey,
          label,
          start: startOfWeek,
        });
      }
    });

    return Array.from(weekMap.values()).sort((a, b) => b.start.diff(a.start));
  }, [allSchedules]);

  // 2. Filter schedules for the selected week
  const schedulesInSelectedWeek = useMemo(() => {
    if (!selectedWeekKey) return allSchedules;
    const start = dayjs(selectedWeekKey);
    const end = start.endOf('isoWeek');
    return allSchedules
      .filter((s) => {
        const d = dayjs(s.workDate);
        return d.isAfter(start.subtract(1, 'second')) && d.isBefore(end.add(1, 'second'));
      })
      .sort((a, b) => new Date(b.workDate) - new Date(a.workDate));
  }, [allSchedules, selectedWeekKey]);

  // 3. Active schedule details
  const activeSchedule = useMemo(() => {
    if (selectedScheduleId) {
      const found = allSchedules.find((s) => s.id === selectedScheduleId);
      if (found) return found;
    }
    if (schedulesInSelectedWeek.length > 0) return schedulesInSelectedWeek[0];
    if (schedule) return schedule;
    return allSchedules.length > 0 ? allSchedules[0] : null;
  }, [selectedScheduleId, schedule, allSchedules, schedulesInSelectedWeek]);

  const activeShiftInfo = useMemo(() => {
    if (!activeSchedule) return null;
    const shift = shifts.find((s) => s.id === activeSchedule.shiftId);
    if (!shift) return { name: `Ca #${activeSchedule.shiftId}`, time: '' };
    return {
      name: shift.name,
      time: `${shift.startTime ? shift.startTime.substring(0, 5) : ''} - ${shift.endTime ? shift.endTime.substring(0, 5) : ''}`,
    };
  }, [activeSchedule, shifts]);

  const activeBranchName = useMemo(() => {
    if (!activeSchedule) return '';
    const b = branches.find((br) => br.id === activeSchedule.branchId);
    return b ? b.name : `Chi nhánh #${activeSchedule.branchId}`;
  }, [activeSchedule, branches]);

  // Initialize week & schedule selection when modal opens or schedule prop changes
  useEffect(() => {
    if (open) {
      const targetSchedule = schedule || (allSchedules.length > 0 ? allSchedules[0] : null);
      const targetDate = targetSchedule ? dayjs(targetSchedule.workDate) : dayjs();
      const weekKey = targetDate.startOf('isoWeek').format('YYYY-MM-DD');

      setSelectedWeekKey(weekKey);
      const initialId = targetSchedule?.id || null;
      setSelectedScheduleId(initialId);

      form.resetFields();
      form.setFieldsValue({
        weekKey: weekKey,
        workScheduleId: initialId,
        feedbackType: 'OTDispute',
        title: 'Khiếu nại về OT ca làm',
      });
      fetchMyFeedbacks();
    }
  }, [open, schedule, allSchedules, form]);

  // When week selection changes, auto-pick first shift in that week
  const handleWeekChange = (newWeekKey) => {
    setSelectedWeekKey(newWeekKey);
    const start = dayjs(newWeekKey);
    const end = start.endOf('isoWeek');
    const shiftsInWeek = allSchedules.filter((s) => {
      const d = dayjs(s.workDate);
      return d.isAfter(start.subtract(1, 'second')) && d.isBefore(end.add(1, 'second'));
    });

    const firstId = shiftsInWeek.length > 0 ? shiftsInWeek[0].id : null;
    setSelectedScheduleId(firstId);
    form.setFieldsValue({ workScheduleId: firstId });
  };

  const handleSubmit = async (values) => {
    const targetScheduleId = values.workScheduleId || activeSchedule?.id;
    if (!targetScheduleId) {
      message.warning('Vui lòng chọn ca làm việc cần phản hồi!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        workScheduleId: targetScheduleId,
        feedbackType: values.feedbackType,
        title: values.title,
        content: values.content,
      };
      await createShiftFeedback(payload);
      message.success('🟢 Đã gửi phản hồi thành công! Chờ quản lý kiểm tra và trả lời.');
      form.resetFields();
      fetchMyFeedbacks();
      setActiveTab('history');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Không thể gửi phản hồi ca làm!';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'RESOLVED':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã xử lý</Tag>;
      case 'REJECTED':
        return <Tag icon={<CloseCircleOutlined />} color="error">Từ chối</Tag>;
      case 'PENDING':
      default:
        return <Tag icon={<SyncOutlined spin />} color="processing">Chờ quản lý duyệt</Tag>;
    }
  };

  // Format options for the filtered schedules dropdown
  const scheduleSelectOptions = useMemo(() => {
    return schedulesInSelectedWeek.map((item) => {
      const shift = shifts.find((s) => s.id === item.shiftId);
      const shiftName = shift?.name || `Ca #${item.shiftId}`;
      const timeStr = shift?.startTime && shift?.endTime
        ? `${shift.startTime.substring(0, 5)} - ${shift.endTime.substring(0, 5)}`
        : '';
      const dateStr = dayjs(item.workDate).format('DD/MM/YYYY');
      const dayName = getDayName(item.workDate);
      const branchName = branches.find((b) => b.id === item.branchId)?.name || '';

      const searchStr = `${dateStr} ${dayName} ${shiftName} ${timeStr} ${branchName}`.toLowerCase();

      return {
        value: item.id,
        searchValue: searchStr,
        label: (
          <div style={{ padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>
                📅 {dayName}, {dateStr}
              </span>
              {item.approvedOTHours > 0 ? (
                <Tag color="orange" style={{ margin: 0, fontSize: '11px', padding: '0 6px' }}>
                  OT: {item.approvedOTHours}h
                </Tag>
              ) : (
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.status || ''}</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '8px' }}>
              <span>🕒 <strong>{shiftName}</strong> ({timeStr})</span>
              {branchName && <span>• 📍 {branchName}</span>}
            </div>
          </div>
        ),
      };
    });
  }, [schedulesInSelectedWeek, shifts, branches]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f97316', fontSize: '18px' }}>
          <MessageOutlined />
          <span>PHẢN HỒI / KHIẾU NẠI CA LÀM VIỆC</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={580}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'create',
            label: 'Gửi phản hồi mới',
            children: (
              <div>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                  <Row gutter={12}>
                    <Col span={11}>
                      {/* Step 1: Select Week */}
                      <Form.Item
                        name="weekKey"
                        label={
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>
                            <CalendarOutlined style={{ color: '#ea580c', marginRight: 4 }} />
                            1. Chọn tuần:
                          </span>
                        }
                        rules={[{ required: true, message: 'Chọn tuần!' }]}
                      >
                        <Select
                          options={weekOptions}
                          onChange={handleWeekChange}
                          placeholder="Chọn tuần..."
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={13}>
                      {/* Step 2: Select Shift in Week */}
                      <Form.Item
                        name="workScheduleId"
                        label={
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>
                            <ClockCircleOutlined style={{ color: '#ea580c', marginRight: 4 }} />
                            2. Chọn ca làm việc trong tuần:
                          </span>
                        }
                        rules={[{ required: true, message: 'Chọn ca làm việc!' }]}
                      >
                        <Select
                          showSearch
                          filterOption={(input, option) =>
                            (option?.searchValue || '').includes(input.toLowerCase())
                          }
                          placeholder={schedulesInSelectedWeek.length === 0 ? 'Không có ca trong tuần này' : 'Chọn ca...'}
                          options={scheduleSelectOptions}
                          onChange={(val) => setSelectedScheduleId(val)}
                          notFoundContent="Không tìm thấy ca làm việc nào trong tuần này"
                          style={{ width: '100%' }}
                          popupMatchSelectWidth={false}
                          dropdownStyle={{ minWidth: '420px', maxWidth: '560px', padding: '6px' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {activeSchedule && (
                    <div
                      style={{
                        background: '#fff7ed',
                        border: '1px solid #ffedd5',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#475569',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#ea580c', marginBottom: '6px', fontSize: '14px' }}>
                        Thông tin ca làm việc được chọn:
                      </div>
                      <div><strong>Chi nhánh:</strong> {activeBranchName}</div>
                      <div><strong>Ca:</strong> {activeShiftInfo?.name} ({activeShiftInfo?.time})</div>
                      <div><strong>Ngày:</strong> {dayjs(activeSchedule.workDate).format('DD/MM/YYYY')} ({getDayName(activeSchedule.workDate)})</div>
                      <div>
                        <strong>Giờ thực tế:</strong>{' '}
                        {activeSchedule.actualHours !== null && activeSchedule.actualHours !== undefined
                          ? `${activeSchedule.actualHours} giờ`
                          : 'Chưa tính'}
                      </div>
                      <div>
                        <strong>OT hiện tại:</strong>{' '}
                        <Tag color={activeSchedule.approvedOTHours > 0 ? 'orange' : 'default'}>
                          {activeSchedule.approvedOTHours || 0} giờ ({formatOtStatus(activeSchedule.otStatus)})
                        </Tag>
                      </div>
                    </div>
                  )}

                  <Form.Item
                    name="feedbackType"
                    label={<span style={{ fontWeight: '600' }}>Loại phản hồi:</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn loại phản hồi!' }]}
                  >
                    <Select
                      options={[
                        { value: 'OTDispute', label: 'Quản lý duyệt sai OT / Thiếu OT' },
                        { value: 'HoursDispute', label: 'Sai tổng giờ công' },
                        { value: 'AttendanceDispute', label: 'Nhầm lẫn điểm danh vào/ra' },
                        { value: 'Other', label: 'Ý kiến / Khác' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    name="title"
                    label={<span style={{ fontWeight: '600' }}>Tiêu đề:</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề phản hồi!' }]}
                  >
                    <Input placeholder="Ví dụ: Quản lý duyệt thiếu 1 tiếng OT" />
                  </Form.Item>

                  <Form.Item
                    name="content"
                    label={<span style={{ fontWeight: '600' }}>Nội dung chi tiết:</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập nội dung chi tiết!' }]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="Mô tả cụ thể vấn đề (ví dụ: Ca tối qua em làm tăng ca từ 18h đến 20h20, nhờ Quản lý duyệt lại 2 tiếng OT giúp em)..."
                    />
                  </Form.Item>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                    <Button onClick={onClose}>Hủy</Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      style={{ background: '#ea580c', borderColor: '#ea580c', fontWeight: 'bold' }}
                    >
                      Gửi phản hồi cho Quản lý
                    </Button>
                  </div>
                </Form>
              </div>
            ),
          },
          {
            key: 'history',
            label: `Lịch sử phản hồi (${myFeedbacks.length})`,
            children: (
              <Spin spinning={historyLoading}>
                <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {myFeedbacks.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>
                      Bạn chưa gửi phản hồi nào.
                    </div>
                  ) : (
                    <List
                      dataSource={myFeedbacks}
                      renderItem={(item) => (
                        <Card
                          key={item.id}
                          size="small"
                          style={{ marginBottom: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '14px' }}>{item.title}</strong>
                            {getStatusTag(item.status)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                            📅 Ng: {dayjs(item.workDate).format('DD/MM/YYYY')} ({getDayName(item.workDate)}) | Ca: {item.shiftName} | Gửi lúc: {dayjs(item.createdAt).format('HH:mm DD/MM')}
                          </div>
                          <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', color: '#334155' }}>
                            <strong>Nội dung:</strong> {item.content}
                          </div>

                          {item.responseMessage && (
                            <div style={{ marginTop: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', color: '#166534' }}>
                              <strong>💬 Quản lý ({item.resolverName || 'Manager'}) phản hồi:</strong>
                              <div style={{ marginTop: '2px' }}>{item.responseMessage}</div>
                              {item.resolvedAt && (
                                <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px', textAlign: 'right' }}>
                                  Xử lý lúc: {dayjs(item.resolvedAt).format('HH:mm DD/MM/YYYY')}
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      )}
                    />
                  )}
                </div>
              </Spin>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default ShiftFeedbackModal;
