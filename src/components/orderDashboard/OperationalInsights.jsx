import React from "react";
import { Card, Alert, Empty, Badge } from "antd";
import {
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  NotificationOutlined,
} from "@ant-design/icons";

const OperationalInsights = ({ alerts = [], loading = false }) => {
  // Helpers to assign icons and types to alerts based on text keywords
  const getAlertType = (text) => {
    const t = text.toLowerCase();
    if (t.includes("chưa thanh toán") || t.includes("lỗ")) return "error";
    if (t.includes("chờ nấu") || t.includes("muộn") || t.includes("trên 1 giờ")) return "warning";
    return "info";
  };

  const getAlertIcon = (text) => {
    const t = text.toLowerCase();
    if (t.includes("chưa thanh toán") || t.includes("lỗ")) {
      return <WarningOutlined style={{ color: "#ef4444" }} />;
    }
    if (t.includes("chờ nấu") || t.includes("muộn") || t.includes("trên 1 giờ")) {
      return <WarningOutlined style={{ color: "#eab308" }} />;
    }
    return <InfoCircleOutlined style={{ color: "#3b82f6" }} />;
  };

  return (
    <Card
      bordered={false}
      loading={loading}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NotificationOutlined style={{ color: "#ef4444" }} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>🚨 Cảnh báo Vận hành & Phát hiện Bất thường (Operational Insights)</span>
          {alerts.length > 0 && (
            <Badge count={alerts.length} style={{ backgroundColor: "#ef4444", marginLeft: 4 }} />
          )}
        </div>
      }
      style={{
        borderRadius: 12,
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--color-border)",
        marginBottom: 24,
      }}
      styles={{ body: { padding: "16px 20px" } }}
    >
      {alerts.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <CheckCircleOutlined style={{ fontSize: 36, color: "#22c55e", marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 650, color: "#22c55e" }}>Không có cảnh báo vận hành</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
            Hệ thống hoạt động trơn tru. Tất cả đơn hàng và bếp đang trong tầm kiểm soát ổn định.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alerts.map((alertText, index) => (
            <Alert
              key={index}
              message={
                <span style={{ fontWeight: 550, color: "var(--color-text)", fontSize: 13 }}>
                  {alertText}
                </span>
              }
              type={getAlertType(alertText)}
              showIcon
              icon={getAlertIcon(alertText)}
              style={{
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-xs)",
              }}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default OperationalInsights;
