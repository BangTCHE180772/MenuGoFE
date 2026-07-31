import React from "react";
import { Card, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const OrderSizeDistribution = ({
  data = [],
  loading = false,
  compare = false,
  currentLabel = "Kỳ hiện tại",
  prevLabel = "Kỳ trước",
}) => {
  return (
    <Card
      bordered={false}
      loading={loading}
      title={
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>🛒 Phân bổ Số lượng Món ăn / Đơn (Order Size)</span>
            <Popover
              content={
                <div style={{ maxWidth: 300 }}>
                  <p><strong>Ý nghĩa:</strong> Phân tích hành vi gọi món bằng cách đếm số món ăn có mặt trong mỗi đơn hàng.</p>
                  <p><strong>Cách đọc:</strong> Cột cao nhất thể hiện nhóm lượng món phổ biến nhất khách thường gọi (ví dụ: Khách đi một mình/đôi thường gọi 1-2 món, khách đi nhóm gia đình thường gọi 5+ món).</p>
                </div>
              }
              title="💡 Hướng dẫn quy mô đơn hàng"
              trigger="click"
            >
              <QuestionCircleOutlined style={{ color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 14 }} />
            </Popover>
          </div>
          <div style={{ fontSize: 11, fontWeight: 550, color: "var(--color-text-secondary)" }}>
            Kỳ báo cáo: <strong>{currentLabel}</strong>
          </div>
        </div>
      }
      style={{
        borderRadius: 12,
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--color-border)",
        height: "100%",
      }}
      styles={{ body: { padding: "16px 20px 24px" } }}
    >
      {data.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
          Chưa có dữ liệu phân bổ
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <ChartTooltip
              formatter={(v) => [`${v} đơn`, "Số lượng đơn"]}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                boxShadow: "var(--shadow-md)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="current" name={currentLabel} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
            {compare && (
              <Bar dataKey="previous" name={prevLabel} fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default OrderSizeDistribution;
