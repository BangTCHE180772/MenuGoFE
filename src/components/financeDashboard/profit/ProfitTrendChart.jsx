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
  ReferenceLine,
} from "recharts";
import { COLORS, MOCK_PROFIT_TREND } from "../constants";
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
          <span
            style={{
              fontWeight: 700,
              color: p.value >= 0 ? COLORS.profit : COLORS.profitNeg,
            }}
          >
            {formatVND(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const ProfitTrendChart = ({ data = MOCK_PROFIT_TREND, loading = false }) => {
  const hasData = data.length > 0;
  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>📈 Xu hướng Lợi nhuận</span>
          <Popover
            content={
              <div style={{ maxWidth: 300 }}>
                <p><strong>Ý nghĩa:</strong> Biểu thị xu hướng tăng/giảm của lợi nhuận ròng qua các mốc thời gian.</p>
                <p><strong>Cách đọc:</strong> Xem hướng dốc của đường biểu diễn màu xanh lá. Đường dốc lên biểu thị lợi nhuận tăng tốt. Điểm nào nằm dưới mức 0 (đường xám nằm ngang) nghĩa là quán đang chịu lỗ ở mốc thời gian đó.</p>
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
        <Empty description="Chưa có dữ liệu" style={{ padding: 40 }} />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
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
            <ReferenceLine
              y={0}
              stroke="var(--color-border)"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="Lợi nhuận"
              stroke={COLORS.profit}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ProfitTrendChart;
