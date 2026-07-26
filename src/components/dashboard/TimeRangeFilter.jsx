import React from 'react';
import { Button, DatePicker, Space, Segmented, Tooltip } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { TIME_RANGES } from './constants';

const { RangePicker } = DatePicker;

/**
 * TimeRangeFilter — Bộ lọc thời gian dùng chung cho tất cả chart trong Overview.
 */
const TimeRangeFilter = ({
  value,
  onChange,
  customDates,
  onCustomDatesChange,
}) => {
  const options = TIME_RANGES.map((r) => ({ label: r.label, value: r.value }));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Segmented
        value={value}
        onChange={onChange}
        options={options.filter((o) => o.value !== 'custom')}
        style={{ fontWeight: 500 }}
      />
      <Tooltip title="Chọn khoảng thời gian tuỳ chỉnh">
        <Button
          type={value === 'custom' ? 'primary' : 'default'}
          icon={<CalendarOutlined />}
          onClick={() => onChange('custom')}
        >
          Tuỳ chỉnh
        </Button>
      </Tooltip>
      {value === 'custom' && (
        <RangePicker
          value={customDates}
          onChange={onCustomDatesChange}
          format="DD/MM/YYYY"
          allowClear
        />
      )}
    </div>
  );
};

export default TimeRangeFilter;
