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
 * Layout 2 cột: Left Sidebar Filter + Right Content (Dashboard & Report Modes)
 */
const HomePage = () => {
  // ─── Filter State ──────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("DD/MM/YYYY"),
  );
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [filterLoading, setFilterLoading] = useState(false);

  // ─── Display Mode State ("dashboard" | "report") ───────────────────────────
  const [displayMode, setDisplayMode] = useState("dashboard");

  // ─── Report Data State ─────────────────────────────────────────────────────
  const [reportData, setReportData] = useState(MOCK_DAILY_REPORT);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleApplyFilter = () => {
    setFilterLoading(true);
    setTimeout(() => {
      const updatedData = generateFilteredReportData(
        selectedDate,
        selectedEmployee,
      );
      setReportData(updatedData);
      setFilterLoading(false);
      message.success(`Đã cập nhật dữ liệu báo cáo ngày ${selectedDate}`);
    }, 300);
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
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* ─── LEFT SIDEBAR (~280px) ────────────────────────────────────────── */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <HomeFilter
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedEmployee={selectedEmployee}
          onEmployeeChange={setSelectedEmployee}
          onApply={handleApplyFilter}
          onReset={handleResetFilter}
          loading={filterLoading}
        />
      </div>

      {/* ─── RIGHT CONTENT AREA ───────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header: Title & Segmented Display Mode Switcher */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
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

        {/* Dynamic View Mode Content */}
        {displayMode === "dashboard" ? (
          <HomeDashboard data={reportData} />
        ) : (
          <HomeReport data={reportData} />
        )}
      </div>
    </div>
  );
};

export default HomePage;
