import { Card, Empty, Skeleton, Tooltip as AntTooltip } from "antd";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { COLORS, MOCK_OVERVIEW_DATA } from "../constants";
import { formatVND, formatPercent } from "../../dashboard/utils";

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
            {p.dataKey === "profitMargin"
              ? formatPercent(p.value / 100)
              : formatVND(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const ProfitMarginChart = ({ data = MOCK_OVERVIEW_DATA, loading = false }) => {
  const hasData = data.length > 0 && data.some((d) => d.revenue || d.profit);

  return (
    <Card
      title={
        <AntTooltip
          title={
            <>
              <div>ProfitMarginChart</div>
              <div>
                Cho bạn biết có thể thu về bao nhiêu %
                <strong> Lợi nhuận </strong>
                từ <strong>Doanh thu</strong>
              </div>
              <div>Profit Margin = (Lợi nhuận / Doanh thu) x 100%</div>
            </>
          }
        >
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            💹 Tỷ suất lợi nhuận
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => formatVND(v)}
              tick={{ fontSize: 11 }}
              width={72}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              name="Doanh thu"
              fill={COLORS.revenue}
              radius={[4, 4, 0, 0]}
              barSize={28}
              opacity={0.85}
            />
            <Bar
              yAxisId="left"
              dataKey="profit"
              name="Lợi nhuận"
              fill={COLORS.profit}
              radius={[4, 4, 0, 0]}
              barSize={28}
              opacity={0.85}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="profitMargin"
              name="Profit Margin (%)"
              stroke={COLORS.profitMargin}
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ProfitMarginChart;
