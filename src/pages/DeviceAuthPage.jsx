import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, message, Result } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const DeviceAuthPage = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      message.warning('Bạn cần đăng nhập trên điện thoại trước khi quét mã.');
      navigate('/login', { state: { from: `/device-auth/${challengeId}` } });
    }
  }, [user, token, navigate, challengeId]);

  const handleScan = async () => {
    try {
      setLoading(true);
      await axiosInstance.post(
        '/api/Device/auth/scan',
        { challengeId }
      );
      setSuccess(true);
    } catch (e) {
      message.error(e.response?.data?.message || 'Không thể đăng nhập thiết bị. Mã QR có thể đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 20, textAlign: 'center', maxWidth: 400, margin: '50px auto' }}>
        <Result
          status="success"
          title="Đã gửi yêu cầu!"
          subTitle="Vui lòng nhập mã 2FA trên màn hình thiết bị quán để hoàn tất đăng nhập."
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/')}>
              Về Trang Chủ
            </Button>
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 20, textAlign: 'center', maxWidth: 400, margin: '50px auto' }}>
      <ScanOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 20 }} />
      <h2>Đăng Nhập Thiết Bị</h2>
      <p style={{ color: '#666', marginBottom: 30 }}>
        Bạn đang yêu cầu đăng nhập tài khoản <strong>{user?.email}</strong> vào thiết bị quán.
      </p>
      <Button 
        type="primary" 
        size="large" 
        block 
        onClick={handleScan} 
        loading={loading}
      >
        Xác Nhận Đăng Nhập
      </Button>
    </div>
  );
};

export default DeviceAuthPage;
