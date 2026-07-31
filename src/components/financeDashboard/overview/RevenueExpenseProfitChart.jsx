import { Card, Empty, Skeleton, Tooltip as AntTooltip } from "antd";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { COLORS, MOCK_OVERVIEW_DATA } from "../constants";
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
        minWidth: 200,
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

const RevenueExpenseProfitChart = ({
  data = MOCK_OVERVIEW_DATA,
  loading = false,
}) => {
  const hasData =
    data.length > 0 && data.some((d) => d.revenue || d.expense || d.profit);

  return (
    <Card
      title={
        <AntTooltip
          title={
            <>
              Biểu đồ thể hiện xu hướng của
              <strong> Chi phí - Doanh thu - Lợi nhuận</strong>
            </>
          }
        >
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            📊 Tổng quan về Chi phí - Doanh thu - Lợi nhuận
          </span>
        </AntTooltip>
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
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.profit} stopOpacity={0.3} />
                <stop
                  offset="95%"
                  stopColor={COLORS.profit}
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient
                id="profitNegGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={COLORS.profitNeg}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={COLORS.profitNeg}
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="profit"
              name="Lợi nhuận"
              fill="url(#profitGradient)"
              stroke={COLORS.profit}
              strokeWidth={0}
              fillOpacity={1}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Doanh thu"
              stroke={COLORS.revenue}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Chi phí"
              stroke={COLORS.expense}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default RevenueExpenseProfitChart;
