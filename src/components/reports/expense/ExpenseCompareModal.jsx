import { useState } from "react";
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
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
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

const { Title, Text } = Typography;

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

const ExpenseCompareModal = ({ visible, onClose }) => {
  const [hoveredPieIndex, setHoveredPieIndex] = useState(-1);
  const [pickerType, setPickerType] = useState("date");

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

  const combinedTrends = [
    {
      date: "Mốc 1 (Tuần 1 / Giờ 1-6)",
      expenseA: 18500000,
      expenseB: 15200000,
    },
    {
      date: "Mốc 2 (Tuần 2 / Giờ 7-12)",
      expenseA: 32000000,
      expenseB: 29800000,
    },
    {
      date: "Mốc 3 (Tuần 3 / Giờ 13-18)",
      expenseA: 24500000,
      expenseB: 26100000,
    },
    {
      date: "Mốc 4 (Tuần 4 / Giờ 19-24)",
      expenseA: 37000000,
      expenseB: 31000000,
    },
  ];

  const dataA = {
    title: `Kỳ chọn: ${formatTitle(dateA, pickerType)}`,
    totalExpense: 112000000,
    avgExpense: 3200000,
    avgExpensePerDay: 3733333,
    largestExpense: 32000000,
    growthPct: -4.2,
    breakdown: [
      { name: "Nguyên liệu & Thực phẩm", value: 48000000 },
      { name: "Lương nhân viên", value: 32000000 },
      { name: "Thuê mặt bằng", value: 18000000 },
      { name: "Điện, Nước & Gas", value: 8500000 },
      { name: "Tiếp thị & Quảng cáo", value: 3500000 },
      { name: "Chi phí khác", value: 2000000 },
    ],
    topExpenses: [
      { name: "Nhập thịt bò Mỹ & Hải sản", amount: 32000000 },
      { name: "Trả lương nhân viên kỳ này", amount: 28000000 },
      { name: "Tiền thuê mặt bằng", amount: 18000000 },
      { name: "Tiền điện sản xuất", amount: 8500000 },
      { name: "Nhập bia & đồ uống", amount: 5500000 },
    ],
  };

  const dataB = {
    title: `Kỳ so sánh: ${formatTitle(dateB, pickerType)}`,
    totalExpense: 102100000,
    avgExpense: 3100000,
    avgExpensePerDay: 3403333,
    largestExpense: 29800000,
    growthPct: 2.1,
    breakdown: [
      { name: "Nguyên liệu & Thực phẩm", value: 44000000 },
      { name: "Lương nhân viên", value: 29800000 },
      { name: "Thuê mặt bằng", value: 18000000 },
      { name: "Điện, Nước & Gas", value: 7200000 },
      { name: "Tiếp thị & Quảng cáo", value: 2100000 },
      { name: "Chi phí khác", value: 1000000 },
    ],
    topExpenses: [
      { name: "Trả lương nhân viên kỳ trước", amount: 29800000 },
      { name: "Nhập hải sản tươi & rau củ", amount: 26000000 },
      { name: "Tiền thuê mặt bằng", amount: 18000000 },
      { name: "Tiền điện & gas", amount: 7200000 },
      { name: "Chi phí tiếp thị TikTok/FB", amount: 2100000 },
    ],
  };

  const diffExpensePct = Number(
    (
      ((dataA.totalExpense - dataB.totalExpense) / dataB.totalExpense) *
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
              Tổng Chi Phí
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444" }}>
              {formatVND(periodData.totalExpense)}
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
              Chi Phí Trung Bình / Phiếu
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#ea580c" }}>
              {formatVND(periodData.avgExpense)}
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
              Chi Phí Trung Bình / Ngày
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#8b5cf6" }}>
              {formatVND(periodData.avgExpensePerDay)}
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
              Khoản Chi Lớn Nhất
            </Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#2563eb" }}>
              {formatVND(periodData.largestExpense)}
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
              Tăng Trưởng Chi Phí
            </Text>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: periodData.growthPct <= 0 ? "#16a34a" : "#dc2626",
              }}
            >
              {periodData.growthPct}%
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
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
              <LineChartOutlined style={{ color: "#ef4444" }} /> Xu hướng Chi
              phí theo thời gian
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

                  <Line
                    type="monotone"
                    dataKey="expenseA"
                    name={`Kỳ chọn (${formatTitle(dateA, pickerType)})`}
                    stroke="#ef4444"
                    strokeWidth={isCurrent ? 3 : 1.8}
                    strokeDasharray={isCurrent ? "" : "4 4"}
                    dot={{ r: isCurrent ? 5 : 3 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="expenseB"
                    name={`Kỳ so sánh (${formatTitle(dateB, pickerType)})`}
                    stroke="#f97316"
                    strokeWidth={!isCurrent ? 3 : 1.8}
                    strokeDasharray={!isCurrent ? "" : "4 4"}
                    dot={{ r: !isCurrent ? 5 : 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>

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
              <PieChartOutlined style={{ color: "#8b5cf6" }} /> Cơ cấu Chi phí
              theo Loại
            </Text>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={periodData.breakdown}
                    cx="50%"
                    cy="40%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                    onMouseEnter={(_, index) => setHoveredPieIndex(index)}
                    onMouseLeave={() => setHoveredPieIndex(-1)}
                  >
                    {periodData.breakdown.map((_, i) => (
                      <Cell
                        key={i}
                        fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]}
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
                  <Tooltip formatter={(v) => [formatVND(v), "Chi phí"]} />
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

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col span={24}>
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
              <BarChartOutlined
                style={{ color: isCurrent ? "#ef4444" : "#f97316" }}
              />{" "}
              Top Khoản Chi Lớn Nhất ({isCurrent ? "Kỳ chọn" : "Kỳ so sánh"})
            </Text>
            <div style={{ width: "100%", height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={periodData.topExpenses}
                  margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${v / 1000000}M`}
                    fontSize={9}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={210}
                    fontSize={10}
                    stroke="#64748b"
                  />
                  <Tooltip formatter={(v) => [formatVND(v), "Giá trị chi"]} />
                  <Bar
                    dataKey="amount"
                    name="Giá trị chi"
                    fill={isCurrent ? "#ef4444" : "#f97316"}
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
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
          <SwapOutlined style={{ color: "#ef4444", fontSize: 20 }} />
          <span style={{ fontWeight: 800, fontSize: 18 }}>
            So Sánh Hiệu Quả Chi Phí Vận Hành
          </span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1100}
      style={{ top: 20 }}
    >
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

      <div
        style={{
          background: "#fef2f2",
          padding: "10px 16px",
          borderRadius: 8,
          border: "1px solid #fee2e2",
          marginBottom: 18,
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <Text strong>
          Biến động chi phí giữa {formatTitle(dateA, pickerType)} vs{" "}
          {formatTitle(dateB, pickerType)}:
        </Text>
        <Tag
          color={diffExpensePct <= 0 ? "success" : "error"}
          style={{ fontSize: 14, fontWeight: 700, padding: "2px 8px" }}
        >
          Tổng chi phí: {diffExpensePct >= 0 ? "+" : ""}
          {diffExpensePct}% (
          {formatVND(dataA.totalExpense - dataB.totalExpense)})
        </Tag>
      </div>

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

export default ExpenseCompareModal;
