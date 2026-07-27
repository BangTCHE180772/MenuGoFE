import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Modal, Table, Typography, Button, message, Divider, Input, Checkbox, Row, Col, Radio, QRCode, Select } from 'antd';
import { payOrder } from '../../api/orderApi';
import { createPaymentLink, checkPaymentStatus } from '../../api/paymentApi';
import { checkVoucher, getAllVouchers } from '../../api/voucherApi';
import CustomerSearchInput from '../common/CustomerSearchInput';
import { useSignalR } from '../../context/SignalRContext';

const { Text, Title } = Typography;

const formatPrice = (price) => Number(price).toLocaleString('vi-VN') + 'đ';

const PaymentModal = ({ visible, orderId, items, branchId, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerDeclined, setCustomerDeclined] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [usePoints, setUsePoints] = useState(false);
  const [allVouchers, setAllVouchers] = useState([]);

  const connection = useSignalR();

  useEffect(() => {
    if (visible) {
      setCustomerPhone('');
      setCustomerName('');
      setCustomerData(null);
      setCustomerDeclined(false);
      setPaymentMethod('Cash');
      setQrCodeData(null);
      setVoucherCode('');
      setAppliedVoucher(null);
      setUsePoints(false);

      const fetchVouchers = async () => {
        try {
          const data = await getAllVouchers();
          setAllVouchers(data || []);
        } catch (error) {
          console.error('Lỗi khi tải voucher:', error);
        }
      };
      fetchVouchers();
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
    setCustomerData(customer);
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
  const baseTotal = subTotal + vat;

  const applicableVouchers = useMemo(() => {
    const now = new Date();
    return allVouchers.filter(v => {
      if (!v.isActive) return false;
      if (v.usedCount >= v.quantity) return false;
      if (new Date(v.startDate) > now || new Date(v.endDate) < now) return false;
      if (v.branchId && v.branchId !== branchId) return false;
      if (baseTotal < v.minOrderValue) return false;
      return true;
    });
  }, [allVouchers, baseTotal, branchId]);

  const handleCheckVoucher = async () => {
    if (!voucherCode) return;
    try {
      setLoading(true);
      const res = await checkVoucher(voucherCode, branchId || 0, baseTotal);
      setAppliedVoucher({
        discountAmount: res.discountAmount,
        message: res.message
      });
      message.success(res.message);
    } catch (error) {
      setAppliedVoucher(null);
      message.error(error.response?.data?.message || 'Voucher không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const voucherDiscount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const pointsAvailable = customerData?.point || 0;

  let pointsDiscount = 0;
  if (usePoints && pointsAvailable > 0) {
    const afterVoucher = baseTotal - voucherDiscount;
    pointsDiscount = Math.min(pointsAvailable, afterVoucher); // 1 point = 1 VND
  }

  const grandTotal = baseTotal - voucherDiscount - pointsDiscount;

  const isPayingRef = useRef(false);

  const handlePay = async () => {
    if (!orderId) {
      message.error('Không tìm thấy mã hoá đơn hợp lệ!');
      return;
    }
    if (isPayingRef.current) return;

    isPayingRef.current = true;
    setLoading(true);
    try {
      const payload = {
        customerName: customerDeclined ? null : customerName,
        customerPhone: customerDeclined ? null : customerPhone,
        voucherCode: appliedVoucher ? voucherCode : null,
        pointsUsed: pointsDiscount
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
      isPayingRef.current = false;
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
                setCustomerData(null);
                setUsePoints(false);
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
        {customerData && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">Điểm tích luỹ: <strong style={{ color: '#52c41a' }}>{customerData.point || 0} điểm</strong></Text>
            {customerData.point > 0 && (
              <div style={{ marginTop: 4 }}>
                <Checkbox checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)}>
                  Sử dụng điểm trừ vào hoá đơn
                </Checkbox>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <Row gutter={8}>
          <Col flex="auto">
            <Select 
              placeholder="Chọn mã Voucher (nếu có)" 
              value={voucherCode || null} 
              onChange={(val) => setVoucherCode(val || '')}
              disabled={!!appliedVoucher}
              style={{ width: '100%' }}
              allowClear
              notFoundContent="Không có mã giảm giá phù hợp"
            >
              {applicableVouchers.map(v => (
                <Select.Option key={v.code} value={v.code}>
                  {v.name} ({v.code}) - {v.discountType === 'Fixed' ? formatPrice(v.discountValue) : `${v.discountValue}%`}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            {appliedVoucher ? (
              <Button type="dashed" danger onClick={() => { setVoucherCode(''); setAppliedVoucher(null); }}>Huỷ mã</Button>
            ) : (
              <Button type="primary" onClick={handleCheckVoucher} loading={loading} disabled={!voucherCode}>Áp dụng</Button>
            )}
          </Col>
        </Row>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
          <Text>Cộng tiền hàng:</Text>
          <Text>{formatPrice(subTotal)}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
          <Text>VAT (8%):</Text>
          <Text>{formatPrice(vat)}</Text>
        </div>
        {voucherDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
            <Text type="success">Voucher giảm:</Text>
            <Text type="success">-{formatPrice(voucherDiscount)}</Text>
          </div>
        )}
        {pointsDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
            <Text type="success">Dùng điểm:</Text>
            <Text type="success">-{formatPrice(pointsDiscount)}</Text>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', marginTop: 8 }}>
          <Text strong style={{ fontSize: 16 }}>Tổng cộng:</Text>
          <Text strong style={{ fontSize: 18, color: '#f5222d' }}>{formatPrice(grandTotal > 0 ? grandTotal : 0)}</Text>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
