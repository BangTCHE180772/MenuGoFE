import { Card, Empty, Skeleton, Tooltip as AntTooltip, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COLORS, MOCK_REVENUE_DISTRIBUTION } from "../constants";
import { formatVND } from "../../dashboard/utils";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
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
        {label}
      </div>
      <div style={{ fontSize: 12, color: COLORS.revenue, fontWeight: 700 }}>
        {formatVND(payload[0].value)}
      </div>
    </div>
  );
};

const RevenueDistribution = ({
  data = MOCK_REVENUE_DISTRIBUTION,
  loading = false,
  title,
}) => {
  const hasData = data.some((d) => d.value > 0);

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title || "🕐 Phân bổ Doanh thu theo khung giờ"}</span>
          <Popover
            content={
              <div style={{ maxWidth: 300 }}>
                <p><strong>Ý nghĩa:</strong> Biểu thị doanh số bán hàng trong các khung giờ chính (Sáng, Trưa, Chiều, Tối).</p>
                <p><strong>Cách đọc:</strong> Khung giờ có cột cao nhất đại diện cho khoảng thời gian thu hút nhiều doanh thu nhất của chi nhánh. Giúp quản lý lập kế hoạch chuẩn bị nguyên liệu và bố trí nhân viên ca trực phù hợp.</p>
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
        <Empty description="Chưa có dữ liệu phân bổ" style={{ padding: 40 }} />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
            <YAxis
              tickFormatter={(v) => formatVND(v)}
              tick={{ fontSize: 11 }}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill={COLORS.revenue}
              radius={[6, 6, 0, 0]}
              barSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default RevenueDistribution;
