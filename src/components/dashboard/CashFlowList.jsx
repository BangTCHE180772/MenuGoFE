import React, { useMemo } from 'react';
import { Card, List, Tag, Empty, Skeleton, Tooltip, Space, Typography, Badge } from 'antd';
import { ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { MOCK_CASHFLOW } from './constants';
import { formatVND } from './utils';

const { Text } = Typography;

const CATEGORY_TAGS = {
  'Thanh toán hóa đơn': { color: 'success' },
  'Thu khác':           { color: 'processing' },
  'Nhập hàng':          { color: 'error' },
  'Trả lương':          { color: 'error' },
  'Điện nước':          { color: 'warning' },
  'Chi phí khác':       { color: 'warning' },
};

/**
 * CashFlowList — danh sách giao dịch tiền vào/ra trong ngày.
 */
const CashFlowList = ({ data = MOCK_CASHFLOW, loading = false, onRefresh }) => {
  const { moneyIn, moneyOut, totalIn, totalOut } = useMemo(() => {
    const moneyIn = data.filter((d) => d.type === 'in');
    const moneyOut = data.filter((d) => d.type === 'out');
    const totalIn = moneyIn.reduce((s, d) => s + d.amount, 0);
    const totalOut = Math.abs(moneyOut.reduce((s, d) => s + d.amount, 0));
    return { moneyIn, moneyOut, totalIn, totalOut };
  }, [data]);

  const hasData = data.length > 0;

  return (
    <Card
      title={<span style={{ fontWeight: 700, fontSize: 15 }}>💰 Dòng tiền hôm nay</span>}
      extra={
        onRefresh && (
          <Tooltip title="Làm mới">
            <ReloadOutlined style={{ color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={onRefresh} />
          </Tooltip>
        )
      }
      style={{ borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', height: '100%' }}
      styles={{ body: { padding: '0 0 8px' } }}
    >
      {loading ? (
        <div style={{ padding: 16 }}><Skeleton active paragraph={{ rows: 5 }} /></div>
      ) : !hasData ? (
        <Empty description="Chưa có giao dịch" style={{ padding: 24 }} />
      ) : (
        <>
          {/* Summary row */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{ flex: 1, padding: '12px 20px', borderRight: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                ▲ Tiền vào
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{formatVND(totalIn)}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>{moneyIn.length} giao dịch</div>
            </div>
            <div style={{ flex: 1, padding: '12px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                ▼ Tiền ra
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{formatVND(totalOut)}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>{moneyOut.length} giao dịch</div>
            </div>
          </div>

          {/* Transaction list */}
          <List
            size="small"
            dataSource={data}
            style={{ maxHeight: 260, overflowY: 'auto' }}
            renderItem={(item) => {
              const isIn = item.type === 'in';
              const tagConfig = CATEGORY_TAGS[item.category] || { color: 'default' };
              return (
                <List.Item
                  style={{ padding: '8px 20px', cursor: 'pointer' }}
                  extra={
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: isIn ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {isIn ? '+' : ''}{formatVND(Math.abs(item.amount))}
                    </span>
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: isIn ? '#22c55e18' : '#ef444418',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 12,
                        color: isIn ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {isIn ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.category}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{item.time}</div>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        </>
      )}
    </Card>
  );
};

export default CashFlowList;
