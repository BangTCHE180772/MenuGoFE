import { useState } from "react";
import { Row, Col, Card } from "antd";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0,
  );

const EXPENSE_COLORS = [
  "#ef4444",
  "#ea580c",
  "#2563eb",
  "#8b5cf6",
  "#10b981",
  "#64748b",
];

const ExpenseCharts = ({
  trendData = [],
  breakdownData = [],
  multiLineData = [],
  topExpenseData = [],
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const trendList = trendData.length
    ? trendData
    : [
        { date: "01/08", expense: 3500000 },
        { date: "02/08", expense: 4200000 },
        { date: "03/08", expense: 2800000 },
        { date: "04/08", expense: 18500000 },
        { date: "05/08", expense: 3900000 },
        { date: "06/08", expense: 4100000 },
        { date: "07/08", expense: 6200000 },
      ];

  const breakdownList = breakdownData.length
    ? breakdownData
    : [
        { name: "Nguyên liệu & Thực phẩm", value: 48000000 },
        { name: "Lương nhân viên", value: 32000000 },
        { name: "Thuê mặt bằng", value: 18000000 },
        { name: "Điện, Nước & Gas", value: 8500000 },
        { name: "Tiếp thị & Quảng cáo", value: 3500000 },
        { name: "Chi phí khác", value: 2000000 },
      ];

  const topExpenseList = topExpenseData.length
    ? topExpenseData
    : [
        { name: "Nhập thịt bò Mỹ & Hải sản", amount: 28000000 },
        { name: "Trả lương nhân viên tháng 7", value: 16000000 },
        { name: "Tiền thuê mặt bằng tháng 8", amount: 18000000 },
        { name: "Tiền điện sản xuất", amount: 6200000 },
        { name: "Nhập bia & đồ uống", amount: 5500000 },
      ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} lg={12}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LineChartOutlined style={{ color: "#ef4444" }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                Xu hướng Tổng Chi phí theo thời gian
              </span>
            </div>
          }
          bordered={false}
          style={{
            borderRadius: "var(--border-radius)",
            boxShadow: "var(--shadow-sm)",
            background: "var(--color-surface)",
            height: "100%",
          }}
          bodyStyle={{ padding: "16px 20px" }}
        >
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendList}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(v) => `${v / 1000000}M`}
                />
                <Tooltip formatter={(v) => [formatVND(v), "Chi phí"]} />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Chi phí"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PieChartOutlined style={{ color: "#8b5cf6" }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                Cơ cấu Chi phí theo Loại
              </span>
            </div>
          }
          bordered={false}
          style={{
            borderRadius: "var(--border-radius)",
            boxShadow: "var(--shadow-sm)",
            background: "var(--color-surface)",
            height: "100%",
          }}
          bodyStyle={{ padding: "16px 20px" }}
        >
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownList}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  {breakdownList.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                      opacity={
                        activeIndex === -1 || activeIndex === index ? 1 : 0.35
                      }
                      stroke={activeIndex === index ? "#000" : "none"}
                      strokeWidth={2}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [formatVND(v), "Chi phí"]} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value, entry, index) => (
                    <span
                      style={{
                        fontWeight: activeIndex === index ? 700 : 500,
                        color: activeIndex === index ? "#0f172a" : "#64748b",
                        fontSize: activeIndex === index ? 12 : 11,
                        transition: "all 0.2s",
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={24}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BarChartOutlined style={{ color: "#ef4444" }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                Top Khoản Chi Lớn Nhất
              </span>
            </div>
          }
          bordered={false}
          style={{
            borderRadius: "var(--border-radius)",
            boxShadow: "var(--shadow-sm)",
            background: "var(--color-surface)",
            height: "100%",
          }}
          bodyStyle={{ padding: "16px 20px" }}
        >
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topExpenseList}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${v / 1000000}M`}
                  fontSize={11}
                  stroke="#94a3b8"
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={220}
                  fontSize={11}
                  stroke="#64748b"
                />
                <Tooltip formatter={(v) => [formatVND(v), "Giá trị chi"]} />
                <Bar
                  dataKey="amount"
                  name="Giá trị chi"
                  fill="#ef4444"
                  radius={[0, 6, 6, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default ExpenseCharts;
