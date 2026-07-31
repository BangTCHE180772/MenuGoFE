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
import { MOCK_EXPENSE_BREAKDOWN, EXPENSE_COLORS } from "../constants";
import { formatVNDFull } from "../../dashboard/utils";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = d.payload?.total || 1;
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
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
        {((d.value / total) * 100).toFixed(1)}%
      </div>
    </div>
  );
};

const ExpenseBreakdownPie = ({
  data = MOCK_EXPENSE_BREAKDOWN,
  loading = false,
  title,
}) => {
  const hasData = data.some((d) => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);
  const enriched = data.map((d) => ({ ...d, total }));

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title || "🥧 Cơ cấu Chi phí"}</span>
          <Popover
            content={
              <div style={{ maxWidth: 300 }}>
                <p><strong>Ý nghĩa:</strong> Phân tích phần trăm đóng góp của từng danh mục chi phí (Nguyên liệu, Lương, Mặt bằng, Điện nước...).</p>
                <p><strong>Cách đọc:</strong> Khoản chi nào chiếm diện tích lớn nhất trên biểu đồ tròn là khoản chi tiêu ngốn nhiều ngân sách nhất của chi nhánh. Giúp quản lý lập kế hoạch cắt giảm hoặc tối ưu nhóm chi phí đó.</p>
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
        <Empty description="Chưa có dữ liệu chi phí" style={{ padding: 40 }} />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={enriched}
              cx="50%"
              cy="50%"
              outerRadius={110}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={{ strokeWidth: 1 }}
            >
              {enriched.map((_, i) => (
                <Cell
                  key={i}
                  fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]}
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

export default ExpenseBreakdownPie;
