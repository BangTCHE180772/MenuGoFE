import React, { useState, useMemo } from 'react';
import { Modal, Tabs, List, Card, Button, InputNumber, Typography, Row, Col, Space, Badge } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const MenuSelectionModal = ({ visible, onCancel, onConfirm, products, initialSelectedItems }) => {
  const [selectedItems, setSelectedItems] = useState(initialSelectedItems || []);

  React.useEffect(() => {
    if (visible) {
      setSelectedItems(initialSelectedItems || []);
    }
  }, [visible, initialSelectedItems]);

  const categories = useMemo(() => {
    const map = { 'Tất cả': products };
    products.forEach(p => {
      const groupName = p.group?.name || 'Chưa phân loại';
      if (!map[groupName]) map[groupName] = [];
      map[groupName].push(p);
    });
    return map;
  }, [products]);

  const handleUpdateQuantity = (product, delta) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(item => item.productId !== product.id);
        }
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: newQty } : item
        );
      } else if (delta > 0) {
        return [...prev, { productId: product.id, name: product.name, price: product.sellPrice, quantity: delta, note: '' }];
      }
      return prev;
    });
  };

  const getQuantity = (productId) => {
    const item = selectedItems.find(i => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal
      title="Chọn Món Phục Vụ"
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="back" onClick={onCancel}>Hủy</Button>,
        <Button key="submit" type="primary" onClick={() => onConfirm(selectedItems)}>
          Xác nhận ({totalItems} món)
        </Button>
      ]}
      style={{ top: 20 }}
      bodyStyle={{ height: '60vh', overflow: 'hidden', padding: 0 }}
    >
      <Row style={{ height: '100%' }}>
        <Col span={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #f0f0f0' }}>
          <Tabs
            defaultActiveKey="Tất cả"
            style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column' }}
            items={Object.keys(categories).map(catName => ({
              key: catName,
              label: catName,
              children: (
                <div style={{ height: 'calc(60vh - 60px)', overflowY: 'auto', paddingBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                    {categories[catName].map(p => {
                      const qty = getQuantity(p.id);
                      return (
                        <Col span={8} key={p.id}>
                          <Badge count={qty} offset={[-10, 10]} color="#52c41a">
                            <Card
                              hoverable
                              bodyStyle={{ padding: 12, textAlign: 'center' }}
                              style={{ height: '100%', borderColor: qty > 0 ? '#1890ff' : '#f0f0f0' }}
                              onClick={() => handleUpdateQuantity(p, 1)}
                            >
                              {p.imageUrl && (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                                />
                              )}
                              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.name}
                              </div>
                              <Text type="success" strong>
                                {Number(p.sellPrice).toLocaleString('vi-VN')}đ
                              </Text>
                            </Card>
                          </Badge>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )
            }))}
          />
        </Col>

        <Col span={8} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
            <Title level={5} style={{ margin: 0 }}>Món đã chọn</Title>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {selectedItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>
                Chưa có món nào được chọn
              </div>
            ) : (
              <List
                dataSource={selectedItems}
                renderItem={item => (
                  <List.Item style={{ padding: '8px 0', borderBottom: '1px dashed #f0f0f0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong style={{ flex: 1 }}>{item.name}</Text>
                        <Text strong>{Number(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary">{Number(item.price).toLocaleString('vi-VN')}đ</Text>
                        <Space>
                          <Button
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() => handleUpdateQuantity({ id: item.productId }, -1)}
                          />
                          <Text style={{ width: 24, textAlign: 'center', display: 'inline-block' }}>{item.quantity}</Text>
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => handleUpdateQuantity({ id: item.productId, name: item.name, sellPrice: item.price }, 1)}
                          />
                        </Space>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
          <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong fontSize={16}>Tổng tiền:</Text>
              <Text type="danger" strong style={{ fontSize: 18 }}>
                {totalAmount.toLocaleString('vi-VN')}đ
              </Text>
            </div>
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

export default MenuSelectionModal;
