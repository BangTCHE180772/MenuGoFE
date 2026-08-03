import React from "react";
import { Card, Typography, Tooltip as AntTooltip, Row, Col } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { MOCK_STATUS_SUMMARY } from "./InventoryReportData";

const { Title, Text } = Typography;

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = (data.normal || 0) + (data.lowStock || 0) + (data.outOfStock || 0) + (data.needCheck || 0) + (data.expiringSoon || 0);

    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.94)",
          backdropFilter: "blur(6px)",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: 10,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          fontSize: 12,
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#38bdf8" }}>
          📊 Tỷ lệ trạng thái nguyên liệu ({total} mặt hàng)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
            <span><span style={{ color: "#22c55e" }}>●</span> Bình thường:</span>
            <strong>{data.normal} mặt hàng ({Math.round((data.normal / total) * 100)}%)</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
            <span><span style={{ color: "#f59e0b" }}>●</span> Sắp hết:</span>
            <strong>{data.lowStock} mặt hàng</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
            <span><span style={{ color: "#ef4444" }}>●</span> Hết hàng:</span>
            <strong>{data.outOfStock} mặt hàng</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
            <span><span style={{ color: "#0ea5e9" }}>●</span> Cần kiểm tra:</span>
            <strong>{data.needCheck} mặt hàng</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
            <span><span style={{ color: "#f97316" }}>●</span> Sắp hết hạn:</span>
            <strong>{data.expiringSoon} mặt hàng</strong>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const InventoryStatusChart = ({ data }) => {
  const chartData = data && data.length > 0 ? data : [
    {
      category: "Kho tổng",
      normal: 126,
      lowStock: 5,
      outOfStock: 3,
      needCheck: 8,
      expiringSoon: 6,
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 16,
        marginBottom: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        border: "1px solid #e2e8f0",
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <Title level={5} style={{ margin: 0, color: "#0f172a" }}>
            📊 Phân bổ Trạng thái Nguyên liệu Kho (Inventory Status)
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tổng quan số lượng và tỷ lệ các nguyên liệu đang gặp vấn đề trong kho.
          </Text>
        </div>

        <AntTooltip title="Biểu đồ phản ánh số lượng nguyên liệu chia theo 5 trạng thái vận hành.">
          <InfoCircleOutlined style={{ fontSize: 16, color: "#94a3b8", cursor: "pointer" }} />
        </AntTooltip>
      </div>

      {/* Top Quick Status Summary Badges */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {MOCK_STATUS_SUMMARY.map((item) => (
          <Col xs={12} sm={8} md={4.8} key={item.key} style={{ flex: 1 }}>
            <div
              style={{
                background: item.bg,
                border: `1px solid ${item.border}`,
                borderRadius: 10,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.count}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Horizontal Stacked Bar Chart */}
      <div style={{ width: "100%", height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            barCategoryGap="10%"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} />
            <YAxis type="category" dataKey="category" stroke="#94a3b8" fontSize={12} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
              formatter={(value) => {
                const labels = {
                  normal: "Bình thường",
                  lowStock: "Sắp hết",
                  outOfStock: "Hết hàng",
                  needCheck: "Cần kiểm tra",
                  expiringSoon: "Sắp hết hạn",
                };
                return <span style={{ color: "#334155", fontWeight: 500 }}>{labels[value] || value}</span>;
              }}
            />
            <Bar dataKey="normal" name="normal" stackId="status" fill="#22c55e" radius={[4, 0, 0, 4]} barSize={28} />
            <Bar dataKey="lowStock" name="lowStock" stackId="status" fill="#f59e0b" barSize={28} />
            <Bar dataKey="outOfStock" name="outOfStock" stackId="status" fill="#ef4444" barSize={28} />
            <Bar dataKey="needCheck" name="needCheck" stackId="status" fill="#0ea5e9" barSize={28} />
            <Bar dataKey="expiringSoon" name="expiringSoon" stackId="status" fill="#f97316" radius={[0, 4, 4, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default InventoryStatusChart;
