import { Row, Col, Tooltip } from "antd";
import {
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import ProfitAreaChart from "./OverviewSection/ProfitAreaChart";
import ProfitMarginCombo from "./OverviewSection/ProfitMarginCombo";
import RevenueExpenseBar from "./OverviewSection/RevenueExpenseBar";
import TimeRangeFilter from "./OverviewSection/TimeRangeFilter";
import TrendLineChart from "./OverviewSection/TrendLineChart";
import KPICard from "./KPICard";

const OverviewSection = ({
  loading = false,
  overviewStats = null,
  range = "thisMonth",
  customDates = null,
  onRangeChange,
  onCustomDatesChange,
  onRefresh,
}) => {
  const revenue = overviewStats?.revenue ?? 0;
  const expenses = overviewStats?.expenses ?? 0;
  const profit = overviewStats?.profit ?? 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
          padding: "16px 20px",
          background: "linear-gradient(135deg, #1a3a5c 0%, #1e4976 100%)",
          borderRadius: 12,
          color: "white",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 24 }}>📊</div>
          <div>
            <div
              style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px" }}
            >
              <Tooltip title="Overview">Tổng quan điều hành</Tooltip>
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
              Phân tích hiệu suất kinh doanh theo thời gian — dữ liệu thật từ hệ
              thống
            </div>
          </div>
        </div>
        {onRefresh && (
          <Tooltip title="Làm mới dữ liệu">
            <ReloadOutlined
              style={{
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                fontSize: 14,
              }}
              onClick={onRefresh}
            />
          </Tooltip>
        )}
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: "var(--color-surface)",
          borderRadius: 10,
          border: "1px solid var(--color-border)",
          marginBottom: 20,
        }}
      >
        <TimeRangeFilter
          value={range}
          onChange={onRangeChange}
          customDates={customDates}
          onCustomDatesChange={onCustomDatesChange}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <KPICard
            title="Tổng doanh thu"
            value={revenue}
            prevValue={null}
            icon={<RiseOutlined />}
            color="#3b82f6"
            compareLabel="So với kỳ trước"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard
            title="Tổng chi phí"
            value={expenses}
            prevValue={null}
            icon={<FallOutlined />}
            color="#ef4444"
            compareLabel="So với kỳ trước"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard
            title="Tổng lợi nhuận"
            value={profit}
            prevValue={null}
            icon={<DollarOutlined />}
            color="#22c55e"
            compareLabel="So với kỳ trước"
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <TrendLineChart
            data={overviewStats?.dailyStats || []}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <RevenueExpenseBar
            data={overviewStats?.monthlyStats || []}
            loading={loading}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ProfitAreaChart
            data={overviewStats?.monthlyStats || []}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <ProfitMarginCombo
            data={overviewStats?.monthlyStats || []}
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  );
};

export default OverviewSection;
