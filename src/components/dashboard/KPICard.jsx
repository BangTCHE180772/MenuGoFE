import React, { useMemo } from 'react';
import { Card, Skeleton, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatVND, formatPercent, calcGrowth } from './utils';

/**
 * KPICard — hiển thị 1 chỉ số KPI với icon, giá trị, trend % so kỳ trước.
 *
 * Props:
 *   title        {string}   Tên KPI
 *   value        {number}   Giá trị hiện tại
 *   prevValue    {number}   Giá trị kỳ trước (để tính growth)
 *   icon         {ReactNode} Icon Ant Design
 *   color        {string}   Màu accent (hex/var)
 *   isPercent    {boolean}  Nếu true thì format là %, không phải VNĐ
 *   compareLabel {string}   Nhãn so sánh, vd "So với hôm qua"
 *   loading      {boolean}
 *   onRefresh    {function}
 */
const KPICard = ({
  title,
  value,
  prevValue,
  icon,
  color = '#3b82f6',
  isPercent = false,
  compareLabel = 'So với kỳ trước',
  loading = false,
  onRefresh,
}) => {
  const growth = useMemo(() => calcGrowth(value, prevValue), [value, prevValue]);
  const isPositive = growth !== null && growth >= 0;
  const formattedValue = isPercent ? formatPercent(value) : formatVND(value);

  return (
    <Card
      style={{
        borderRadius: 12,
        border: `1px solid var(--color-border)`,
        boxShadow: 'var(--shadow-sm)',
        height: '100%',
        transition: 'box-shadow 0.2s',
      }}
      styles={{ body: { padding: '20px 24px' } }}
      hoverable
      extra={
        onRefresh && (
          <Tooltip title="Làm mới">
            <ReloadOutlined
              style={{ color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              onClick={onRefresh}
            />
          </Tooltip>
        )
      }
      title={
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <div>
          {/* Icon + Value row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color,
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: 'var(--color-text)',
                lineHeight: 1,
              }}
            >
              {formattedValue}
            </span>
          </div>

          {/* Growth badge */}
          {growth !== null ? (
            <Tooltip title={compareLabel}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: isPositive ? '#22c55e18' : '#ef444418',
                  fontSize: 12,
                  fontWeight: 700,
                  color: isPositive ? '#16a34a' : '#dc2626',
                  cursor: 'default',
                }}
              >
                {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(growth).toFixed(1)}%
                <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: 2 }}>
                  {compareLabel}
                </span>
              </div>
            </Tooltip>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Không có dữ liệu so sánh</span>
          )}
        </div>
      )}
    </Card>
  );
};

export default KPICard;
