import React, { useState } from "react";
import { Row, Col, Card, Typography, Empty } from "antd";
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

const { Text } = Typography;

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0,
  );

const PAYMENT_COLORS = ["#16a34a", "#2563eb", "#0284c7", "#8b5cf6"];

/**
 * Revenue Report Component: RevenueCharts
 * 3 Charts: Revenue Trend Line Chart, Payment Method Pie Chart, Revenue Distribution Histogram
 */
const RevenueCharts = ({ trendData, paymentMethodData }) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  // trendData === undefined: chưa connect, vẽ mock. trendData.length === 0: đã connect và rỗng -> render <Empty />.
  const hasTrendData = trendData && trendData.length > 0;
  const trendList = trendData === undefined
    ? [
        { date: "01/08", revenue: 8500000 },
        { date: "02/08", revenue: 9200000 },
        { date: "03/08", revenue: 7800000 },
        { date: "04/08", revenue: 11500000 },
        { date: "05/08", revenue: 10900000 },
        { date: "06/08", revenue: 12100000 },
        { date: "07/08", revenue: 14200000 },
      ]
    : trendData;

  const hasPaymentData = paymentMethodData && paymentMethodData.length > 0;
  const paymentList = paymentMethodData === undefined
    ? [
        { name: "Chuyển khoản / QR", value: 145000000 },
        { name: "Tiền mặt", value: 89500000 },
        { name: "Thẻ Visa/Master", value: 50000000 },
      ]
    : paymentMethodData;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      {/* Chart 1: Revenue Trend Line Chart */}
      <Col xs={24} lg={14}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LineChartOutlined style={{ color: "var(--color-primary)" }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                Xu hướng Doanh thu theo thời gian
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
          <div style={{ width: "100%", height: 270, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {trendData !== undefined && !hasTrendData ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu xu hướng doanh thu" />
            ) : (
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
                  <Tooltip formatter={(v) => [formatVND(v), "Doanh thu"]} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </Col>

      {/* Chart 2: Revenue by Payment Method Pie Chart */}
      <Col xs={24} lg={10}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PieChartOutlined style={{ color: "#16a34a" }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                Tỷ trọng Phương thức Thanh toán
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
          <div style={{ width: "100%", height: 270, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {paymentMethodData !== undefined && !hasPaymentData ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu phương thức thanh toán" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentList}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(-1)}
                  >
                    {paymentList.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                        opacity={
                          activeIndex === -1 || activeIndex === index ? 1 : 0.35
                        }
                        stroke={activeIndex === index ? "#000" : "none"}
                        strokeWidth={2}
                        style={{ cursor: "pointer", transition: "all 0.2s" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [formatVND(v), "Số tiền"]} />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value, entry, index) => (
                      <span
                        style={{
                          fontWeight: activeIndex === index ? 700 : 500,
                          color: activeIndex === index ? "#0f172a" : "#64748b",
                          fontSize: activeIndex === index ? 13 : 12,
                          transition: "all 0.2s",
                        }}
                      >
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default RevenueCharts;
