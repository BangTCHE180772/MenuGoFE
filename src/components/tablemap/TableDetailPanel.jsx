import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Tag, Empty, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, CodeSandboxOutlined } from '@ant-design/icons';

const TableDetailPanel = ({ table, summary, loading, onConfirm, onServe }) => {
  const navigate = useNavigate();

  if (!table) {
    return (
      <div className="tablemap-detail-empty">
        <Empty description="Chọn một bàn để xem chi tiết" />
      </div>
    );
  }

  const qrUrl = `${window.location.origin}/customer-order/${table.id}`;

  const renderStatusTag = (status, cookingStatus) => {
    if (status === 'Cancelled') return <Tag color="red">Đã huỷ</Tag>;
    if (status === 'CustomerPending') return <Tag color="default">Chờ xác nhận</Tag>;

    switch (cookingStatus) {
      case 'Waiting': return <Tag color="orange">Chờ bếp</Tag>;
      case 'Cooking': return <Tag color="blue">Đang nấu</Tag>;
      case 'Ready': return <Tag color="green">Sẵn sàng</Tag>;
      case 'Served': return <Tag color="purple">Đã phục vụ</Tag>;
      default: return <Tag color="default">{cookingStatus}</Tag>;
    }
  };

  return (
    <div className="tablemap-detail-panel">
      <div className="tablemap-detail-header">
        <h3>{table.name} {table.areaName ? `(${table.areaName})` : ''}</h3>
        <Button
          type="primary"
          onClick={() => navigate(`/orders?tableId=${table.id}`)}
        >
          Sang trang Order
        </Button>
      </div>

      <div className="tablemap-qr-section">
        <div className="tablemap-qr-container">
          <QRCodeSVG value={qrUrl} size={120} />
        </div>
        <div className="tablemap-qr-info">
          <p>Mã QR quét đặt món</p>
          <small>Khách quét mã này để tự order tại bàn</small>
        </div>
      </div>

      <div className="tablemap-order-list">
        <h4>Danh sách món ({summary?.items?.length || 0})</h4>
        {loading ? (
          <div className="tablemap-loading">
            <Spin />
          </div>
        ) : summary?.items?.length > 0 ? (
          <div className="tablemap-items">
            {summary.items.map((item) => (
              <div key={item.orderDetailId} className="tablemap-item-row">
                <div className="tablemap-item-info">
                  <div className="tablemap-item-name">
                    <strong>{item.quantity}x</strong> {item.productName}
                  </div>
                  {item.note && <div className="tablemap-item-note">Ghi chú: {item.note}</div>}
                  <div className="tablemap-item-status">
                    {renderStatusTag(item.status, item.cookingStatus)}
                  </div>
                </div>

                <div className="tablemap-item-actions">
                  {item.status === 'CustomerPending' && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={() => onConfirm(item.orderDetailId)}
                    >
                      Xác nhận
                    </Button>
                  )}
                  {item.status === 'Confirmed' && item.cookingStatus === 'Ready' && (
                    <Button
                      type="default"
                      size="small"
                      icon={<CodeSandboxOutlined />}
                      onClick={() => onServe(item.orderDetailId)}
                    >
                      Đã phục vụ
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="Chưa có món nào được gọi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
};

export default TableDetailPanel;
