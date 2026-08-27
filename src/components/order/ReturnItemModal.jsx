import React, { useState, useRef } from 'react';
import { Modal, InputNumber, Input, Form, message, Checkbox } from 'antd';
import axiosInstance from '../../api/axiosInstance';

const ReturnItemModal = ({ visible, item, onCancel, onSuccess, isCustomerMode = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const actionRef = useRef(false);

  if (!item) return null;

  const maxReturnable = item.quantity - (item.returnedQuantity || 0);

  const handleOk = async () => {
    if (actionRef.current) return;
    actionRef.current = true;
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        orderDetailId: item.orderDetailId,
        returnQuantity: values.returnQuantity,
        returnReason: values.returnReason,
        isIntact: values.isIntact || false,
      };

      if (isCustomerMode) {
        await axiosInstance.post(`/api/Order/details/${item.orderDetailId}/customer-request-return`, payload);
      } else {
        await axiosInstance.put(`/api/Order/details/${item.orderDetailId}/request-return`, payload);
      }

      message.success('Đã gửi yêu cầu trả món thành công!');
      form.resetFields();
      onSuccess();
    } catch (error) {
      if (error.errorFields) return; // validation error
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu trả món!');
    } finally {
      setLoading(false);
      actionRef.current = false;
    }
  };

  return (
    <Modal
      title={`Trả món: ${item.productName}`}
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      okText="Xác nhận trả"
      cancelText="Hủy"
    >
      <div style={{ marginBottom: 16 }}>
        <p><strong>Số lượng đã gọi:</strong> {item.quantity}</p>
        <p><strong>Số lượng có thể trả:</strong> {maxReturnable}</p>
      </div>

      <Form form={form} layout="vertical" initialValues={{ returnQuantity: 1, isIntact: true }}>
        <Form.Item
          name="returnQuantity"
          label="Số lượng trả"
          rules={[
            { required: true, message: 'Vui lòng nhập số lượng trả!' },
            { type: 'number', min: 1, max: maxReturnable, message: `Số lượng trả phải từ 1 đến ${maxReturnable}!` }
          ]}
        >
          <InputNumber min={1} max={maxReturnable} style={{ width: '100%' }} />
        </Form.Item>

        {/* Bỏ lý do trả vì hàng nguyên vẹn không cần lý do 
        <Form.Item
          name="returnReason"
          label="Lý do trả"
          rules={[{ required: true, message: 'Vui lòng nhập lý do trả món!' }]}
        >
          <Input.TextArea rows={3} placeholder="Ví dụ: Khách chê món mặn, món bị hỏng..." />
        </Form.Item>
        */}
        <div style={{ color: 'orange', fontStyle: 'italic', marginBottom: 16 }}>
          Lưu ý: hàng chỉ được trả khi là đồ đóng hộp và còn nguyên!
        </div>
        <Form.Item name="isIntact" valuePropName="checked" style={{ display: 'none' }}>
          <Checkbox disabled>
            Hàng còn nguyên vẹn (Sẽ được nhập lại vào kho)
          </Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReturnItemModal;
