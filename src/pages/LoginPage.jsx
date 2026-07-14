import { useState } from "react";
import { Form, Input, Button, Divider, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  DesktopOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../context/AuthContext";
import { useDevice } from "../context/DeviceContext";
import { login, setup2FA, confirmSetup2FA, verify2FA } from "../api/authApi";
import { Link } from "react-router-dom";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Login, 2: Setup 2FA, 3: Verify 2FA
  const [accountId, setAccountId] = useState(null);
  const [setupData, setSetupData] = useState(null); // { secretKey, qrCodeUrl }
  const [pin, setPin] = useState("");

  const { setAuth } = useAuth();
  const { isDeviceAuthorized } = useDevice();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const logoUrl = "/src/assets/logo.png";
  const backgroundlogoUrl = "/src/assets/background.png";

  const [loginMode, setLoginMode] = useState("Login");

  //================================================================================================================= HANDLE LOGIN
  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await login(values);
      const data = res.data;

      if (data.status === "setup_2fa_required") {
        setAccountId(data.accountId);
        // Call setup to get QR code immediately
        const setupRes = await setup2FA(data.accountId);
        setSetupData(setupRes.data);
        message.warning(data.message);
        setStep(2);
      } else if (data.status === "verify_2fa_required") {
        setAccountId(data.accountId);
        setStep(3);
      } else if (data.status === "success") {
        HandleLoginNavigate(data.user, data.token);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  //============================================================================================================== HANDLE 2FA SETUP
  const handleConfirmSetup = async () => {
    if (!pin || pin.length !== 6) {
      message.error("Vui lòng nhập đúng 6 số.");
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
      HandleLoginNavigate(data.user, data.token);
    } catch (err) {
      message.error(err.response?.data?.message || "Mã xác thực không đúng.");
    } finally {
      setLoading(false);
    }
  };

  //============================================================================================================ HANDLE 2FA VERIFY
  const handleVerify2FA = async () => {
    if (!pin || pin.length !== 6) {
      message.error("Vui lòng nhập đúng 6 số.");
      return;
    }
    setLoading(true);
    try {
      const res = await verify2FA({
        accountId,
        code: pin,
      });
      const data = res.data;
      HandleLoginNavigate(data.user, data.token);
    } catch (err) {
      message.error(err.response?.data?.message || "Mã xác thực không đúng.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================================================= HANDLE LOGIN NAVIGATE
  const HandleLoginNavigate = (user, token) => {
    if (loginMode.toLocaleLowerCase() === "pos".toLocaleLowerCase()) {
      if (!isDeviceAuthorized) {
        message.error("Thiết bị này chưa được cấp quyền.");
        return;
      }

      setAuth(token, user);
      message.success(` Chào mừng trở lại, ${user.name}! 👋`);
      navigate("/cashier");
    } else if (loginMode.toLocaleLowerCase() === "Login".toLocaleLowerCase()) {
      setAuth(token, user);
      message.success(` Chào mừng trở lại, ${user.name}! 👋`);
      navigate("/home");
    } else {
      message.error("Chế độ đăng nhập không hợp lệ.");
    }
  };

  return (
    <div className="login-page">
      {/*===================================================================================================== Background Image */}
      <div
        className="login-page-background"
        style={
          backgroundlogoUrl
            ? { backgroundImage: `url(${backgroundlogoUrl})` }
            : {}
        }
      />

      {/*=============================================================================================== Login card information */}
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon-name">
            <div className="login-logo-icon">
              {logoUrl && logoUrl.trim() !== "" ? (
                <img src={logoUrl} alt="Logo" />
              ) : (
                "🍜"
              )}
            </div>
            <h1 className="login-logo-name">MenuGo</h1>
          </div>
          <p className="login-logo-subtitle">Hệ thống quản lý nhà hàng</p>
        </div>

        {/*========================================================================================================== ĐĂNG NHẬP */}
        {step === 1 && (
          <Form
            form={form}
            onFinish={handleLogin}
            layout="vertical"
            className="login-form"
            autoComplete="on"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input
                prefix={<UserOutlined className="login-input-icon" />}
                placeholder="Email"
                size="large"
                className="login-input"
                autoComplete="username"
                prefix={<UserOutlined />}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="login-input-icon" />}
                placeholder="Mật khẩu"
                size="large"
                className="login-input"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                autoComplete="current-password"
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Button
              htmlType="submit"
              size="large"
              loading={
                loading && loginMode.toLowerCase() === "pos".toLowerCase()
              }
              block
              className="login-mode-working"
              onClick={() => setLoginMode("pos")}
            >
              {loading && loginMode.toLowerCase() === "pos".toLowerCase()
                ? "Bán hàng..."
                : "Bán hàng"}
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={
                loading && loginMode.toLowerCase() === "Login".toLowerCase()
              }
              block
              className="login-btn-primary"
              onClick={() => setLoginMode("Login")}
            >
              {loading && loginMode.toLowerCase() === "Login".toLowerCase()
                ? "Đang đăng nhập"
                : "Đăng nhập"}
            </Button>

            {/*============================================================================= Forgot Password and Register Links */}
            <div className="forgot-password-links-div">
              <Link to="/forgot-password" className="forgot-password-link">
                Quên mật khẩu?
              </Link>
            </div>
          </Form>
        )}

        {/*================================================================================================ SETUP 2FA (QR CODE) */}
        {step === 2 && setupData && (
          <div style={{ textAlign: "center" }}>
            <h3>Bắt buộc cài đặt 2FA</h3>
            <p>Vui lòng dùng Google Authenticator quét mã QR bên dưới.</p>
            <div
              style={{
                background: "#fff",
                padding: 16,
                display: "inline-block",
                borderRadius: 8,
              }}
            >
              <QRCodeSVG
                value={`otpauth://totp/MenuGo:${form.getFieldValue("email")}?secret=${setupData.manualEntryKey}&issuer=MenuGo`}
                size={150}
              />
            </div>
            <p style={{ marginTop: 10, fontSize: 12, color: "gray" }}>
              Khóa nhập tay: {setupData.manualEntryKey}
            </p>

            <Input
              placeholder="Nhập 6 số hiện trên ứng dụng"
              size="large"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ marginTop: 20, textAlign: "center", letterSpacing: 5 }}
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
            <Button
              type="link"
              onClick={() => setStep(1)}
              style={{ marginTop: 10 }}
            >
              Quay lại đăng nhập
            </Button>
          </div>
        )}

        {/*========================================================================================================= VERIFY 2FA */}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <h3>Xác thực 2 bước</h3>
            <p>Vui lòng nhập mã 6 số từ Google Authenticator của bạn.</p>

            <Input
              placeholder="Nhập 6 số"
              size="large"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ marginTop: 20, textAlign: "center", letterSpacing: 5 }}
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
            <Button
              type="link"
              onClick={() => setStep(1)}
              style={{ marginTop: 10 }}
            >
              Quay lại đăng nhập
            </Button>
          </div>
        )}

        {/*=============================================================================================== DEVICE AUTHORIZATION */}
        {step === 1 && isDeviceAuthorized && (
          <>
            <Divider className="login-divider">hoặc</Divider>
            <Button
              size="large"
              block
              icon={<DesktopOutlined />}
              className="login-btn-cashier"
              onClick={() => navigate("/cashier")}
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
