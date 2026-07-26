import React, { useState, useCallback } from 'react';
import { Row, Col, Divider, Typography, Space, Badge, Spin } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  PercentageOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import KPICard from './KPICard';
import OrderSummaryBar from './OrderSummaryBar';
import CashFlowList from './CashFlowList';
import AlertsPanel from './AlertsPanel';
import {
  MOCK_KPI_TODAY,
  MOCK_ORDER_SUMMARY,
  MOCK_CASHFLOW,
  MOCK_ALERTS,
  MOCK_MENU_SUMMARY,
} from './constants';

const { Title, Text } = Typography;

/**
 * ExecutiveSummary — Phần trên của dashboard: KPI hôm nay, Đơn hàng, Dòng tiền, Cảnh báo.
 */
const ExecutiveSummary = ({ loading = false }) => {
  const kpi = MOCK_KPI_TODAY;
  const menuKpi = MOCK_MENU_SUMMARY;

  const handleRefresh = useCallback(() => {
    // TODO: gọi API refresh khi kết nối thật
  }, []);

  const profitMarginToday = kpi.revenue.value > 0
    ? { value: kpi.profit.value / kpi.revenue.value, prevValue: kpi.profitMargin.prevValue }
    : null;

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
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: 12,
          color: 'white',
        }}
      >
        <div style={{ fontSize: 24 }}>⚡</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Executive Summary
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            Tổng quan hoạt động hôm nay — cập nhật theo thời gian thực
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge
            status="processing"
            color="#22c55e"
            text={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Live</span>}
          />
        </div>
      </div>

      {/* KPI Today Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Doanh thu hôm nay"
            value={kpi.revenue.value}
            prevValue={kpi.revenue.prevValue}
            icon={<RiseOutlined />}
            color="#3b82f6"
            compareLabel="So với hôm qua"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Chi phí hôm nay"
            value={kpi.expense.value}
            prevValue={kpi.expense.prevValue}
            icon={<FallOutlined />}
            color="#ef4444"
            compareLabel="So với hôm qua"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Lợi nhuận hôm nay"
            value={kpi.profit.value}
            prevValue={kpi.profit.prevValue}
            icon={<DollarOutlined />}
            color="#22c55e"
            compareLabel="So với hôm qua"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Tỷ suất lợi nhuận"
            value={profitMarginToday?.value ?? 0}
            prevValue={profitMarginToday?.prevValue ?? 0}
            icon={<PercentageOutlined />}
            color="#f59e0b"
            isPercent
            compareLabel="So với hôm qua"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
      </Row>

      {/* Menu KPIs row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <KPICard
            title="Món đã bán hôm nay"
            value={menuKpi.totalItemsSold}
            prevValue={menuKpi.prevTotalItemsSold}
            icon={<ShoppingOutlined />}
            color="#8b5cf6"
            compareLabel="So với hôm qua"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard
            title="Giá trị đơn trung bình"
            value={menuKpi.avgOrderValue}
            prevValue={menuKpi.prevAvgOrderValue}
            icon={<DollarOutlined />}
            color="#0891b2"
            compareLabel="So với hôm qua"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard
            title="Hoá đơn đã hoàn thành"
            value={menuKpi.completedBills}
            prevValue={menuKpi.prevCompletedBills}
            icon={<CheckCircleOutlined />}
            color="#16a34a"
            compareLabel="So với hôm qua"
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
      </Row>

      {/* Bottom row: Order + CashFlow + Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrderSummaryBar
              data={MOCK_ORDER_SUMMARY}
              loading={loading}
              onRefresh={handleRefresh}
            />
            <AlertsPanel
              alerts={MOCK_ALERTS}
              loading={loading}
              onRefresh={handleRefresh}
            />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <CashFlowList
            data={MOCK_CASHFLOW}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ExecutiveSummary;
