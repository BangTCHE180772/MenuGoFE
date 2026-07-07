import { useState } from 'react';
import { Form, Input, Button, Divider, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  DesktopOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isDeviceAuthorized } = useDevice();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const userData = await login(values);
      message.success(`Chào mừng trở lại, ${userData.name}! 👋`);
      navigate('/home');
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-bg-orb orb-1" />
      <div className="login-bg-orb orb-2" />
      <div className="login-bg-orb orb-3" />

      {/* Login Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">🍜</div>
          <h1 className="login-logo-name">MenuGo</h1>
          <p className="login-logo-subtitle">Hệ thống quản lý nhà hàng</p>
        </div>

        {/* Form đăng nhập */}
        <Form
          form={form}
          onFinish={handleLogin}
          layout="vertical"
          className="login-form"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              id="login-email"
              prefix={<UserOutlined className="login-input-icon" />}
              placeholder="Email"
              size="large"
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password
              id="login-password"
              prefix={<LockOutlined className="login-input-icon" />}
              placeholder="Mật khẩu"
              size="large"
              className="login-input"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Button
            id="login-submit"
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
            className="login-btn-primary"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </Form>

        {/* Nút mở thu ngân - chỉ hiện nếu thiết bị đã được cấp quyền */}
        {isDeviceAuthorized && (
          <>
            <Divider className="login-divider">hoặc</Divider>
            <Button
              id="open-cashier"
              size="large"
              block
              icon={<DesktopOutlined />}
              className="login-btn-cashier"
              onClick={() => navigate('/cashier')}
            >
              Mở Thu Ngân / Điểm Danh
            </Button>
            <p className="login-device-note">
              Thiết bị này đã được cấp quyền mở màn thu ngân
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
