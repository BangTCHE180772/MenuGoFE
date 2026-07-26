import React, { useMemo } from 'react';
import { Card, Skeleton, Empty, Tooltip as AntTooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { CHART_COLORS } from './constants';
import { MOCK_ORDER_SUMMARY } from './constants';
import { formatPercent } from './utils';

const STATUS_CONFIG = {
  paid:      { label: 'Đã thanh toán', color: '#22c55e' },
  new:       { label: 'Mới',           color: '#3b82f6' },
  unpaid:    { label: 'Chưa thanh toán', color: '#f59e0b' },
  cancelled: { label: 'Đã huỷ',       color: '#ef4444' },
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '10px 14px', borderRadius: 8, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Tổng: {d.total} đơn</div>
      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{cfg.label}:</span>
          <span style={{ fontWeight: 600 }}>{d[key]} ({((d[key]/d.total)*100).toFixed(1)}%)</span>
        </div>
      ))}
    </div>
  );
};

/**
 * OrderSummaryBar — Horizontal Stacked Bar Chart hiển thị đơn hàng theo trạng thái.
 */
const OrderSummaryBar = ({ data = MOCK_ORDER_SUMMARY, loading = false, onRefresh }) => {
  const chartData = useMemo(() => {
    const { new: newOrders, paid, unpaid, cancelled, total } = data;
    return [{ total, new: newOrders, paid, unpaid, cancelled }];
  }, [data]);

  const hasData = chartData[0]?.total > 0;

  return (
    <Card
      title={
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          📋 Tổng quan đơn hàng hôm nay
        </span>
      }
      extra={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
            {data.total} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>đơn</span>
          </span>
          {onRefresh && (
            <AntTooltip title="Làm mới">
              <ReloadOutlined style={{ color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={onRefresh} />
            </AntTooltip>
          )}
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
      styles={{ body: { padding: '12px 20px 20px' } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : !hasData ? (
        <Empty description="Chưa có đơn hàng hôm nay" style={{ padding: '20px 0' }} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={72}>
            <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="total" hide />
              <Tooltip content={<CustomTooltip />} />
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <Bar key={key} dataKey={key} stackId="a" fill={cfg.color} radius={key === 'new' ? [6, 0, 0, 6] : key === 'cancelled' ? [0, 6, 6, 0] : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{cfg.label}</span>
                <span style={{ fontWeight: 700 }}>{data[key]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default OrderSummaryBar;
