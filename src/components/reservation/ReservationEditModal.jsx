import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, message } from 'antd';
import dayjs from 'dayjs';
import { updateReservation } from '../../api/reservationApi';

const ReservationEditModal = ({ visible, onClose, onSuccess, reservation }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && reservation) {
      form.setFieldsValue({
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        numberOfGuests: reservation.numberOfGuests,
        note: reservation.note,
        reservationTime: dayjs(reservation.reservationTime)
      });
    } else {
      form.resetFields();
    }
  }, [visible, reservation, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const updateData = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        numberOfGuests: values.numberOfGuests,
        reservationTime: values.reservationTime.toISOString(),
        note: values.note || ''
      };

      await updateReservation(reservation.id, updateData);
      message.success('Cập nhật thông tin đặt bàn thành công');
      onSuccess();
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Sửa Thông Tin Đặt Bàn"
      open={visible}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="customerName"
          label="Tên khách hàng"
          rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
        >
          <Input placeholder="Nhập tên khách hàng" />
        </Form.Item>

        <Form.Item
          name="customerPhone"
          label="Số điện thoại"
          rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item
          name="reservationTime"
          label="Thời gian đặt bàn"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
        >
          <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="numberOfGuests"
          label="Số lượng khách"
          rules={[{ required: true, message: 'Vui lòng nhập số khách' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="note"
          label="Ghi chú"
        >
          <Input.TextArea placeholder="Nhập ghi chú (nếu có)" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReservationEditModal;
