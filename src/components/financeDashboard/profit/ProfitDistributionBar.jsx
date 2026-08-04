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
  ReferenceLine,
  Cell,
} from "recharts";
import { COLORS, MOCK_PROFIT_DISTRIBUTION } from "../constants";
import { formatVND } from "../../dashboard/utils";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
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
          color: v >= 0 ? COLORS.profit : COLORS.profitNeg,
        }}
      >
        {formatVND(v)}
      </div>
    </div>
  );
};

const ProfitDistributionBar = ({
  data = MOCK_PROFIT_DISTRIBUTION,
  loading = false,
}) => {
  const hasData = data.some((d) => d.profit !== 0);
  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>📊 Phân bổ Lợi nhuận</span>
          <Popover
            content={
              <div style={{ maxWidth: 300 }}>
                <p><strong>Ý nghĩa:</strong> So sánh định lượng tuyệt đối mức độ Lời - Lỗ của các ngày cụ thể trong kỳ.</p>
                <p><strong>Cách đọc:</strong> Các cột hướng lên trên biểu thị ngày có lãi (màu xanh lá). Các cột đâm xuống phía dưới biểu thị ngày cửa hàng bị lỗ (màu đỏ). Giúp kiểm tra nhanh ngày nào bị sụt giảm lợi nhuận nghiêm trọng nhất.</p>
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
          <BarChart
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
            <ReferenceLine y={0} stroke="var(--color-border)" />
            <Bar dataKey="profit" radius={[4, 4, 0, 0]} barSize={36}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.profit >= 0 ? COLORS.profit : COLORS.profitNeg}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ProfitDistributionBar;
