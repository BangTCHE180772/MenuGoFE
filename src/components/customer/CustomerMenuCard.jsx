import { Tag, Button } from "antd";
import { EyeOutlined, CoffeeOutlined } from "@ant-design/icons";

const formatPrice = (price) => {
  if (price === undefined || price === null) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const CustomerMenuCard = ({ product, onViewDetail }) => {
  const name = product.name || product.Name || "Món ăn chưa đặt tên";
  const price = product.price ?? product.Price ?? 0;
  const image =
    product.imageLink ||
    product.image ||
    product.ImageLink ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
  const groupName = product.groupName || product.Group?.Name || product.category;

  return (
    <div className="customer-menu-card">
      {/* Thumbnail */}
      <div className="card-image-wrapper">
        <img src={image} alt={name} className="card-img" loading="lazy" />
        <div className="card-overlay">
          <Button
            type="primary"
            shape="round"
            icon={<EyeOutlined />}
            onClick={() => onViewDetail(product)}
            className="btn-quick-view"
          >
            Xem chi tiết
          </Button>
        </div>
        {product.isNew && (
          <span className="card-new-badge">
            Mới
          </span>
        )}
      </div>

      {/* Info */}
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
  );
};

export default CustomerMenuCard;
