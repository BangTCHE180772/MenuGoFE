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

const OrderValueDistribution = ({
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
            <span style={{ fontSize: 15, fontWeight: 700 }}>📊 Phân bổ Giá trị Hóa đơn (Order Value Histogram)</span>
            <Popover
              content={
                <div style={{ maxWidth: 300 }}>
                  <p><strong>Ý nghĩa:</strong> Phân loại các đơn hàng theo từng khoảng giá trị thanh toán.</p>
                  <p><strong>Cách đọc:</strong> Biết được đa số hóa đơn tập trung ở phân khúc giá nào. Khi chạy chiến dịch marketing/khuyến mãi nâng giá trị giỏ hàng, các cột phía bên phải (phân khúc giá cao) sẽ có xu hướng tăng cao lên.</p>
                </div>
              }
              title="💡 Hướng dẫn phân bổ giá trị"
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
            <XAxis dataKey="range" tick={{ fontSize: 11 }} />
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
            <Bar dataKey="current" name={currentLabel} fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
            {compare && (
              <Bar dataKey="previous" name={prevLabel} fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default OrderValueDistribution;
