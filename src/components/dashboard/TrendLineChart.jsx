import React, { useMemo } from 'react';
import { Card, Empty, Skeleton, Tooltip as AntTooltip, Select } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS, MOCK_TREND_DATA } from './constants';
import { formatVND } from './utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '10px 16px', borderRadius: 10, boxShadow: 'var(--shadow-md)', minWidth: 180 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 3 }}>
          <span style={{ width: 10, height: 3, background: p.color, display: 'inline-block', borderRadius: 2 }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: p.color }}>{formatVND(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * TrendLineChart — Multi-line chart: Revenue / Expense / Profit.
 */
const TrendLineChart = ({ data = MOCK_TREND_DATA, loading = false, onRefresh }) => {
  const hasData = data.length > 0;

  return (
    <Card
      title={<span style={{ fontWeight: 700, fontSize: 15 }}>📈 Xu hướng Doanh thu – Chi phí – Lợi nhuận</span>}
      extra={
        onRefresh && (
          <AntTooltip title="Làm mới">
            <ReloadOutlined style={{ color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={onRefresh} />
          </AntTooltip>
        )
      }
      style={{ borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
      styles={{ body: { padding: '8px 16px 20px' } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !hasData ? (
        <Empty description="Chưa có dữ liệu xu hướng" style={{ padding: 40 }} />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatVND(v)} tick={{ fontSize: 11 }} width={72} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Doanh thu"
              stroke={CHART_COLORS.revenue}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Chi phí"
              stroke={CHART_COLORS.expense}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="Lợi nhuận"
              stroke={CHART_COLORS.profit}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default TrendLineChart;
