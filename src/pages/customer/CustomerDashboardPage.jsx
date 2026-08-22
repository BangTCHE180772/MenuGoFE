import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Row, Col, Statistic, Space, Modal, Typography, message } from 'antd';
import { CalendarOutlined, MessageOutlined, LogoutOutlined, HomeOutlined, ShoppingOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { getCustomerReservations } from '../../api/customerPortalApi';
import axiosInstance from '../../api/axiosInstance';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const CustomerDashboardPage = () => {
  const { customer, logout } = useCustomerAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await getCustomerReservations();
      setReservations(res.data);
    } catch (error) {
      message.error('Không thể tải lịch sử đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancelReservation = (id) => {
    Modal.confirm({
      title: 'Hủy lịch đặt bàn',
      content: 'Bạn có chắc chắn muốn hủy yêu cầu đặt bàn này không?',
      okText: 'Hủy lịch',
      cancelText: 'Quay lại',
      okType: 'danger',
      onOk: async () => {
        try {
          await axiosInstance.put(`/api/CustomerPortal/reservations/${id}/cancel`);
          message.success('Đã hủy lịch đặt bàn thành công!');
          fetchReservations();
        } catch (error) {
          message.error(error.response?.data?.message || 'Không thể hủy lịch đặt bàn.');
        }
      }
    });
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'Pending':
        return <Tag color="warning">Chờ xác nhận</Tag>;
      case 'Confirmed':
        return <Tag color="processing">Đã xác nhận</Tag>;
      case 'Completed':
        return <Tag color="success">Đã đến</Tag>;
      case 'Cancelled':
        return <Tag color="default">Đã hủy</Tag>;
      case 'Rejected':
        return <Tag color="error">Bị từ chối</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'branchId',
      key: 'branchId',
      render: (branchId, record) => {
        // If branch details are not fully populated in DTO, we can show branch name or Id
        return record.branchName || `Chi nhánh #${branchId}`;
      }
    },
    {
      title: 'Thời gian',
      dataIndex: 'reservationTime',
      key: 'reservationTime',
      render: (time) => dayjs(time).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => new Date(a.reservationTime) - new Date(b.reservationTime)
    },
    {
      title: 'Số khách',
      dataIndex: 'numberOfGuests',
      key: 'numberOfGuests',
      width: 100,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => {
        const canCancel = record.status === 'Pending' || record.status === 'Confirmed';
        return canCancel ? (
          <Button
            type="link"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleCancelReservation(record.id)}
          >
            Hủy lịch
          </Button>
        ) : null;
      }
    }
  ];

  const handleLogout = () => {
    logout();
    message.success('Đã đăng xuất tài khoản.');
    navigate('/welcome');
  };

  return (
    <div
      style={{
        background: '#f8fafc',
        minHeight: '100vh',
        padding: '24px',
        fontFamily: "'Be Vietnam Pro', sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          padding: '24px'
        }}
      >
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 32, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
          <Col>
            <Space align="center" size="middle">
              <Title level={3} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                Cổng Khách Hàng MenuGo
              </Title>
              <Button type="link" icon={<HomeOutlined />} onClick={() => navigate('/welcome')} style={{ color: '#ea580c', fontWeight: 600 }}>
                Về Trang Chủ
              </Button>
            </Space>
          </Col>
          <Col>
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ fontWeight: 600 }}
            >
              Đăng xuất
            </Button>
          </Col>
        </Row>

        {/* Dashboard Grid */}
        <Row g={24} gutter={[24, 24]}>
          {/* Left profile info */}
          <Col xs={24} md={8}>
            <Card
              style={{
                borderRadius: 12,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 15px rgba(15, 23, 42, 0.15)'
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Title level={4} style={{ color: '#fff', margin: '0 0 16px 0', fontWeight: 600 }}>
                Xin chào, {customer?.name}!
              </Title>
              <div style={{ marginBottom: 24, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '16px 20px' }}>
                <Statistic
                  title={<span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>ĐIỂM TÍCH LŨY</span>}
                  value={customer?.point || 0}
                  valueStyle={{ color: '#f97316', fontWeight: 800, fontSize: 32 }}
                  suffix={<span style={{ fontSize: 16, color: '#f97316', fontWeight: 600 }}> điểm</span>}
                />
              </div>

              <Space direction="vertical" size="small" style={{ width: '100%', fontSize: 13, color: '#cbd5e1' }}>
                <div><strong>Số điện thoại:</strong> {customer?.phone}</div>
                {customer?.email && <div><strong>Email:</strong> {customer?.email}</div>}
                <div><strong>Thành viên từ:</strong> {dayjs(customer?.createdAt).format('DD/MM/YYYY')}</div>
              </Space>
            </Card>

            <Card style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <Title level={5} style={{ margin: '0 0 16px 0', color: '#334155' }}>
                Thao tác nhanh
              </Title>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={() => navigate('/customer/booking')}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 8,
                    fontWeight: 600,
                    background: '#ea580c',
                    borderColor: '#ea580c'
                  }}
                >
                  Đặt bàn trực tuyến
                </Button>
                <Button
                  type="default"
                  icon={<MessageOutlined />}
                  onClick={() => navigate('/customer/chat')}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 8,
                    fontWeight: 600,
                    color: '#ea580c',
                    borderColor: '#ea580c'
                  }}
                >
                  Nhắn tin với Chi nhánh
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Right reservation list */}
          <Col xs={24} md={16}>
            <Card
              title={<span style={{ fontWeight: 700, color: '#1e293b' }}>Lịch Sử Đặt Bàn</span>}
              style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              bodyStyle={{ padding: 12 }}
            >
              <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                <Table
                  columns={columns}
                  dataSource={reservations}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: 'Bạn chưa có yêu cầu đặt bàn nào.' }}
                  size="middle"
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
