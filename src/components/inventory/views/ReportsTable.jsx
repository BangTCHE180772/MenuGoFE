import React from 'react';
import { Card, Input, Space, Button, Table, Tag, message } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { STATIC_REPORTS } from '../inventoryConstants';

const ReportsTable = ({ searchText, setSearchText }) => {
  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
        <Input
          placeholder="Theo loại báo cáo..."
          prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="small"
          style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
        />
        <Space wrap size={4}>
          <Button size="small" type="primary" onClick={() => message.info('Xuất báo cáo tổng hợp')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Tạo báo cáo</Button>
          <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
          <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
        </Space>
      </div>
      <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
        <Table
          dataSource={STATIC_REPORTS}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
          scroll={{ x: 1820, y: 'calc(100vh - 218px)' }}
          columns={[
            { title: 'MÃ BÁO CÁO', dataIndex: 'code', width: 120, fixed: 'left', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
            { title: 'TÊN BÁO CÁO', dataIndex: 'name', width: 260, render: t => <b style={{ fontSize: 10.5 }}>{t}</b> },
            { title: 'LOẠI BÁO CÁO', dataIndex: 'type', width: 120, render: t => <Tag color="cyan" style={{ fontSize: 9.5, padding: '0 3px' }}>{t}</Tag> },
            { title: 'KỲ BÁO CÁO', dataIndex: 'period', width: 120, render: t => <span style={{ fontSize: 10 }}>{t}</span> },
            { title: 'NGÀY LẬP', dataIndex: 'date', width: 130, render: d => <span style={{ fontSize: 10 }}>{d}</span> },
            { title: 'NGƯỜI LẬP', dataIndex: 'creator', width: 140, render: t => <span style={{ fontSize: 10 }}>{t}</span> },
            { title: 'PHÒNG BAN', dataIndex: 'dept', width: 140, render: t => <span style={{ fontSize: 10, color: '#64748b' }}>{t}</span> },
            { title: 'CHI NHÁNH', dataIndex: 'branch', width: 180, render: t => <span style={{ fontSize: 10 }}>{t}</span> },
            { title: 'TỔNG BẢN GHI', dataIndex: 'records', width: 110, align: 'right', render: c => <Tag color="blue" style={{ fontSize: 9.5, padding: '0 3px' }}>{c.toLocaleString()} mục</Tag> },
            { title: 'TỔNG GIÁ TRỊ', dataIndex: 'total', width: 160, align: 'right', render: v => <b style={{ fontSize: 10.5, color: '#059669' }}>{v.toLocaleString()} đ</b> },
            { title: 'ĐỊNH DẠNG', dataIndex: 'format', width: 110, render: f => <Tag color="purple" style={{ fontSize: 9.5, padding: '0 3px' }}>{f}</Tag> },
            { title: 'TRẠNG THÁI', dataIndex: 'status', width: 130, render: s => s === 'Đã phê duyệt' ? <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Đã phê duyệt</Tag> : <Tag color="warning" style={{ fontSize: 9.5, padding: '0 3px' }}>Chờ duyệt</Tag> },
            {
              title: 'THAO TÁC',
              key: 'action',
              width: 100,
              align: 'center',
              fixed: 'right',
              render: () => (
                <Button size="small" type="link" icon={<DownloadOutlined style={{ fontSize: 11 }} />} onClick={() => message.success('Đã tải báo cáo!')} style={{ fontSize: 10, padding: 0 }}>
                  Tải về
                </Button>
              )
            }
          ]}
        />
      </div>
    </Card>
  );
};

export default ReportsTable;
