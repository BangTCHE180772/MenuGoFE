import React from 'react';
import { Card, Input, Space, Button, Table, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { STATIC_ROOMS_TABLES } from '../inventoryConstants';

const RoomsTablesView = ({ searchText, setSearchText }) => {
  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
        <Input
          placeholder="Theo tên phòng/bàn..."
          prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="small"
          style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
        />
        <Space wrap size={4}>
          <Button size="small" type="primary" onClick={() => message.info('Mở form tạo Phòng/Bàn')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Thêm phòng/bàn</Button>
          <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
          <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
        </Space>
      </div>
      <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
        <Table
          dataSource={STATIC_ROOMS_TABLES}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
          scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
          columns={[
            { title: 'MÃ PHÒNG/BÀN', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
            { title: 'TÊN PHÒNG/BÀN', dataIndex: 'name', render: t => <b style={{ fontSize: 10.5 }}>{t}</b> },
            { title: 'KHU VỰC', dataIndex: 'area', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
            { title: 'SỨC CHỨA', dataIndex: 'capacity', render: c => <Tag color="blue" style={{ fontSize: 9.5, padding: '0 3px' }}>{c}</Tag> },
            { title: 'TRẠNG THÁI', dataIndex: 'status', render: s => s === 'Trống' ? <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Trống</Tag> : <Tag color="error" style={{ fontSize: 9.5, padding: '0 3px' }}>Đang phục vụ</Tag> }
          ]}
        />
      </div>
    </Card>
  );
};

export default RoomsTablesView;
