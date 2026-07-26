import { useState, useEffect, useCallback } from "react";
import { Divider } from "antd";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import ExecutiveSummary from "../components/dashboard/ExecutiveSummary";
import OverviewSection from "../components/dashboard/OverviewSection";
import { getBranchDashboardStats } from "../api/dashboardApi";
import "../styles/HomePage.css";

const HomePage = () => {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();

  const [todayStats, setTodayStats] = useState(null);
  const [yesterdayStats, setYesterdayStats] = useState(null);
  const [todayLoading, setTodayLoading] = useState(true);

  const [overviewStats, setOverviewStats] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewRange, setOverviewRange] = useState("thisMonth");
  const [overviewCustomDates, setOverviewCustomDates] = useState(null);

  const fetchTodayData = useCallback(async () => {
    setTodayLoading(true);
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yyyymmdd = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const [resToday, resYesterday] = await Promise.all([
        getBranchDashboardStats("today", null, null, currentBranchId),
        getBranchDashboardStats(
          "custom",
          yyyymmdd(yesterday),
          yyyymmdd(yesterday),
          currentBranchId,
        ),
      ]);

      setTodayStats(resToday.data);
      setYesterdayStats(resYesterday.data);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu today:", err);
      setTodayStats(null);
      setYesterdayStats(null);
    } finally {
      setTodayLoading(false);
    }
  }, [currentBranchId]);

  const fetchOverviewData = useCallback(
    async (range, customDates) => {
      setOverviewLoading(true);
      try {
        let startDateStr = null;
        let endDateStr = null;

        if (range === "custom" && customDates?.[0] && customDates?.[1]) {
          const fmt = (d) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          startDateStr = fmt(
            customDates[0].toDate
              ? customDates[0].toDate()
              : new Date(customDates[0]),
          );
          endDateStr = fmt(
            customDates[1].toDate
              ? customDates[1].toDate()
              : new Date(customDates[1]),
          );
        }

        const res = await getBranchDashboardStats(
          range,
          startDateStr,
          endDateStr,
          currentBranchId,
        );
        setOverviewStats(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu overview:", err);
        setOverviewStats(null);
      } finally {
        setOverviewLoading(false);
      }
    },
    [currentBranchId],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodayData();
  }, [fetchTodayData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOverviewData(overviewRange, overviewCustomDates);
  }, [fetchOverviewData, overviewRange, overviewCustomDates]);

  const handleOverviewRangeChange = useCallback((range) => {
    setOverviewRange(range);
  }, []);

  const handleOverviewCustomDatesChange = useCallback((dates) => {
    setOverviewCustomDates(dates);
    if (dates) setOverviewRange("custom");
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome-container">
        <div>
          <h1 className="dashboard-welcome-title">
            Xin chào, {user?.name ?? "bạn"} 👋
          </h1>
          <p className="dashboard-welcome-subtitle">
            Dashboard chi nhánh — cập nhật dữ liệu hoạt động hôm nay
          </p>
        </div>
      </div>

      <ExecutiveSummary
        loading={todayLoading}
        todayStats={todayStats}
        yesterdayStats={yesterdayStats}
        onRefresh={fetchTodayData}
      />

      <Divider style={{ margin: "0", borderColor: "var(--color-border)" }} />

      <OverviewSection
        loading={overviewLoading}
        overviewStats={overviewStats}
        range={overviewRange}
        customDates={overviewCustomDates}
        onRangeChange={handleOverviewRangeChange}
        onCustomDatesChange={handleOverviewCustomDatesChange}
        onRefresh={() => fetchOverviewData(overviewRange, overviewCustomDates)}
      />
    </div>
  );
};

export default HomePage;
