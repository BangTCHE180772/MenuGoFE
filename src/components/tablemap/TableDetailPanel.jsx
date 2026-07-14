import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Tag, Empty, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, CodeSandboxOutlined, DollarOutlined, BranchesOutlined } from '@ant-design/icons';
import PaymentModal from '../payment/PaymentModal';
import MergeTableModal from './MergeTableModal';

const { Text } = Typography;

const TableDetailPanel = ({ table, summary, loading, onConfirm, onServe, onPaymentSuccess, tables }) => {
  const navigate = useNavigate();
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);

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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {summary?.activeOrderId && table.status === 'Occupied' && (
            <>
              <Button
                type="dashed"
                icon={<BranchesOutlined />}
                onClick={() => setIsMergeModalVisible(true)}
              >
                Gộp bàn
              </Button>
              <Button
                danger
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => setIsPaymentModalVisible(true)}
              >
                Thanh toán
              </Button>
            </>
          )}
          <Button
            type="primary"
            onClick={() => navigate(`/orders?tableId=${table.id}`)}
          >
            Sang trang Order
          </Button>
        </div>
      </div>

      <div className="tablemap-qr-section">
        <div className="tablemap-qr-container">
          <QRCodeSVG value={qrUrl} size={120} />
        </div>
        <div className="tablemap-qr-info">
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>Mã QR quét đặt món</p>
          <small style={{ color: '#666', display: 'block', marginBottom: '8px' }}>Khách quét mã này để tự order tại bàn</small>
          <div style={{
            background: '#f5f5f5',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            wordBreak: 'break-all'
          }}>
            <Text copyable style={{ fontSize: '13px' }}>{qrUrl}</Text>
          </div>
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

      <PaymentModal
        visible={isPaymentModalVisible}
        orderId={summary?.activeOrderId}
        items={summary?.items}
        onCancel={() => setIsPaymentModalVisible(false)}
        onSuccess={() => {
          setIsPaymentModalVisible(false);
          if (onPaymentSuccess) onPaymentSuccess(table.id);
        }}
      />

      {isMergeModalVisible && (
        <MergeTableModal
          visible={isMergeModalVisible}
          onClose={() => setIsMergeModalVisible(false)}
          tables={tables}
          currentTable={table}
          onMerged={onPaymentSuccess}
        />
      )}
    </div>
  );
};

export default TableDetailPanel;
