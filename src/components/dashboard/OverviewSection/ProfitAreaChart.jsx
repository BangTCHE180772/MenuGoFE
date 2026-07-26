import { Card, Empty, Skeleton, Tooltip as AntTooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CHART_COLORS, MOCK_MONTHLY_DATA } from "../constants";
import { formatVND } from "../utils";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
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
      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: val >= 0 ? "#16a34a" : "#dc2626",
          fontWeight: 700,
        }}
      >
        Lợi nhuận: {formatVND(val)}
      </div>
    </div>
  );
};

const ProfitAreaChart = ({
  data = MOCK_MONTHLY_DATA,
  loading = false,
  onRefresh,
}) => {
  const hasData = data.some((d) => d.profit !== 0);

  return (
    <Card
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AntTooltip title="ProfitAreaChart">
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              💹 Xu hướng Lợi nhuận
            </span>
          </AntTooltip>
        </span>
      }
      extra={
        onRefresh && (
          <AntTooltip title="Làm mới">
            <ReloadOutlined
              style={{
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
              onClick={onRefresh}
            />
          </AntTooltip>
        )
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
        <Empty
          description="Chưa có dữ liệu lợi nhuận"
          style={{ padding: 40 }}
        />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="profitGradientPos"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.profit}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.profit}
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient
                id="profitGradientNeg"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.expense}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.expense}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis
              tickFormatter={(v) => formatVND(v)}
              tick={{ fontSize: 11 }}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="profit"
              name="Lợi nhuận"
              stroke={CHART_COLORS.profit}
              fill="url(#profitGradientPos)"
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.profit, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ProfitAreaChart;
