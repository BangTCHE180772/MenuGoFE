import { useState } from "react";
import { Typography, Segmented, message, Space, Tag } from "antd";
import {
  DashboardOutlined,
  TableOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import HomeFilter from "../components/homePage/HomeFilter";
import HomeDashboard from "../components/homePage/HomeDashboard";
import HomeReport from "../components/homePage/HomeReport";
import {
  MOCK_DAILY_REPORT,
  generateFilteredReportData,
} from "../components/homePage/homeMockData";

const { Title, Text } = Typography;

/**
 * HomePage — Trang Báo Cáo Trong Ngày (Daily Report)
 * Layout chuẩn mới: Top Header Card ➔ Horizontal HomeFilter Bar ➔ Tabs Content (Dashboard & Report)
 */
const HomePage = () => {
  // ─── Filter State ──────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("DD/MM/YYYY"),
  );
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  // ─── Display Mode State ("dashboard" | "report") ───────────────────────────
  const [displayMode, setDisplayMode] = useState("dashboard");

  // ─── Report Data State ─────────────────────────────────────────────────────
  const [reportData, setReportData] = useState(MOCK_DAILY_REPORT);

  // ─── Instant Auto-Apply Handlers ───────────────────────────────────────────
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    const updatedData = generateFilteredReportData(newDate, selectedEmployee);
    setReportData(updatedData);
    message.success(`Đã cập nhật dữ liệu báo cáo ngày ${newDate}`);
  };

  const handleEmployeeChange = (newEmp) => {
    setSelectedEmployee(newEmp);
    const updatedData = generateFilteredReportData(selectedDate, newEmp);
    setReportData(updatedData);
    message.success("Đã cập nhật dữ liệu theo nhân viên");
  };

  const handleResetFilter = () => {
    const todayStr = dayjs().format("DD/MM/YYYY");
    setSelectedDate(todayStr);
    setSelectedEmployee("all");
    const defaultData = generateFilteredReportData(todayStr, "all");
    setReportData(defaultData);
    message.info("Đã đặt lại bộ lọc báo cáo về mặc định");
  };

  return (
    <div style={{ width: "100%", paddingBottom: 24 }}>
      {/* ─── 1. TOP HEADER CARD ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 16,
          background: "var(--color-surface)",
          padding: "16px 20px",
          borderRadius: "var(--border-radius)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div>
          <Space align="center" size="small">
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              Báo cáo trong ngày
            </Title>
            <Tag
              color="orange"
              icon={<CalendarOutlined />}
              style={{ borderRadius: 6, fontSize: 13, padding: "2px 8px" }}
            >
              {reportData.dateStr}
            </Tag>
          </Space>
          <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            Tổng hợp chỉ số và nhật ký hoạt động kinh doanh hàng ngày
          </Text>
        </div>

        {/* Segmented Display Mode: Dashboard vs Report */}
        <Segmented
          value={displayMode}
          onChange={setDisplayMode}
          size="large"
          options={[
            {
              label: (
                <div style={{ padding: "4px 8px" }}>
                  <DashboardOutlined style={{ marginRight: 6 }} />
                  <span>Dashboard</span>
                </div>
              ),
              value: "dashboard",
            },
            {
              label: (
                <div style={{ padding: "4px 8px" }}>
                  <TableOutlined style={{ marginRight: 6 }} />
                  <span>Report</span>
                </div>
              ),
              value: "report",
            },
          ]}
        />
      </div>

      {/* ─── 2. BỘ LỌC BÁO CÁO NGANG (NGAY DƯỚI HEADER & NGAY TRÊN TAB CONTENT) ─── */}
      <HomeFilter
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedEmployee={selectedEmployee}
        onEmployeeChange={handleEmployeeChange}
        onReset={handleResetFilter}
      />

      {/* ─── 3. DYNAMIC VIEW MODE CONTENT (DASHBOARD / REPORT TABS) ──────── */}
      {displayMode === "dashboard" ? (
        <HomeDashboard data={reportData} />
      ) : (
        <HomeReport data={reportData} />
      )}
    </div>
  );
};

export default HomePage;
