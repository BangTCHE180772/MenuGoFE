import React, { useState, useCallback } from 'react';
import { Row, Col } from 'antd';
import { RiseOutlined, FallOutlined, DollarOutlined } from '@ant-design/icons';
import KPICard from './KPICard';
import TrendLineChart from './TrendLineChart';
import RevenueExpenseBar from './RevenueExpenseBar';
import ProfitAreaChart from './ProfitAreaChart';
import ProfitMarginCombo from './ProfitMarginCombo';
import TimeRangeFilter from './TimeRangeFilter';
import {
  MOCK_KPI_OVERVIEW,
  MOCK_TREND_DATA,
  MOCK_MONTHLY_DATA,
} from './constants';

/**
 * OverviewSection — Phần dưới: KPI tổng hợp + bộ lọc thời gian + các charts.
 */
const OverviewSection = ({ loading = false }) => {
  const [range, setRange] = useState('thisMonth');
  const [customDates, setCustomDates] = useState(null);
  const kpi = MOCK_KPI_OVERVIEW;

  const handleRefresh = useCallback(() => {
    // TODO: gọi API refresh
  }, []);

  return (
    <div>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #1a3a5c 0%, #1e4976 100%)',
          borderRadius: 12,
          color: 'white',
        }}
      >
        <div style={{ fontSize: 24 }}>📊</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Overview
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            Phân tích hiệu suất kinh doanh theo thời gian
          </div>
        </div>
      </div>

      {/* Time range filter */}
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--color-surface)',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
          marginBottom: 20,
        }}
      >
        <TimeRangeFilter
          value={range}
          onChange={setRange}
          customDates={customDates}
          onCustomDatesChange={setCustomDates}
        />
      </div>

      {/* Overview KPI Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <KPICard
            title="Tổng doanh thu"
            value={kpi.revenue.value}
            prevValue={kpi.revenue.prevValue}
            icon={<RiseOutlined />}
            color="#3b82f6"
            compareLabel="So với kỳ trước"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard
            title="Tổng chi phí"
            value={kpi.expense.value}
            prevValue={kpi.expense.prevValue}
            icon={<FallOutlined />}
            color="#ef4444"
            compareLabel="So với kỳ trước"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard
            title="Tổng lợi nhuận"
            value={kpi.profit.value}
            prevValue={kpi.profit.prevValue}
            icon={<DollarOutlined />}
            color="#22c55e"
            compareLabel="So với kỳ trước"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
      </Row>

      {/* Trend line chart (full width) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <TrendLineChart data={MOCK_TREND_DATA} loading={loading} onRefresh={handleRefresh} />
        </Col>
      </Row>

      {/* Revenue vs Expense + Profit Area (2 col) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <RevenueExpenseBar data={MOCK_MONTHLY_DATA} loading={loading} onRefresh={handleRefresh} />
        </Col>
        <Col xs={24} lg={12}>
          <ProfitAreaChart data={MOCK_MONTHLY_DATA} loading={loading} onRefresh={handleRefresh} />
        </Col>
      </Row>

      {/* Profit Margin Combo (full width) */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <ProfitMarginCombo data={MOCK_MONTHLY_DATA} loading={loading} onRefresh={handleRefresh} />
        </Col>
      </Row>
    </div>
  );
};

export default OverviewSection;
