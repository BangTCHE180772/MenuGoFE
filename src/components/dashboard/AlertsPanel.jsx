import React from 'react';
import { Card, List, Empty, Skeleton, Tooltip } from 'antd';
import { ReloadOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { MOCK_ALERTS } from './constants';

const LEVEL_CONFIG = {
  warning: {
    color: '#f59e0b',
    bg: '#fef3c718',
    border: '#fef3c7',
    icon: '⚠️',
  },
  danger: {
    color: '#ef4444',
    bg: '#fee2e218',
    border: '#fecaca',
    icon: '🔴',
  },
  info: {
    color: '#3b82f6',
    bg: '#dbeafe18',
    border: '#bfdbfe',
    icon: 'ℹ️',
  },
};

/**
 * AlertsPanel — Danh sách cảnh báo hoạt động của chi nhánh.
 */
const AlertsPanel = ({ alerts = MOCK_ALERTS, loading = false, onRefresh }) => {
  const hasAlerts = alerts.length > 0;

  return (
    <Card
      title={
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          🔔 Cảnh báo hoạt động
        </span>
      }
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
      style={{
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        height: '100%',
      }}
      styles={{ body: { padding: '8px 16px 16px' } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : !hasAlerts ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 0',
            gap: 8,
          }}
        >
          <CheckCircleOutlined style={{ fontSize: 32, color: '#22c55e' }} />
          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 14 }}>
            Mọi thứ đang hoạt động bình thường.
          </span>
        </div>
      ) : (
        <List
          dataSource={alerts}
          renderItem={(item) => {
            const cfg = LEVEL_CONFIG[item.level] || LEVEL_CONFIG.info;
            return (
              <List.Item style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 13, color: cfg.color, fontWeight: 600 }}>
                    {item.message}
                  </span>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};

export default AlertsPanel;
