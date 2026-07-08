import { useState } from 'react';
import { Form, Input, Button, Divider, message, Spin } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  DesktopOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { login, setup2FA, confirmSetup2FA, verify2FA } from '../api/authApi';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Login, 2: Setup 2FA, 3: Verify 2FA
  const [accountId, setAccountId] = useState(null);
  const [setupData, setSetupData] = useState(null); // { secretKey, qrCodeUrl }
  const [pin, setPin] = useState('');

  const { setAuth } = useAuth();
  const { isDeviceAuthorized } = useDevice();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // ─── STEP 1: LOGIN ────────────────────────────────────────────────────────
  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await login(values);
      const data = res.data;

      if (data.status === 'setup_2fa_required') {
        setAccountId(data.accountId);
        // Call setup to get QR code immediately
        const setupRes = await setup2FA(data.accountId);
        setSetupData(setupRes.data);
        message.warning(data.message);
        setStep(2);
      } else if (data.status === 'verify_2fa_required') {
        setAccountId(data.accountId);
        setStep(3);
      } else if (data.status === 'success') {
        setAuth(data.token, data.user);
        message.success(`Chào mừng trở lại, ${data.user.name}! 👋`);
        navigate('/home');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 2: SETUP 2FA CONFIRM ───────────────────────────────────────────
  const handleConfirmSetup = async () => {
    if (!pin || pin.length !== 6) {
      message.error('Vui lòng nhập đúng 6 số.');
      return;
    }
    setLoading(true);
    try {
      const res = await confirmSetup2FA({
        accountId,
        secretKey: setupData.secretKey,
        code: pin,
      });
      const data = res.data;
      setAuth(data.token, data.user);
      message.success(`Cài đặt 2FA thành công! Chào mừng ${data.user.name}.`);
      navigate('/home');
    } catch (err) {
      message.error(err.response?.data?.message || 'Mã xác thực không đúng.');
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 3: VERIFY 2FA ──────────────────────────────────────────────────
  const handleVerify2FA = async () => {
    if (!pin || pin.length !== 6) {
      message.error('Vui lòng nhập đúng 6 số.');
      return;
    }
    setLoading(true);
    try {
      const res = await verify2FA({
        accountId,
        code: pin,
      });
      const data = res.data;
      setAuth(data.token, data.user);
      message.success(`Xác thực thành công! Chào mừng ${data.user.name}.`);
      navigate('/home');
    } catch (err) {
      message.error(err.response?.data?.message || 'Mã xác thực không đúng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb orb-1" />
      <div className="login-bg-orb orb-2" />
      <div className="login-bg-orb orb-3" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🍜</div>
          <h1 className="login-logo-name">MenuGo</h1>
          <p className="login-logo-subtitle">Hệ thống quản lý nhà hàng</p>
        </div>

        {/* ============================================================== */}
        {/* BƯỚC 1: ĐĂNG NHẬP */}
        {/* ============================================================== */}
        {step === 1 && (
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
              ]}
            >
              <Input.Password
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
        )}

        {/* ============================================================== */}
        {/* BƯỚC 2: SETUP 2FA (QR CODE) */}
        {/* ============================================================== */}
        {step === 2 && setupData && (
          <div style={{ textAlign: 'center' }}>
            <h3>Bắt buộc cài đặt 2FA</h3>
            <p>Vui lòng dùng Google Authenticator quét mã QR bên dưới.</p>
            <div style={{ background: '#fff', padding: 16, display: 'inline-block', borderRadius: 8 }}>
              <QRCodeSVG 
                value={`otpauth://totp/MenuGo:${form.getFieldValue('email')}?secret=${setupData.manualEntryKey}&issuer=MenuGo`} 
                size={150} 
              />
            </div>
            <p style={{ marginTop: 10, fontSize: 12, color: 'gray' }}>
              Khóa nhập tay: {setupData.manualEntryKey}
            </p>
            
            <Input
              placeholder="Nhập 6 số hiện trên ứng dụng"
              size="large"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ marginTop: 20, textAlign: 'center', letterSpacing: 5 }}
            />
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handleConfirmSetup}
              style={{ marginTop: 20 }}
            >
              Xác nhận & Hoàn tất
            </Button>
            <Button type="link" onClick={() => setStep(1)} style={{ marginTop: 10 }}>
              Quay lại đăng nhập
            </Button>
          </div>
        )}

        {/* ============================================================== */}
        {/* BƯỚC 3: VERIFY 2FA */}
        {/* ============================================================== */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <h3>Xác thực 2 bước</h3>
            <p>Vui lòng nhập mã 6 số từ Google Authenticator của bạn.</p>
            
            <Input
              placeholder="Nhập 6 số"
              size="large"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ marginTop: 20, textAlign: 'center', letterSpacing: 5 }}
            />
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handleVerify2FA}
              style={{ marginTop: 20 }}
            >
              Xác thực
            </Button>
            <Button type="link" onClick={() => setStep(1)} style={{ marginTop: 10 }}>
              Quay lại đăng nhập
            </Button>
          </div>
        )}

        {/* ============================================================== */}
        {step === 1 && isDeviceAuthorized && (
          <>
            <Divider className="login-divider">hoặc</Divider>
            <Button
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
