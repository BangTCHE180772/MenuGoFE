import React, { useState } from "react";
import { Tag, Button, Modal } from "antd";
import { EyeOutlined, CoffeeOutlined, CustomerServiceOutlined, MessageOutlined } from "@ant-design/icons";

const formatPrice = (price) => {
  if (price === undefined || price === null) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const CustomerMenuCard = ({ product, onViewDetail, onConsult }) => {
  const [consultModalOpen, setConsultModalOpen] = useState(false);

  const name = product.name || product.Name || "Món ăn chưa đặt tên";
  const price = product.price ?? product.Price ?? 0;
  const image =
    product.imageLink ||
    product.image ||
    product.ImageLink ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
  const groupName = product.groupName || product.Group?.Name || product.category;

  const handleConfirmConsult = () => {
    setConsultModalOpen(false);
    if (onConsult) {
      onConsult(product);
    }
  };

  return (
    <>
      <div className="customer-menu-card">
        <div className="card-image-wrapper">
          <img 
            src={image} 
            alt={name} 
            className="card-img" 
            loading="lazy" 
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'; 
            }}
          />
          <div className="card-overlay" style={{ gap: 8 }}>
            <Button
              type="primary"
              shape="round"
              icon={<EyeOutlined />}
              onClick={() => onViewDetail(product)}
              className="btn-quick-view"
            >
              Xem chi tiết
            </Button>
            <Button
              shape="round"
              icon={<MessageOutlined />}
              onClick={() => setConsultModalOpen(true)}
              style={{
                background: '#ea580c',
                borderColor: '#ea580c',
                color: '#fff',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
              }}
            >
              Tư vấn
            </Button>
          </div>
          {product.isNew && (
            <span className="card-new-badge">
              Mới
            </span>
          )}
        </div>

        <div className="card-info">
          {groupName && (
            <Tag className="card-category-tag">
              <CoffeeOutlined /> {groupName}
            </Tag>
          )}
          <h3 className="card-title" title={name}>
            {name}
          </h3>
          <div className="card-footer-row">
            <div className="card-price">{formatPrice(price)}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Button
                type="text"
                size="small"
                icon={<MessageOutlined style={{ color: '#ea580c' }} />}
                onClick={() => setConsultModalOpen(true)}
                style={{ color: '#ea580c', fontWeight: 600, fontSize: 12 }}
              >
                Tư vấn
              </Button>
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => onViewDetail(product)}
                className="btn-link-detail"
              >
                Xem
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Xác Nhận Tư Vấn Món Ăn */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
            <CustomerServiceOutlined style={{ color: '#ea580c' }} /> Xác nhận tư vấn món ăn
          </div>
        }
        open={consultModalOpen}
        onCancel={() => setConsultModalOpen(false)}
        onOk={handleConfirmConsult}
        okText="Có, gửi vào chat"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#ea580c', borderColor: '#ea580c', borderRadius: 6, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 6 } }}
        centered
        width={440}
      >
        <div style={{ padding: '8px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
          <img
            src={image}
            alt={name}
            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #fed7aa' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
            }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{name}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ea580c', marginTop: 2 }}>{formatPrice(price)}</div>
          </div>
        </div>
        <p style={{ marginTop: 8, color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
          Bạn có muốn tư vấn về món này không? Thông tin món sẽ được gửi trực tiếp vào khung chat để nhân viên hỗ trợ.
        </p>
      </Modal>
    </>
  );
};

export default CustomerMenuCard;
