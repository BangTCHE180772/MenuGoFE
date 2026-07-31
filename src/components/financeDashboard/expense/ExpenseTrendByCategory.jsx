import { Card, Empty, Skeleton, Tooltip as AntTooltip, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MOCK_EXPENSE_TREND, EXPENSE_CATEGORY_COLORS } from "../constants";
import { formatVND } from "../../dashboard/utils";

const CATEGORY_NAMES = {
  ingredients: "Nguyên liệu",
  salary: "Lương",
  electricity: "Điện",
  water: "Nước",
  rent: "Thuê mặt bằng",
  others: "Khác",
};

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
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
        {label}
      </div>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              width: 10,
              height: 3,
              background: p.color,
              display: "inline-block",
              borderRadius: 2,
            }}
          />
          <span style={{ color: "var(--color-text-secondary)" }}>
            {p.name}:
          </span>
          <span style={{ fontWeight: 700, color: p.color }}>
            {formatVND(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const ExpenseTrendByCategory = ({
  data = MOCK_EXPENSE_TREND,
  loading = false,
  title,
}) => {
  const hasData = data.length > 0;
  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title || "📊 Xu hướng Chi phí theo loại"}</span>
          <Popover
            content={
              <div style={{ maxWidth: 300 }}>
                <p><strong>Ý nghĩa:</strong> Phân tích xu hướng biến động của từng loại chi phí qua các mốc thời gian.</p>
                <p><strong>Cách đọc:</strong> Mỗi đường màu đại diện cho một danh mục chi phí. Nếu có một đường dốc thẳng đứng lên trên, đó là danh mục chi phí đang tăng đột biến cần lưu ý kiểm tra ngay.</p>
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
      }}
      styles={{ body: { padding: "8px 16px 20px" } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !hasData ? (
        <Empty description="Chưa có dữ liệu xu hướng" style={{ padding: 40 }} />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis
              tickFormatter={(v) => formatVND(v)}
              tick={{ fontSize: 11 }}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {Object.entries(EXPENSE_CATEGORY_COLORS).map(([key, color]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={CATEGORY_NAMES[key]}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ExpenseTrendByCategory;
