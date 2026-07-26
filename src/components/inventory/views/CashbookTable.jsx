import React from 'react';
import { Card, Input, Space, Button, Table, Tag, Row, Col, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const CashbookTable = ({ searchText, setSearchText, cashFlows }) => {
  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
        <Input
          placeholder="Theo mã phiếu thu/chi..."
          prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="small"
          style={{
            width: 240,
            height: 24,
            fontSize: 10.5,
            fontWeight: 600,
            color: '#1e293b',
            borderRadius: 16,
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
          }}
        />
        <Space wrap size={4}>
          <Button size="small" type="primary" onClick={() => message.info('Mở form Lập phiếu THU')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
            + Lập phiếu thu
          </Button>
          <Button size="small" type="primary" onClick={() => message.info('Mở form Lập phiếu CHI')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
            + Lập phiếu chi
          </Button>
          <Button size="small" onClick={() => message.info('Đã làm mới sổ quỹ.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>
            Làm mới
          </Button>
          <Button size="small" onClick={() => message.success('Đã xuất file sổ quỹ!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>
            Xuất file
          </Button>
        </Space>
      </div>

      <Row gutter={6} style={{ marginBottom: 4 }}>
        <Col span={8}>
          <div style={{ padding: '4px 8px', background: '#eff6ff', borderRadius: 4, border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: 9.5, color: '#64748b' }}>Tổng Thu Quỹ:</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563eb' }}>+2,450,000 đ</div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ padding: '4px 8px', background: '#fef2f2', borderRadius: 4, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 9.5, color: '#64748b' }}>Tổng Chi Quỹ:</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2626' }}>-15,850,000 đ</div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ padding: '4px 8px', background: '#ecfdf5', borderRadius: 4, border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: 9.5, color: '#64748b' }}>Số Dư Quỹ Tiền Mặt:</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#059669' }}>45,200,000 đ</div>
          </div>
        </Col>
      </Row>

      <div className="dense-table cashbook-table" style={{ flex: 1, overflow: 'hidden' }}>
        <Table
          dataSource={cashFlows}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
          scroll={{ x: 'max-content', y: 'calc(100vh - 268px)' }}
          columns={[
            { title: 'MÃ PHIẾU', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
            { title: 'NGÀY SỔ QUỶ', dataIndex: 'date', render: d => <span style={{ fontSize: 10 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</span> },
            {
              title: 'LOẠI QUỶ',
              dataIndex: 'direction',
              render: dir => dir === 'Inflow' ? <Tag color="green" style={{ fontSize: 9.5, padding: '0 3px' }}>Thu tiền</Tag> : <Tag color="red" style={{ fontSize: 9.5, padding: '0 3px' }}>Chi tiền</Tag>
            },
            { title: 'HẠNG MỤC', dataIndex: 'category', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
            { title: 'ĐỐI TÁC / KHÁCH', dataIndex: 'partner', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
            {
              title: 'SỐ TIỀN',
              dataIndex: 'amount',
              align: 'right',
              render: (val, r) => (
                <b style={{ fontSize: 10.5, color: r.direction === 'Inflow' ? '#059669' : '#dc2626' }}>
                  {r.direction === 'Inflow' ? '+' : '-'}{val.toLocaleString()} đ
                </b>
              )
            }
          ]}
        />
      </div>
    </Card>
  );
};

export default CashbookTable;
