import { Card, Empty, Skeleton, Tooltip as AntTooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, MOCK_MONTHLY_DATA } from "../constants";
import { formatVND } from "../utils";

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
              height: 10,
              background: p.fill,
              display: "inline-block",
              borderRadius: 3,
            }}
          />
          <span style={{ color: "var(--color-text-secondary)" }}>
            {p.name}:
          </span>
          <span style={{ fontWeight: 700 }}>{formatVND(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const RevenueExpenseBar = ({
  data = MOCK_MONTHLY_DATA,
  loading = false,
  onRefresh,
}) => {
  const hasData = data.some((d) => d.revenue > 0 || d.expense > 0);

  return (
    <Card
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AntTooltip title="RevenueExpenseBar">
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              📊 Doanh thu vs Chi phí theo tháng
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
        <Empty description="Chưa có dữ liệu tháng" style={{ padding: 40 }} />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            barCategoryGap="30%"
          >
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="revenue"
              name="Doanh thu"
              fill={CHART_COLORS.revenue}
              stackId="a"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="expense"
              name="Chi phí"
              fill={CHART_COLORS.expense}
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default RevenueExpenseBar;
