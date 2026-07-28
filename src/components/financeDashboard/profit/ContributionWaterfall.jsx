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
  Cell,
} from "recharts";
import { useMemo } from "react";
import { COLORS, MOCK_WATERFALL } from "../constants";
import { formatVND, formatVNDFull } from "../../dashboard/utils";

const TYPE_COLORS = {
  revenue: COLORS.revenue,
  cost: COLORS.expense,
  profit: COLORS.profit,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
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
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: TYPE_COLORS[d.type] || "var(--color-text)",
        }}
      >
        {d.type === "cost"
          ? `−${formatVNDFull(d.value)}`
          : formatVNDFull(d.displayValue ?? d.value)}
      </div>
      {d.type !== "revenue" && d.type !== "profit" && (
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-secondary)",
            marginTop: 2,
          }}
        >
          Còn lại: {formatVNDFull(d.runningTotal)}
        </div>
      )}
    </div>
  );
};

const ContributionWaterfall = ({ data = MOCK_WATERFALL, loading = false }) => {
  const hasData = data.some((d) => d.value > 0);

  // Calculate waterfall positions
  const chartData = useMemo(() => {
    let runningTotal = 0;
    const resultList = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item.type === "revenue") {
        runningTotal = item.value;
        resultList.push({
          ...item,
          base: 0,
          bar: item.value,
          runningTotal,
          displayValue: item.value,
        });
      } else if (item.type === "cost") {
        const base = runningTotal - item.value;
        resultList.push({
          ...item,
          base,
          bar: item.value,
          runningTotal: base,
          displayValue: item.value,
        });
        runningTotal = base;
      } else {
        // profit
        resultList.push({
          ...item,
          base: 0,
          bar: runningTotal,
          runningTotal,
          displayValue: runningTotal,
        });
      }
    }
    return resultList;
  }, [data]);

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>🌊 Phân tích đóng góp vào lợi nhuận</span>
          <Popover
            content={
              <div style={{ maxWidth: 320 }}>
                <p><strong>Ý nghĩa:</strong> Biểu thị dòng chảy tài chính từ doanh thu đi qua các khoản giảm trừ chi phí để ra lợi nhuận ròng cuối cùng.</p>
                <p><strong>Cách đọc:</strong> Đọc từ trái qua phải: Cột Doanh thu đi xuống qua các bậc Chi phí (Nguyên liệu, Lương, Khác) dưới dạng bậc thang màu đỏ, và điểm dừng chân cuối cùng là cột Lợi nhuận ròng (xanh lá).</p>
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
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              tickFormatter={(v) => formatVND(v)}
              tick={{ fontSize: 11 }}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Invisible base bar */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" />
            {/* Visible bar */}
            <Bar
              dataKey="bar"
              stackId="waterfall"
              radius={[4, 4, 0, 0]}
              barSize={48}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={TYPE_COLORS[entry.type] || COLORS.profit} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ContributionWaterfall;
