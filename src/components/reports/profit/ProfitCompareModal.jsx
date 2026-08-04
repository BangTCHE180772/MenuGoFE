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
  Space,
} from "antd";
import {
  SwapOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  LineChart,
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

const { Title, Text } = Typography;

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0,
  );

/**
 * Component: ProfitCompareModal
 * Modal So Sánh Hiệu Quả Lợi Nhuận & Kinh Doanh giữa 2 kỳ cùng loại thời gian (Ngày vs Ngày, Tháng vs Tháng, Năm vs Năm).
 */
const ProfitCompareModal = ({ visible, onClose }) => {
  // Chế độ thời gian: "date" (Ngày), "month" (Tháng), "year" (Năm)
  const [pickerType, setPickerType] = useState("date");

  // Mốc A (Kỳ chọn) & Mốc B (Kỳ so sánh) - Mặc định theo ngày: Hôm nay vs Hôm qua
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
      setDateA(now);
      setDateB(now.subtract(1, "day"));
    } else if (val === "month") {
      setDateA(now.startOf("month"));
      setDateB(now.subtract(1, "month").startOf("month"));
    } else if (val === "year") {
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

  // Combined Profit Trends Data cho cả 2 kỳ
  const combinedTrends = [
    { date: "Mốc 1 (Tuần 1 / Giờ 1-6)", profitA: 28500000, profitB: 21200000 },
    { date: "Mốc 2 (Tuần 2 / Giờ 7-12)", profitA: 45000000, profitB: 38800000 },
    {
      date: "Mốc 3 (Tuần 3 / Giờ 13-18)",
      profitA: 39500000,
      profitB: 35100000,
    },
    {
      date: "Mốc 4 (Tuần 4 / Giờ 19-24)",
      profitA: 59500000,
      profitB: 47400000,
    },
  ];

  // Dynamic Data cho Kỳ A (Kỳ chọn)
  const dataA = {
    title: `Kỳ chọn: ${formatTitle(dateA, pickerType)}`,
    netProfit: 172500000,
    profitMargin: 60.6,
    costRatio: 39.4,
    breakEvenPct: 129.3,
    growthPct: 24.8,
    financialStructure: [
      { name: "Doanh Thu", amount: 284500000, fill: "#2563eb" },
      { name: "Chi Phí", amount: 112000000, fill: "#ef4444" },
      { name: "Lợi Nhuận Ròng", amount: 172500000, fill: "#10b981" },
    ],
  };

  // Dynamic Data cho Kỳ B (Kỳ so sánh)
  const dataB = {
    title: `Kỳ so sánh: ${formatTitle(dateB, pickerType)}`,
    netProfit: 142500000,
    profitMargin: 58.2,
    costRatio: 41.8,
    breakEvenPct: 112.5,
    growthPct: 18.2,
    financialStructure: [
      { name: "Doanh Thu", amount: 244600000, fill: "#2563eb" },
      { name: "Chi Phí", amount: 102100000, fill: "#ef4444" },
      { name: "Lợi Nhuận Ròng", amount: 142500000, fill: "#10b981" },
    ],
  };

  // Chênh lệch % Lợi nhuận Ròng giữa Kỳ A và Kỳ B
  const diffProfitPct = Number(
    (((dataA.netProfit - dataB.netProfit) / dataB.netProfit) * 100).toFixed(1),
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
              Lợi Nhuận Ròng (Net)
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#10b981" }}>
              {formatVND(periodData.netProfit)}
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
              Tỷ Suất Lợi Nhuận (Margin)
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#2563eb" }}>
              {periodData.profitMargin}%
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
              Tỷ Lệ Chi Phí / Doanh Thu
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444" }}>
              {periodData.costRatio}%
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
              Tiến Độ Hòa Vốn
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#8b5cf6" }}>
              {periodData.breakEvenPct}%
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
              Tăng Trưởng Lợi Nhuận
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
        {/* Biểu đồ Xu hướng Lợi nhuận Ròng theo thời gian */}
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
              <LineChartOutlined style={{ color: "#10b981" }} /> Xu hướng Lợi
              nhuận Ròng theo thời gian
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

                  {/* Line Kỳ Chọn (Period A - Xanh Lá Đậm) */}
                  <Line
                    type="monotone"
                    dataKey="profitA"
                    name={`Kỳ chọn (${formatTitle(dateA, pickerType)})`}
                    stroke="#15803d"
                    strokeWidth={isCurrent ? 3 : 1.8}
                    strokeDasharray={isCurrent ? "" : "4 4"}
                    dot={{ r: isCurrent ? 5 : 3 }}
                  />

                  {/* Line Kỳ So Sánh (Period B - Xanh Lá Nhạt) */}
                  <Line
                    type="monotone"
                    dataKey="profitB"
                    name={`Kỳ so sánh (${formatTitle(dateB, pickerType)})`}
                    stroke="#4ade80"
                    strokeWidth={!isCurrent ? 3 : 1.8}
                    strokeDasharray={!isCurrent ? "" : "4 4"}
                    dot={{ r: !isCurrent ? 5 : 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>

        {/* Biểu đồ Cơ cấu Tài chính (Doanh thu - Chi phí - Lợi nhuận) */}
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
              <BarChartOutlined style={{ color: "#2563eb" }} /> Cơ cấu Tài chính
              ({isCurrent ? "Kỳ chọn" : "Kỳ so sánh"})
            </Text>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={periodData.financialStructure}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    stroke="#94a3b8"
                    fontSize={10}
                  />
                  <YAxis
                    tickLine={false}
                    stroke="#94a3b8"
                    fontSize={9}
                    tickFormatter={(v) => `${v / 1000000}M`}
                  />
                  <Tooltip formatter={(v) => [formatVND(v), "Số tiền"]} />
                  <Bar
                    dataKey="amount"
                    name="Giá trị"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  >
                    {periodData.financialStructure.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
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
          <SwapOutlined style={{ color: "#10b981", fontSize: 20 }} />
          <span style={{ fontWeight: 800, fontSize: 18 }}>
            So Sánh Hiệu Quả Lợi Nhuận & Kinh Doanh
          </span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1100}
      style={{ top: 20 }}
    >
      {/* Header Bar: Chọn Chế độ so sánh Ngày/Tháng/Năm & 2 DatePickers */}
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
          background: "#f0fdf4",
          padding: "10px 16px",
          borderRadius: 8,
          border: "1px solid #dcfce7",
          marginBottom: 18,
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <Text strong>
          Biến động lợi nhuận ròng giữa {formatTitle(dateA, pickerType)} vs{" "}
          {formatTitle(dateB, pickerType)}:
        </Text>
        <Tag
          color={diffProfitPct >= 0 ? "success" : "error"}
          style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px" }}
        >
          Lợi nhuận ròng: {diffProfitPct >= 0 ? "+" : ""}
          {diffProfitPct}% ({formatVND(dataA.netProfit - dataB.netProfit)})
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

export default ProfitCompareModal;
