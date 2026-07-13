import React, { useMemo, useState } from 'react';
import { Modal, Table, Typography, Button, message, Divider } from 'antd';
import { payOrder } from '../../api/orderApi';

const { Text, Title } = Typography;

const formatPrice = (price) => Number(price).toLocaleString('vi-VN') + 'đ';

const PaymentModal = ({ visible, orderId, items, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const groupedItems = useMemo(() => {
    if (!items) return [];
    const map = new Map();
    items.forEach((item) => {
      if (item.status === 'Cancelled') return;

      const key = `${item.productId || item.productName}-${item.price}`;
      if (map.has(key)) {
        const existing = map.get(key);
        existing.quantity += item.quantity;
        existing.totalPrice += item.quantity * item.price;
      } else {
        map.set(key, {
          key: key,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.quantity * item.price,
        });
      }
    });
    return Array.from(map.values());
  }, [items]);

  const subTotal = useMemo(() => {
    return groupedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [groupedItems]);

  const vat = Math.round(subTotal * 0.08);
  const grandTotal = subTotal + vat;

  const handlePay = async () => {
    if (!orderId) {
      message.error('Không tìm thấy mã hoá đơn hợp lệ!');
      return;
    }

    setLoading(true);
    try {
      await payOrder(orderId);
      message.success('Thanh toán thành công. Bàn đã chuyển sang trạng thái cần dọn dẹp!');
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi thanh toán!');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Tên món',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      width: 60,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (val) => formatPrice(val),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      align: 'right',
      render: (val) => <strong>{formatPrice(val)}</strong>,
    },
  ];

  return (
    <Modal
      title={<Title level={4} style={{ margin: 0 }}>Xác nhận thanh toán</Title>}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel} disabled={loading}>
          Huỷ
        </Button>,
        <Button key="submit" type="primary" danger onClick={handlePay} loading={loading}>
          Thanh toán hoá đơn
        </Button>,
      ]}
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">Vui lòng kiểm tra kỹ danh sách món trước khi thanh toán.</Text>
      </div>

      <Table
        dataSource={groupedItems}
        columns={columns}
        pagination={false}
        size="small"
        bordered
      />

      <Divider style={{ margin: '16px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
          <Text>Cộng tiền hàng:</Text>
          <Text>{formatPrice(subTotal)}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
          <Text>VAT (8%):</Text>
          <Text>{formatPrice(vat)}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', marginTop: 8 }}>
          <Text strong style={{ fontSize: 16 }}>Tổng cộng:</Text>
          <Text strong style={{ fontSize: 18, color: '#f5222d' }}>{formatPrice(grandTotal)}</Text>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
