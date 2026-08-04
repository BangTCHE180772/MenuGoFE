import React, { useState } from "react";
import {
  Modal,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Divider,
  Alert,
  Space,
} from "antd";
import {
  SwapOutlined,
  DollarOutlined,
  ShoppingOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const { Title, Text } = Typography;

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0,
  );

const PAYMENT_COLORS = ["#16a34a", "#2563eb", "#0284c7", "#8b5cf6"];

/**
 * Component: RevenueCompareModal
 * Modal So Sánh Hiệu Quả Vận Hành Doanh Thu giữa 2 kỳ cùng loại thời gian (Năm vs Năm, Tháng vs Tháng, Ngày vs Ngày bất kỳ).
 */
const RevenueCompareModal = ({ visible, onClose }) => {
  const [hoveredPieIndex, setHoveredPieIndex] = useState(-1);
  // Chế độ thời gian: "date" (Ngày), "month" (Tháng), "year" (Năm)
  const [pickerType, setPickerType] = useState("date");

  // Mốc A (Kỳ này) & Mốc B (Kỳ so sánh) - Mặc định theo ngày: Hôm nay vs Hôm qua
  const [dateA, setDateA] = useState(dayjs());
  const [dateB, setDateB] = useState(dayjs().subtract(1, "day"));

  const typeOptions = [
    { label: "So sánh theo ngày", value: "date" },
    { label: "So sánh theo tháng", value: "month" },
    { label: "So sánh theo năm", value: "year" },
  ];

  const handlePickerTypeChange = (val) => {
    setPickerType(val);
    const now = dayjs();
    if (val === "date") {
      // Mặc định: Hôm nay vs Hôm qua
      setDateA(now);
      setDateB(now.subtract(1, "day"));
    } else if (val === "month") {
      // Mặc định: Tháng này vs Tháng trước
      setDateA(now.startOf("month"));
      setDateB(now.subtract(1, "month").startOf("month"));
    } else if (val === "year") {
      // Mặc định: Năm này vs Năm trước
      setDateA(now.startOf("year"));
      setDateB(now.subtract(1, "year").startOf("year"));
    }
  };

  const formatTitle = (d, type) => {
    if (!d) return "";
    if (type === "date") return `Ngày ${d.format("DD/MM/YYYY")}`;
    if (type === "month") return `Tháng ${d.format("MM/YYYY")}`;
    return `Năm ${d.format("YYYY")}`;
  };

  // Combined Trends Data cho cả 2 kỳ so sánh
  const combinedTrends = [
    {
      date: "Mốc 1 (Tuần 1 / Giờ 1-6)",
      revenueA: 65000000,
      revenueB: 58000000,
    },
    {
      date: "Mốc 2 (Tuần 2 / Giờ 7-12)",
      revenueA: 78000000,
      revenueB: 62000000,
    },
    {
      date: "Mốc 3 (Tuần 3 / Giờ 13-18)",
      revenueA: 81000000,
      revenueB: 69000000,
    },
    {
      date: "Mốc 4 (Tuần 4 / Giờ 19-24)",
      revenueA: 60500000,
      revenueB: 58800000,
    },
  ];

  // Dynamic Data cho Kỳ A (Kỳ chọn)
  const dataA = {
    title: `Kỳ chọn: ${formatTitle(dateA, pickerType)}`,
    totalRevenue: 284500000,
    totalOrders: 1420,
    avgOrderValue: 200350,
    avgRevenuePerDay: 9483333,
    growthPct: 14.8,
    payments: [
      { name: "Tiền mặt", value: 105000000 },
      { name: "Chuyển khoản QR", value: 124000000 },
      { name: "Chuyển khoản NH", value: 35000000 },
      { name: "Thẻ Visa/Master", value: 20500000 },
    ],
  };

  // Dynamic Data cho Kỳ B (Kỳ so sánh)
  const dataB = {
    title: `Kỳ so sánh: ${formatTitle(dateB, pickerType)}`,
    totalRevenue: 247800000,
    totalOrders: 1290,
    avgOrderValue: 192093,
    avgRevenuePerDay: 7993548,
    growthPct: 8.2,
    payments: [
      { name: "Tiền mặt", value: 98000000 },
      { name: "Chuyển khoản QR", value: 102000000 },
      { name: "Chuyển khoản NH", value: 31000000 },
      { name: "Thẻ Visa/Master", value: 16800000 },
    ],
  };

  // Chênh lệch % giữa Kỳ A và Kỳ B
  const diffRevenuePct = Number(
    (
      ((dataA.totalRevenue - dataB.totalRevenue) / dataB.totalRevenue) *
      100
    ).toFixed(1),
  );
  const diffOrdersPct = Number(
    (
      ((dataA.totalOrders - dataB.totalOrders) / dataB.totalOrders) *
      100
    ).toFixed(1),
  );

  const renderPeriodBlock = (periodData, isCurrent = true) => (
    <Card
      bordered
      style={{
        borderRadius: 10,
        borderColor: "#e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        background: "#ffffff",
      }}
      bodyStyle={{ padding: 16 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <Title
          level={5}
          style={{ margin: 0, color: "#1e293b", fontWeight: 700 }}
        >
          {isCurrent ? "📌 " : "⏱️ "}
          {periodData.title}
        </Title>
      </div>

      {/* 5 KPIs Row - Harmonized Style */}
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={4.8} style={{ flex: "1 0 18%" }}>
          <div
            style={{
              background: "#f8fafc",
              padding: 10,
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              Doanh Thu
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#2563eb" }}>
              {formatVND(periodData.totalRevenue)}
            </div>
          </div>
        </Col>
        <Col span={4.8} style={{ flex: "1 0 18%" }}>
          <div
            style={{
              background: "#f8fafc",
              padding: 10,
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              Số Đơn Hàng
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#ea580c" }}>
              {periodData.totalOrders} đơn
            </div>
          </div>
        </Col>
        <Col span={4.8} style={{ flex: "1 0 18%" }}>
          <div
            style={{
              background: "#f8fafc",
              padding: 10,
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              Giá Trị Đơn (AOV)
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#10b981" }}>
              {formatVND(periodData.avgOrderValue)}
            </div>
          </div>
        </Col>
        <Col span={4.8} style={{ flex: "1 0 18%" }}>
          <div
            style={{
              background: "#f8fafc",
              padding: 10,
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              Doanh Thu / Ngày
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#8b5cf6" }}>
              {formatVND(periodData.avgRevenuePerDay)}
            </div>
          </div>
        </Col>
        <Col span={4.8} style={{ flex: "1 0 18%" }}>
          <div
            style={{
              background: "#f8fafc",
              padding: 10,
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              Growth %
            </Text>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: periodData.growthPct >= 0 ? "#16a34a" : "#dc2626",
              }}
            >
              +{periodData.growthPct}%
            </div>
          </div>
        </Col>
      </Row>

      {/* 2 Charts in Period */}
      <Row gutter={[12, 12]}>
        {/* Biểu đồ Xu hướng Doanh thu theo thời gian (2 Line) */}
        <Col span={14}>
          <div
            style={{
              background: "#fff",
              padding: 12,
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <Text
              strong
              style={{ fontSize: 12, display: "block", marginBottom: 8 }}
            >
              <LineChartOutlined style={{ color: "var(--color-primary)" }} /> Xu
              hướng Doanh thu theo thời gian
            </Text>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={combinedTrends}
                  margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
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
                    fontSize={9}
                  />
                  <YAxis
                    tickLine={false}
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(v) => `${v / 1000000}M`}
                  />
                  <Tooltip formatter={(v, name) => [formatVND(v), name]} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                  />

                  {/* Line Kỳ Chọn (Period A - Xanh Dương Đậm) */}
                  <Line
                    type="monotone"
                    dataKey="revenueA"
                    name={`Kỳ chọn (${formatTitle(dateA, pickerType)})`}
                    stroke="#2563eb"
                    strokeWidth={isCurrent ? 3 : 1.8}
                    strokeDasharray={isCurrent ? "" : "4 4"}
                    dot={{ r: isCurrent ? 5 : 3 }}
                  />

                  {/* Line Kỳ So Sánh (Period B - Xanh Dương Nhạt/Cyan) */}
                  <Line
                    type="monotone"
                    dataKey="revenueB"
                    name={`Kỳ so sánh (${formatTitle(dateB, pickerType)})`}
                    stroke="#0ea5e9"
                    strokeWidth={!isCurrent ? 3 : 1.8}
                    strokeDasharray={!isCurrent ? "" : "4 4"}
                    dot={{ r: !isCurrent ? 5 : 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>

        {/* Biểu đồ Tỷ trọng Phương thức Thanh toán có chú giải Legend */}
        <Col span={10}>
          <div
            style={{
              background: "#fff",
              padding: 12,
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <Text
              strong
              style={{ fontSize: 12, display: "block", marginBottom: 8 }}
            >
              <PieChartOutlined style={{ color: "#16a34a" }} /> Tỷ trọng PTTT
            </Text>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={periodData.payments}
                    cx="50%"
                    cy="40%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                    onMouseEnter={(_, index) => setHoveredPieIndex(index)}
                    onMouseLeave={() => setHoveredPieIndex(-1)}
                  >
                    {periodData.payments.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]}
                        opacity={
                          hoveredPieIndex === -1 || hoveredPieIndex === i
                            ? 1
                            : 0.35
                        }
                        stroke={hoveredPieIndex === i ? "#000" : "none"}
                        strokeWidth={2}
                        style={{ cursor: "pointer", transition: "all 0.2s" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [formatVND(v), "Số tiền"]} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                    formatter={(value, entry, index) => (
                      <span
                        style={{
                          fontWeight: hoveredPieIndex === index ? 700 : 500,
                          color:
                            hoveredPieIndex === index ? "#0f172a" : "#64748b",
                          fontSize: hoveredPieIndex === index ? 11 : 10,
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
          </div>
        </Col>
      </Row>
    </Card>
  );

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined
            style={{ color: "var(--color-primary)", fontSize: 20 }}
          />
          <span style={{ fontWeight: 800, fontSize: 18 }}>
            So Sánh Hiệu Quả Vận Hành Doanh Thu
          </span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1100}
      style={{ top: 20 }}
    >
      {/* Header Bar: Chọn Chế độ so sánh Ngày/Tháng/Năm & 2 DatePickers bất kỳ */}
      <div
        style={{
          background: "#f1f5f9",
          padding: "14px 18px",
          borderRadius: 8,
          marginBottom: 18,
        }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={8}>
            <Text
              strong
              style={{ display: "block", fontSize: 12, marginBottom: 4 }}
            >
              1. Loại mốc thời gian so sánh:
            </Text>
            <Select
              value={pickerType}
              onChange={handlePickerTypeChange}
              options={typeOptions}
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={12} md={8}>
            <Text
              strong
              style={{ display: "block", fontSize: 12, marginBottom: 4 }}
            >
              2. Kỳ chọn:
            </Text>
            <DatePicker
              picker={pickerType}
              value={dateA}
              onChange={(val) => val && setDateA(val)}
              format={
                pickerType === "date"
                  ? "DD/MM/YYYY"
                  : pickerType === "month"
                    ? "MM/YYYY"
                    : "YYYY"
              }
              style={{ width: "100%", borderRadius: 6 }}
            />
          </Col>

          <Col xs={12} md={8}>
            <Text
              strong
              style={{ display: "block", fontSize: 12, marginBottom: 4 }}
            >
              3. Kỳ so sánh:
            </Text>
            <DatePicker
              picker={pickerType}
              value={dateB}
              onChange={(val) => val && setDateB(val)}
              format={
                pickerType === "date"
                  ? "DD/MM/YYYY"
                  : pickerType === "month"
                    ? "MM/YYYY"
                    : "YYYY"
              }
              style={{ width: "100%", borderRadius: 6 }}
            />
          </Col>
        </Row>
      </div>

      {/* Chênh lệch hiệu quả tổng kết Badge */}
      <div
        style={{
          background: "#fff7ed",
          padding: "10px 16px",
          borderRadius: 8,
          border: "1px solid #ffedd5",
          marginBottom: 18,
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <Text strong>
          Tăng trưởng chênh lệch giữa {formatTitle(dateA, pickerType)} vs{" "}
          {formatTitle(dateB, pickerType)}:
        </Text>
        <Tag
          color={diffRevenuePct >= 0 ? "success" : "error"}
          style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px" }}
        >
          Doanh thu: {diffRevenuePct >= 0 ? "+" : ""}
          {diffRevenuePct}% (
          {formatVND(dataA.totalRevenue - dataB.totalRevenue)})
        </Tag>
        <Tag
          color={diffOrdersPct >= 0 ? "success" : "error"}
          style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px" }}
        >
          Đơn hàng: {diffOrdersPct >= 0 ? "+" : ""}
          {diffOrdersPct}% (+{dataA.totalOrders - dataB.totalOrders} đơn)
        </Tag>
      </div>

      {/* 2 Khối kỳ A và B */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {renderPeriodBlock(dataA, true)}
        <Divider style={{ margin: "4px 0" }}>
          ⚡ So sánh đối chiếu trực tiếp với ⚡
        </Divider>
        {renderPeriodBlock(dataB, false)}
      </div>
    </Modal>
  );
};

export default RevenueCompareModal;
