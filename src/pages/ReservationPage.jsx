import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, message, Tabs, Modal, Typography, DatePicker } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getReservations, checkInReservation, cancelReservation } from '../api/reservationApi';
import ReservationFormModal from '../components/reservation/ReservationFormModal';
import dayjs from 'dayjs';

const { Title } = Typography;

const ReservationPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedDate, setSelectedDate] = useState(dayjs());

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
  }, []);

  const handleCheckIn = async (id) => {
    Modal.confirm({
      title: 'Xác nhận khách đã đến',
      content: 'Hệ thống sẽ mở bàn và chuyển các món đặt trước xuống bếp. Bạn có chắc chắn không?',
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

  const filteredReservations = reservations.filter(r => {
    const isSameDate = dayjs(r.reservationTime).isSame(selectedDate, 'day');
    if (!isSameDate) return false;
    
    if (activeTab === 'All') return true;
    return r.status === activeTab;
  });

  const columns = [
    {
      title: 'Tên Khách Hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: 'gray' }}>{record.customerPhone}</div>
        </div>
      )
    },
    {
      title: 'Thời Gian',
      dataIndex: 'reservationTime',
      key: 'reservationTime',
      render: (text) => dayjs(text).format('HH:mm - DD/MM/YYYY')
    },
    {
      title: 'Số Người',
      dataIndex: 'numberOfGuests',
      key: 'numberOfGuests',
      align: 'center'
    },
    {
      title: 'Bàn Đã Xếp',
      key: 'tables',
      render: (_, record) => {
        if (!record.tableNames || record.tableNames.length === 0) return <Tag color="default">Chưa xếp</Tag>;
        return (
          <Space wrap>
            {record.tableNames.map(name => <Tag color="blue" key={name}>{name}</Tag>)}
          </Space>
        );
      }
    },
    {
      title: 'Món Đặt Trước',
      key: 'preOrder',
      render: (_, record) => {
        if (record.preOrderItemsCount > 0) return <Tag color="green">{record.preOrderItemsCount} món</Tag>;
        return <span style={{ color: '#aaa' }}>Không có</span>;
      }
    },
    {
      title: 'Ghi Chú',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = status;
        if (status === 'Pending') { color = 'warning'; text = 'Chờ đến'; }
        else if (status === 'Completed') { color = 'success'; text = 'Đã đến'; }
        else if (status === 'Cancelled') { color = 'error'; text = 'Đã hủy'; }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Hành Động',
      key: 'actions',
      render: (_, record) => {
        if (record.status !== 'Pending') return null;
        return (
          <Space>
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckIn(record.id)}
            >
              Check-in
            </Button>
            <Button 
              danger 
              size="small" 
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancel(record.id)}
            >
              Hủy
            </Button>
          </Space>
        );
      }
    }
  ];

  const items = [
    { key: 'All', label: 'Tất cả' },
    { key: 'Pending', label: 'Chờ đến' },
    { key: 'Completed', label: 'Đã đến' },
    { key: 'Cancelled', label: 'Đã hủy' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space size="large">
          <Title level={3} style={{ margin: 0 }}>Quản Lý Đặt Bàn</Title>
          <Space>
            <span style={{ fontWeight: 500 }}>Ngày:</span>
            <DatePicker 
              value={selectedDate} 
              onChange={(date) => setSelectedDate(date || dayjs())} 
              format="DD/MM/YYYY"
              allowClear={false}
            />
          </Space>
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

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={items}
        />
        <Table 
          columns={columns} 
          dataSource={filteredReservations} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <ReservationFormModal 
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchReservations();
        }}
      />
    </div>
  );
};

export default ReservationPage;
