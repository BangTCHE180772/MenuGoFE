import { Tag, Button } from "antd";
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  CompassOutlined,
  ShopOutlined,
  StarFilled,
} from "@ant-design/icons";

const CustomerBranchCard = ({ branch, isMain }) => {
  const branchName = branch.name || branch.Name || "Chi nhánh MenuGo";
  const address =
    branch.newAddressName ||
    branch.newaddressname ||
    branch.addressName ||
    branch.address ||
    "Địa chỉ chưa cập nhật";
  const openTime = branch.openTime || "08:00";
  const closeTime = branch.closeTime || "22:00";
  const phone = branch.phone || branch.phoneNumber || "1900 6868";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address,
  )}`;

  return (
    <div className={`customer-branch-card ${isMain ? "main-branch" : ""}`}>
      <div className="branch-card-header">
        <div className="branch-badge-group">
          {isMain ? (
            <Tag color="gold" className="badge-headquarter">
              <StarFilled /> Trụ sở chính
            </Tag>
          ) : (
            <Tag color="blue" className="badge-branch">
              <ShopOutlined /> Chi nhánh
            </Tag>
          )}
        </div>
      </div>

      <h3 className="branch-title">{branchName}</h3>

      <div className="branch-info-list">
        <div className="info-row">
          <EnvironmentOutlined className="info-icon icon-location" />
          <div className="info-content">
            <span className="info-label">Địa chỉ</span>
            <span className="info-value">{address}</span>
          </div>
        </div>

        <div className="info-row">
          <ClockCircleOutlined className="info-icon icon-clock" />
          <div className="info-content">
            <span className="info-label">Giờ hoạt động</span>
            <span className="info-value">
              {openTime} - {closeTime}
            </span>
          </div>
        </div>

        <div className="info-row">
          <PhoneOutlined className="info-icon icon-phone" />
          <div className="info-content">
            <span className="info-label">Hotline đặt bàn</span>
            <span className="info-value">{phone}</span>
          </div>
        </div>
      </div>

      <div className="branch-maps-preview">
        <div className="maps-iframe-wrapper">
          <iframe
            title={`Bản đồ ${branchName}`}
            width="100%"
            height="160"
            style={{ border: 0, borderRadius: "8px", display: "block" }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
          ></iframe>
        </div>
        <Button
          type="default"
          icon={<CompassOutlined />}
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-directions"
          block
        >
          Xem đường đi trên Google Maps
        </Button>
      </div>
    </div>
  );
};

export default CustomerBranchCard;
