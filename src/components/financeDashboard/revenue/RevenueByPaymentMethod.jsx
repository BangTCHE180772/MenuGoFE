import { Card, Empty, Skeleton, Tooltip as AntTooltip, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MOCK_PAYMENT_METHODS, PAYMENT_COLORS } from "../constants";
import { formatVNDFull } from "../../dashboard/utils";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        padding: "10px 16px",
        borderRadius: 10,
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
        {d.name}
      </div>
      <div style={{ fontSize: 12, color: d.payload.fill }}>
        {formatVNDFull(d.value)}
      </div>
    </div>
  );
};

const RevenueByPaymentMethod = ({
  data = MOCK_PAYMENT_METHODS,
  loading = false,
  title,
}) => {
  const hasData = data.some((d) => d.value > 0);

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title || "💳 Doanh thu theo PT Thanh toán"}</span>
          <Popover
            content={
              <div style={{ maxWidth: 300 }}>
                <p><strong>Ý nghĩa:</strong> Phân tích phần trăm doanh thu thu được từ từng hình thức thanh toán (Tiền mặt, QR / Chuyển khoản...).</p>
                <p><strong>Cách đọc:</strong> Xem cung tròn nào có tỷ lệ phần trăm hoặc diện tích lớn nhất, đó là hình thức khách hàng ưa chuộng nhất. Giúp tối ưu hóa vận hành quầy thu ngân.</p>
              </div>
            }
            title="💡 Hướng dẫn đọc biểu đồ"
            trigger="click"
          >
            <QuestionCircleOutlined style={{ color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 14 }} />
          </Popover>
        </div>
      }
      style={{
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        height: "100%",
      }}
      styles={{ body: { padding: "8px 16px 20px" } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !hasData ? (
        <Empty
          description="Chưa có dữ liệu thanh toán"
          style={{ padding: 40 }}
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default RevenueByPaymentMethod;
