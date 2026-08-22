import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { PhoneOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { loginCustomer } from '../../api/customerPortalApi';

const { Title, Text, Link } = Typography;

const CustomerLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useCustomerAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await loginCustomer({
        phone: values.phone,
        password: values.password,
      });
      if (res.data && res.data.token) {
        setAuth(res.data.token, res.data.customer);
        message.success('Đăng nhập thành công!');
        navigate('/customer/dashboard');
      } else {
        message.error('Thông tin đăng nhập không hợp lệ');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Số điện thoại hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fca5a5 100%)',
        padding: '24px',
        fontFamily: "'Be Vietnam Pro', sans-serif"
      }}
    >
      <div style={{ position: 'absolute', top: 24, left: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/welcome')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
        >
          Quay lại trang chủ
        </Button>
      </div>

      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}
        bodyStyle={{ padding: '36px 28px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/favicon.ico"
            alt="MenuGo"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: 64, height: 64, marginBottom: 12, borderRadius: 12 }}
          />
          <Title level={2} style={{ margin: '0 0 8px 0', color: '#1e293b', fontWeight: 700 }}>
            Đăng Nhập Khách Hàng
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Chào mừng bạn đến với Cổng khách hàng thân thiết MenuGo
          </Text>
        </div>

        <Form name="customer_login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Số điện thoại"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Mật khẩu"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                borderColor: '#ea580c',
                height: 48,
                borderRadius: 8,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)'
              }}
            >
              Đăng Nhập
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Chưa có tài khoản?{' '}
            <Link onClick={() => navigate('/customer/register')} style={{ color: '#ea580c', fontWeight: 600 }}>
              Đăng ký ngay
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default CustomerLoginPage;
