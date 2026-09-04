import React, { useState, useRef } from 'react';
import { Modal, InputNumber, Input, Form, message, Checkbox, Select } from 'antd';
import axiosInstance from '../../api/axiosInstance';

const ReturnItemModal = ({ visible, item, onCancel, onSuccess, isCustomerMode = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const actionRef = useRef(false);
  const isIntact = Form.useWatch('isIntact', form);

  if (!item) return null;

  const maxReturnable = item.quantity - (item.returnedQuantity || 0);

  const getReasonOptions = () => {
    // Nếu là đồ thường (Regular) và nguyên vẹn: được phép chọn lý do mở rộng
    if (item.productType === 'Regular' && isIntact) {
      return [
        { value: 'Khách gọi dư', label: 'Khách gọi dư' },
        { value: 'Nhân viên bấm nhầm', label: 'Nhân viên bấm nhầm' },
        { value: 'Bàn hủy món phút chót', label: 'Bàn hủy món phút chót' },
        { value: 'Lý do khác', label: 'Lý do khác' }
      ];
    }
    // Các trường hợp còn lại (Processed hoặc Không nguyên vẹn): Chỉ các lỗi do nhà hàng
    return [
      { value: 'Ra món chậm', label: 'Ra món chậm' },
      { value: 'Thức ăn nguội/kém chất lượng', label: 'Thức ăn nguội/kém chất lượng' },
      { value: 'Có dị vật', label: 'Có dị vật' },
      { value: 'Nhân viên làm đổ', label: 'Nhân viên làm đổ' },
      { value: 'Lên sai món', label: 'Lên sai món' },
      { value: 'Bao bì rách/hỏng', label: 'Bao bì rách/hỏng' },
      { value: 'Lý do khác', label: 'Lý do khác' }
    ];
  };

  const handleIntactChange = () => {
    form.setFieldsValue({ returnReason: undefined });
  };

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

        <Form.Item
          name="returnReason"
          label="Lý do trả"
          rules={[{ required: true, message: 'Vui lòng chọn lý do trả món!' }]}
        >
          <Select
            placeholder="Chọn lý do trả món..."
            options={getReasonOptions()}
          />
        </Form.Item>

        <Form.Item name="isIntact" valuePropName="checked">
          <Checkbox onChange={handleIntactChange}>
            Hàng còn nguyên vẹn (Sẽ được nhập lại vào kho nếu là mặt hàng Thường)
          </Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReturnItemModal;
