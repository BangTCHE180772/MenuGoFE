import { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { employeeLogin } from '../api/deviceApi';
import { useDevice } from '../context/DeviceContext';

const DeviceEmployeeLoginModal = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { deviceToken, loginEmployee } = useDevice();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const res = await employeeLogin({
        deviceToken,
        email: values.email,
        code: values.code
      });
      
      message.success(`Đăng nhập thành công: ${res.data.employee.name}`);
      loginEmployee(res.data.employee);
      
      form.resetFields();
      if (onSuccess) onSuccess(res.data.employee);
    } catch (error) {
      message.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Đăng Nhập Nhân Viên (Xác thực 2FA)"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      destroyOnClose
    >
      <div style={{ marginBottom: 20, color: '#666' }}>
        <p>Vui lòng nhập Email và mã 2FA từ ứng dụng Authenticator để bắt đầu phiên làm việc.</p>
        <p><em>Lưu ý: Bạn phải thuộc chi nhánh của thiết bị này.</em></p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item 
          name="email" 
          label="Email Nhân Viên"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' }
          ]}
        >
          <Input placeholder="nv1@menugo.com" />
        </Form.Item>

        <Form.Item 
          name="code" 
          label="Mã 2FA (Authenticator)"
          rules={[{ required: true, message: 'Vui lòng nhập mã 2FA' }]}
        >
          <Input.OTP length={6} />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={loading} style={{ marginTop: 10 }}>
          Xác nhận
        </Button>
      </Form>
    </Modal>
  );
};

export default DeviceEmployeeLoginModal;
