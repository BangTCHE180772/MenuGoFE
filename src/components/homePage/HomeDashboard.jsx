import React from "react";
import { Card, Row, Col, Typography, Tag, Tooltip as AntTooltip } from "antd";
import {
  DollarOutlined,
  ShoppingOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";

const { Text } = Typography;

// Helper format tiền VNĐ
const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

/**
 * Component HomeDashboard - Dashboard tổng quan trong ngày
 * Gồm: 4 KPI Cards + Chart Doanh Thu/Chi Phí/Lợi Nhuận + Chart Đơn Hàng + Top 5 Món bán chạy
 */
const HomeDashboard = ({ data }) => {
  const { kpis, hourlyTrends, topDishes } = data;

  const kpiItems = [
    {
      title: "Doanh thu trong ngày",
      value: kpis.revenue.formatted,
      changePct: kpis.revenue.changePct,
      icon: <DollarOutlined style={{ fontSize: 22, color: "#e8442a" }} />,
      bgIcon: "#fff2f0",
      borderColor: "#e8442a",
    },
    {
      title: "Chi phí phát sinh",
      value: kpis.expense.formatted,
      changePct: kpis.expense.changePct,
      icon: <FallOutlined style={{ fontSize: 22, color: "#ef4444" }} />,
      bgIcon: "#fef2f2",
      borderColor: "#ef4444",
    },
    {
      title: "Lợi nhuận ròng",
      value: kpis.profit.formatted,
      changePct: kpis.profit.changePct,
      icon: <RiseOutlined style={{ fontSize: 22, color: "#10b981" }} />,
      bgIcon: "#ecfdf5",
      borderColor: "#10b981",
    },
    {
      title: "Tổng số đơn hàng",
      value: kpis.orders.formatted,
      changePct: kpis.orders.changePct,
      icon: <ShoppingOutlined style={{ fontSize: 22, color: "#3b82f6" }} />,
      bgIcon: "#eff6ff",
      borderColor: "#3b82f6",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── 1. 4 KPI Cards ─────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        {kpiItems.map((kpi, idx) => {
          const isUp = kpi.changePct >= 0;
          return (
            <Col xs={24} sm={12} lg={6} key={idx}>
              <Card
                bordered={false}
                style={{
                  borderRadius: "var(--border-radius)",
                  boxShadow: "var(--shadow-sm)",
                  background: "var(--color-surface)",
                  borderTop: `3px solid ${kpi.borderColor}`,
                }}
                bodyStyle={{ padding: 18 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                      {kpi.title}
                    </Text>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", marginTop: 4 }}>
                      {kpi.value}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: kpi.bgIcon,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {kpi.icon}
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <Tag
                    color={isUp ? "success" : "error"}
                    style={{ borderRadius: 6, fontWeight: 600, margin: 0, padding: "1px 6px" }}
                  >
                    {isUp ? <RiseOutlined /> : <FallOutlined />}{" "}
                    {Math.abs(kpi.changePct)}%
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    so với hôm trước
                  </Text>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* ── 2. Biểu đồ 3 Đường: Revenue, Expense, Profit Trend ─────────────── */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ThunderboltOutlined style={{ color: "var(--color-primary)" }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Xu hướng Doanh thu, Chi phí & Lợi nhuận theo giờ
            </span>
          </div>
        }
        bordered={false}
        style={{
          borderRadius: "var(--border-radius)",
          boxShadow: "var(--shadow-sm)",
          background: "var(--color-surface)",
        }}
        bodyStyle={{ padding: "16px 20px 24px 20px" }}
      >
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyTrends} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8442a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e8442a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hour" tickLine={false} stroke="#94a3b8" fontSize={12} />
              <YAxis
                tickLine={false}
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(val) => `${val / 1000000}M`}
              />
              <Tooltip
                formatter={(value, name) => [formatVND(value), name]}
                labelStyle={{ fontWeight: 700, color: "#1e293b" }}
                contentStyle={{ borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "none" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#e8442a"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradRev)"
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Chi phí"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Lợi nhuận"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradProf)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── 3 & 4. Order Trend + Top 5 Best Selling Dishes ────────────────── */}
      <Row gutter={[16, 16]}>
        {/* Order Trend Column Chart */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingOutlined style={{ color: "#3b82f6" }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  Số lượng Đơn hàng theo giờ
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
            bodyStyle={{ padding: "16px 20px 24px 20px" }}
          >
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis tickLine={false} stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    formatter={(val) => [`${val} đơn`, "Số lượng đơn"]}
                    contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="orders" name="Số đơn" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Top 5 Món Bán Chạy Horizontal Bar Chart */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrophyOutlined style={{ color: "#f59e0b" }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  Top 5 Món ăn bán chạy nhất
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
            bodyStyle={{ padding: "16px 20px 24px 20px" }}
          >
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topDishes}
                  margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="name" type="category" tickLine={false} stroke="#475569" fontSize={12} width={130} />
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val} phần (${formatVND(item.payload.revenue)})`,
                      "Số lượng bán",
                    ]}
                    contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="quantity" radius={[0, 6, 6, 0]}>
                    {topDishes.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? "#e8442a"
                            : index === 1
                            ? "#ff8c42"
                            : index === 2
                            ? "#f59e0b"
                            : "#3b82f6"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeDashboard;
