import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Space, message, Tabs, Modal, Typography, DatePicker, Radio, Calendar, Badge, Row, Col, Empty } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, AppstoreOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import { getReservations, checkInReservation, cancelReservation } from '../api/reservationApi';
import ReservationFormModal from '../components/reservation/ReservationFormModal';
import ReservationEditModal from '../components/reservation/ReservationEditModal';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ReservationPage = ({ isPosHub }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);

  const [viewMode, setViewMode] = useState('cards');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [activeTab, setActiveTab] = useState('All');

  const [now, setNow] = useState(dayjs());

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (error) {
      message.error('Không thể tải danh sách đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();

    const interval = setInterval(() => setNow(dayjs()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (id) => {
    Modal.confirm({
      title: 'Xác nhận khách đã đến',
      content: 'Hệ thống sẽ mở bàn và chuyển trạng thái bàn sang "Đang phục vụ". Bạn có chắc chắn không?',
      onOk: async () => {
        try {
          await checkInReservation(id);
          message.success('Khách đã đến. Các bàn đã được mở!');
          fetchReservations();
        } catch (error) {
          message.error(error.response?.data?.message || 'Check-in thất bại');
        }
      }
    });
  };

  const handleCancel = async (id) => {
    Modal.confirm({
      title: 'Xác nhận hủy lịch',
      content: 'Lịch đặt bàn này sẽ bị hủy và bàn sẽ được giải phóng. Bạn có chắc chắn không?',
      okType: 'danger',
      onOk: async () => {
        try {
          await cancelReservation(id);
          message.success('Đã hủy lịch đặt bàn thành công!');
          fetchReservations();
        } catch (error) {
          message.error(error.response?.data?.message || 'Hủy thất bại');
        }
      }
    });
  };

  const dateCellRender = (value) => {
    const dailyData = reservations.filter(r => dayjs(r.reservationTime).isSame(value, 'day'));
    if (dailyData.length === 0) return null;

    const pendingCount = dailyData.filter(r => r.status === 'Pending').length;
    const completedCount = dailyData.filter(r => r.status === 'Completed').length;
    const totalGuests = dailyData.reduce((sum, r) => sum + r.numberOfGuests, 0);

    return (
      <div className="calendar-cell-events" style={{ fontSize: '12px' }}>
        <div style={{ color: '#1890ff', fontWeight: 'bold' }}>{dailyData.length} Đơn ({totalGuests} khách)</div>
        {pendingCount > 0 && <div><Badge status="warning" text={`${pendingCount} Chờ`} /></div>}
        {completedCount > 0 && <div><Badge status="success" text={`${completedCount} Đã đến`} /></div>}
      </div>
    );
  };

  const filteredReservations = reservations.filter(r => {
    const isSameDate = dayjs(r.reservationTime).isSame(selectedDate, 'day');
    if (!isSameDate) return false;
    if (activeTab === 'All') return true;
    return r.status === activeTab;
  }).sort((a, b) => dayjs(a.reservationTime).diff(dayjs(b.reservationTime)));

  const renderReservationCard = (r) => {
    const rTime = dayjs(r.reservationTime);
    const diffMinutes = rTime.diff(now, 'minute');
    const isPending = r.status === 'Pending';

    const canCheckIn = isPending && diffMinutes <= 30;

    const isLate = isPending && diffMinutes < 0;

    const isWarning = isPending && diffMinutes >= 0 && diffMinutes <= 30;

    let cardBorderColor = '#e8e8e8';
    let cardBg = '#fff';

    if (isWarning) {
      cardBorderColor = '#faad14';
      cardBg = '#fffbe6';
    } else if (isLate) {
      cardBorderColor = '#ff4d4f';
      cardBg = '#fff1f0';
    } else if (r.status === 'Completed') {
      cardBorderColor = '#52c41a';
      cardBg = '#f6ffed';
    }

    const getStatusTag = () => {
      if (r.status === 'Pending') return <Tag color="warning">Chờ đến</Tag>;
      if (r.status === 'Completed') return <Tag color="success">Đã đến</Tag>;
      if (r.status === 'Cancelled') return <Tag color="error">Đã hủy</Tag>;
      return null;
    };

    return (
      <Col xs={24} sm={12} md={12} lg={8} xl={6} key={r.id}>
        <Card
          hoverable
          style={{ borderColor: cardBorderColor, backgroundColor: cardBg, height: '100%' }}
          headStyle={{ borderBottom: `1px solid ${cardBorderColor}`, backgroundColor: 'transparent' }}
          title={
            <Space>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{rTime.format('HH:mm')}</span>
              {getStatusTag()}
            </Space>
          }
          extra={
            isPending && (
              <Space>
                <Button type="text" style={{ color: '#1890ff' }} size="small" onClick={() => {
                  setEditingReservation(r);
                  setIsEditModalVisible(true);
                }} title="Sửa thông tin">
                  <EditOutlined />
                </Button>
                <Button type="text" danger size="small" onClick={() => handleCancel(r.id)} title="Hủy lịch">
                  <CloseCircleOutlined />
                </Button>
              </Space>
            )
          }
        >
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>{r.customerName}</div>
            <div style={{ color: '#595959' }}>📞 {r.customerPhone}</div>
          </div>

          <Row style={{ marginBottom: '8px' }}>
            <Col span={12}><Text type="secondary">Số lượng:</Text> <br /> <b>{r.numberOfGuests} người</b></Col>
            <Col span={12}><Text type="secondary">Bàn xếp:</Text> <br /> <b>{r.tableNames?.join(', ') || 'Chưa xếp'}</b></Col>
          </Row>

          <div style={{ marginBottom: '16px', minHeight: '22px' }}>
            <Text type="secondary">Ghi chú:</Text> {r.note || <Text type="secondary" italic>Không có</Text>}
          </div>

          {/* Hành động thông minh */}
          {isPending && (
            canCheckIn ? (
              <Button type="primary" block size="large" onClick={() => handleCheckIn(r.id)}>
                Khách đã đến (Check-in)
              </Button>
            ) : (
              <Button block size="large" disabled>
                Chưa đến giờ (còn {diffMinutes} phút)
              </Button>
            )
          )}
        </Card>
      </Col>
    );
  };

  const tabs = [
    { key: 'All', label: `Tất cả (${reservations.filter(r => dayjs(r.reservationTime).isSame(selectedDate, 'day')).length})` },
    { key: 'Pending', label: 'Chờ đến' },
    { key: 'Completed', label: 'Đã đến' },
    { key: 'Cancelled', label: 'Đã hủy' }
  ];

  return (
    <div style={{ padding: isPosHub ? '16px 0' : '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space size="large">
          {!isPosHub && <Title level={3} style={{ margin: 0 }}>Quản Lý Đặt Bàn</Title>}

          <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} buttonStyle="solid">
            <Radio.Button value="cards"><AppstoreOutlined /> Theo Ngày</Radio.Button>
            <Radio.Button value="calendar"><CalendarOutlined /> Lịch Tháng</Radio.Button>
          </Radio.Group>

          {viewMode === 'cards' && (
            <Space>
              <Text strong>Ngày xem:</Text>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date || dayjs())}
                format="DD/MM/YYYY"
                allowClear={false}
              />
            </Space>
          )}
        </Space>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsModalVisible(true)}
        >
          Thêm Đặt Bàn
        </Button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f0f2f5', padding: '16px', borderRadius: '8px' }}>
        {viewMode === 'calendar' ? (
          <Card bodyStyle={{ padding: 0 }}>
            <Calendar
              value={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setViewMode('cards');
              }}
              cellRender={(date, info) => {
                if (info.type === 'date') return dateCellRender(date);
                return info.originNode;
              }}
            />
          </Card>
        ) : (
          <>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} style={{ marginBottom: 16 }} />
            {filteredReservations.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '40px 0' }}>
                <Empty description={`Không có đặt bàn nào vào ngày ${selectedDate.format('DD/MM/YYYY')} (${activeTab})`} />
              </Card>
            ) : (
              <Row gutter={[16, 16]}>
                {filteredReservations.map(r => renderReservationCard(r))}
              </Row>
            )}
          </>
        )}
      </div>

      <ReservationFormModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchReservations();
        }}
      />

      <ReservationEditModal
        visible={isEditModalVisible}
        reservation={editingReservation}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingReservation(null);
        }}
        onSuccess={() => {
          setIsEditModalVisible(false);
          setEditingReservation(null);
          fetchReservations();
        }}
      />
    </div>
  );
};

export default ReservationPage;
