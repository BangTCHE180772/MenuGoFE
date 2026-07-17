import React, { useMemo, useState, useEffect } from 'react';
import { Modal, Table, Typography, Button, message, Divider, Input, Checkbox, Row, Col, Radio, QRCode } from 'antd';
import { payOrder } from '../../api/orderApi';
import { createPaymentLink, checkPaymentStatus } from '../../api/paymentApi';
import CustomerSearchInput from '../common/CustomerSearchInput';
import { useSignalR } from '../../context/SignalRContext';

const { Text, Title } = Typography;

const formatPrice = (price) => Number(price).toLocaleString('vi-VN') + 'đ';

const PaymentModal = ({ visible, orderId, items, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerDeclined, setCustomerDeclined] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [qrCodeData, setQrCodeData] = useState(null);

  const connection = useSignalR();

  useEffect(() => {
    if (visible) {
      setCustomerPhone('');
      setCustomerName('');
      setCustomerDeclined(false);
      setPaymentMethod('Cash');
      setQrCodeData(null);
    }
  }, [visible]);

  useEffect(() => {
    if (connection && visible && paymentMethod === 'PayOS') {
      const handleNotification = (data) => {
        if (data && data.type === 'PaymentWebhook' || data?.Type === 'PaymentWebhook') {
          message.success(data.message || data.Message || 'Thanh toán thành công qua PayOS!');
          if (onSuccess) onSuccess();
        }
      };
      connection.on('ReceiveNotification', handleNotification);
      return () => connection.off('ReceiveNotification', handleNotification);
    }
  }, [connection, visible, paymentMethod, onSuccess]);

  const handleSelectCustomer = (customer) => {
    setCustomerName(customer.name);
  };

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
      const payload = {
        customerName: customerDeclined ? null : customerName,
        customerPhone: customerDeclined ? null : customerPhone,
      };
      
      if (paymentMethod === 'Cash') {
        await payOrder(orderId, payload, 'Cash');
        message.success('Thanh toán tiền mặt thành công. Bàn đã chuyển sang trạng thái cần dọn dẹp!');
        if (onSuccess) onSuccess();
      } else {
        // PayOS
        const data = await createPaymentLink(orderId);
        if (data && data.qrCode) {
          setQrCodeData(data.qrCode);
          message.success('Đã tạo mã QR PayOS. Vui lòng đưa khách quét mã!');
        } else {
          message.error('Không thể tạo mã QR PayOS!');
        }
      }
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
        <Button 
          key="submit" 
          type="primary" 
          danger 
          onClick={handlePay} 
          loading={loading}
          disabled={qrCodeData && paymentMethod === 'PayOS'}
        >
          {paymentMethod === 'PayOS' ? (qrCodeData ? 'Đang chờ thanh toán...' : 'Tạo mã QR PayOS') : 'Thanh toán hoá đơn'}
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

      <div style={{ marginBottom: 16 }}>
        <Text strong>Phương thức thanh toán:</Text>
        <Radio.Group 
          value={paymentMethod} 
          onChange={(e) => {
            setPaymentMethod(e.target.value);
            setQrCodeData(null);
          }}
          style={{ marginLeft: 16 }}
        >
          <Radio value="Cash">Tiền mặt</Radio>
          <Radio value="PayOS">Chuyển khoản (PayOS)</Radio>
        </Radio.Group>
      </div>

      {qrCodeData && paymentMethod === 'PayOS' && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={5}>Quét mã để thanh toán</Title>
          <QRCode value={qrCodeData} size={200} />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">Vui lòng đợi hệ thống xác nhận thanh toán tự động (SignalR)...</Text>
          </div>
          <Button 
            type="dashed" 
            onClick={async () => {
              setLoading(true);
              try {
                const data = await checkPaymentStatus(orderId);
                if (data && data.status === 'Success') {
                  message.success(data.message || 'Thanh toán thành công!');
                  if (onSuccess) onSuccess();
                } else {
                  message.info(data.message || 'Chưa thanh toán hoặc đã huỷ.');
                }
              } catch (error) {
                message.error(error?.response?.data?.message || 'Không thể kiểm tra trạng thái thanh toán!');
              } finally {
                setLoading(false);
              }
            }} 
            style={{ marginTop: 8 }}
            loading={loading}
          >
            Kiểm tra thanh toán
          </Button>
        </div>
      )}

      {/* Customer Info Section */}
      <div style={{ marginBottom: 16, padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong>Thông tin khách hàng</Text>
          <Checkbox
            checked={customerDeclined}
            onChange={(e) => {
              setCustomerDeclined(e.target.checked);
              if (e.target.checked) {
                setCustomerPhone('');
                setCustomerName('');
              }
            }}
          >
            Khách không cung cấp
          </Checkbox>
        </div>
        <Row gutter={12}>
          <Col span={12}>
            <Input
              placeholder="Tên khách hàng"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={customerDeclined}
            />
          </Col>
          <Col span={12}>
            <CustomerSearchInput 
              value={customerPhone}
              onChange={setCustomerPhone}
              onSelectCustomer={handleSelectCustomer}
              disabled={customerDeclined}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </div>

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
