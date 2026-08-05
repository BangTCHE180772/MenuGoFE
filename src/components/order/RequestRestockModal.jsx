import React, { useState, useEffect } from 'react';
import { Modal, List, Button, InputNumber, message, Skeleton, Avatar, Typography } from 'antd';
import { SendOutlined, FireOutlined } from '@ant-design/icons';
import { getAllProducts } from '../../api/productApi';
import { requestRestock } from '../../api/kitchenApi';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;

const RequestRestockModal = ({ visible, onClose, branchId }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (visible) {
      fetchManufacturedProducts();
    }
  }, [visible]);

  const fetchManufacturedProducts = async () => {
    setLoading(true);
    try {
      const res = await getAllProducts('Manufactured');
      setProducts(res.data || []);
      const initQ = {};
      (res.data || []).forEach(p => {
        initQ[p.id] = 1;
      });
      setQuantities(initQ);
    } catch (error) {
      message.error("Lỗi khi tải danh sách mặt hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (id, value) => {
    setQuantities(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleRequest = async (productId) => {
    const qty = quantities[productId];
    if (!qty || qty <= 0) {
      message.warning("Vui lòng nhập số lượng hợp lệ.");
      return;
    }

    if (!branchId) {
      message.error("Không xác định được Chi nhánh hiện tại.");
      return;
    }

    try {
      await requestRestock({
        branchId,
        productId,
        quantity: qty
      });
      message.success("Đã gửi yêu cầu xuống Bếp thành công!");
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi gửi yêu cầu.");
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FireOutlined style={{ color: '#f5222d', fontSize: '20px' }} />
          <span>Yêu cầu Bếp</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      bodyStyle={{ padding: '8px 0' }}
    >
      <div style={{ padding: '0 24px', marginBottom: 16 }}>
        <Text type="secondary">Gửi yêu cầu trực tiếp xuống bếp (ví dụ: nước chấm, sốt, đồ dùng...)</Text>
      </div>
      <Skeleton loading={loading} active paragraph={{ rows: 4 }}>
        <List
          itemLayout="horizontal"
          dataSource={products}
          renderItem={(item) => (
            <List.Item
              style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}
              actions={[
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} key="actions">
                  <InputNumber
                    min={1}
                    max={99}
                    value={quantities[item.id]}
                    onChange={(val) => handleQuantityChange(item.id, val)}
                    style={{ width: '60px' }}
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={() => handleRequest(item.id)}
                    style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                  >
                    Gửi
                  </Button>
                </div>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={item.imageUrl} shape="square" size="large" />}
                title={<span style={{ fontWeight: 500 }}>{item.name}</span>}
                description={item.description || "Thực hiện tại bếp"}
              />
            </List.Item>
          )}
          locale={{ emptyText: "Chưa có mặt hàng nào được cấu hình." }}
        />
      </Skeleton>
    </Modal>
  );
};

export default RequestRestockModal;
