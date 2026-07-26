import React, { useMemo } from 'react';
import { Card, Empty, Skeleton, Tooltip as AntTooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS, MOCK_MONTHLY_DATA } from './constants';
import { formatVND, formatPercent } from './utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '10px 16px', borderRadius: 10, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 3 }}>
          <span style={{ width: 10, height: 10, background: p.fill || p.stroke, display: 'inline-block', borderRadius: p.type === 'line' ? '50%' : 3 }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>
            {p.dataKey === 'margin' ? formatPercent(p.value / 100) : formatVND(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * ProfitMarginCombo — Combo chart: Bar Revenue + Bar Profit + Line Profit Margin %.
 */
const ProfitMarginCombo = ({ data: rawData = MOCK_MONTHLY_DATA, loading = false, onRefresh }) => {
  const data = useMemo(() =>
    rawData.map((d) => ({
      ...d,
      margin: d.revenue > 0 ? parseFloat(((d.profit / d.revenue) * 100).toFixed(1)) : 0,
    })),
    [rawData]
  );

  const hasData = data.some((d) => d.revenue > 0);

  return (
    <Card
      title={<span style={{ fontWeight: 700, fontSize: 15 }}>🎯 Doanh thu – Lợi nhuận – Tỷ suất lợi nhuận</span>}
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
        <Empty description="Chưa có dữ liệu" style={{ padding: 40 }} />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tickFormatter={(v) => formatVND(v)} tick={{ fontSize: 11 }} width={72} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill={`${CHART_COLORS.revenue}88`} radius={[4, 4, 0, 0]} barSize={16} />
            <Bar yAxisId="left" dataKey="profit" name="Lợi nhuận" fill={`${CHART_COLORS.profit}88`} radius={[4, 4, 0, 0]} barSize={16} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="margin"
              name="Tỷ suất (%)"
              stroke={CHART_COLORS.profitMargin}
              strokeWidth={2.5}
              dot={{ fill: CHART_COLORS.profitMargin, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ProfitMarginCombo;
