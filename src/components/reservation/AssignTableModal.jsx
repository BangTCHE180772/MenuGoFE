import React, { useState, useEffect } from 'react';
import { Modal, Select, message, Spin, Form } from 'antd';
import { assignTablesToReservation, getAvailableTablesForReservation } from '../../api/reservationApi';

const AssignTableModal = ({ visible, onClose, onSuccess, reservation }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);

  useEffect(() => {
    if (visible && reservation) {
      form.resetFields();
      fetchAvailableTables();
    }
  }, [visible, reservation]);

  const fetchAvailableTables = async () => {
    try {
      setLoading(true);
      const data = await getAvailableTablesForReservation(reservation.branchId, reservation.reservationTime);
      setAvailableTables(data);
    } catch (error) {
      message.error('Lỗi tải danh sách bàn trống!');
    } finally {
      setLoading(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const { tableIds } = values;

      if (!tableIds || tableIds.length === 0) {
        message.warning('Vui lòng chọn ít nhất 1 bàn!');
        return;
      }

      setSubmitting(true);
      await assignTablesToReservation(reservation.id, tableIds);
      message.success('Xếp bàn thành công!');
      onSuccess();
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || 'Xếp bàn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Xếp Bàn Cho Khách"
      open={visible}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {reservation && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>Khách hàng:</strong> {reservation.customerName} - {reservation.customerPhone}</p>
            <p><strong>Số lượng:</strong> {reservation.numberOfGuests} người (Cần {reservation.tableCount} bàn)</p>
          </div>
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            name="tableIds"
            label="Chọn bàn trống"
            rules={[
              { required: true, message: 'Vui lòng chọn bàn!' },
              { type: 'array', min: 1, message: 'Vui lòng chọn ít nhất 1 bàn!' }
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn bàn..."
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {availableTables.map(t => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default AssignTableModal;
