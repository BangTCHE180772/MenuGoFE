import React from 'react';
import { Card, Input, Space, Button, Table, Tag, Popconfirm, message } from 'antd';
import { SearchOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { DOC_TYPE_CONFIG } from '../inventoryConstants';

const DocumentsTable = ({
  activeSubOption,
  searchText,
  setSearchText,
  filteredDocuments,
  loading,
  setModalImportOpen,
  setModalExportOpen,
  setModalTransferOpen,
  setModalCheckOpen,
  setModalProductionOpen,
  setSelectedTransferDoc,
  setModalTransferReceiveOpen,
  handleDeleteDocument
}) => {
  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
    >
      {/* CONTENT ACTION HEADER: SEARCH BAR (LEFT) & ACTION BUTTONS (RIGHT) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
        {/* THANH SEARCH KHỐI CONTENT (GỌN VỪA VẶN CHUẨN PILL) */}
        <Input
          placeholder="Theo mã phiếu..."
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
          {activeSubOption === '1_4' && (
            <Button size="small" type="primary" onClick={() => setModalImportOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
              + Nhập kho
            </Button>
          )}

          {activeSubOption === '4' && (
            <Button size="small" type="primary" onClick={() => message.info('Mở form Trả hàng nhập')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
              + Trả hàng nhập
            </Button>
          )}

          {activeSubOption === '2' && (
            <Button size="small" type="primary" onClick={() => setModalExportOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
              + Xuất hủy
            </Button>
          )}

          {activeSubOption === '3' && (
            <Button size="small" type="primary" onClick={() => setModalTransferOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
              + Chuyển hàng
            </Button>
          )}

          {activeSubOption === '5' && (
            <Button size="small" type="primary" onClick={() => setModalCheckOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
              + Kiểm kho
            </Button>
          )}

          {activeSubOption === '6' && (
            <Button size="small" type="primary" onClick={() => setModalProductionOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
              + Sản xuất
            </Button>
          )}

          <Button
            size="small"
            onClick={() => message.info('Đã làm mới dữ liệu chứng từ.')}
            style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}
          >
            Làm mới
          </Button>

          <Button
            size="small"
            onClick={() => message.success('Đã xuất file dữ liệu chứng từ thành công!')}
            style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}
          >
            Xuất file
          </Button>
        </Space>
      </div>

      {/* DATA TABLE */}
      <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
        <Table
          dataSource={filteredDocuments}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
          scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
          size="small"
          columns={[
            {
              title: 'MÃ PHIẾU',
              dataIndex: 'code',
              render: (text) => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{text}</b>
            },
            {
              title: 'LOẠI PHIẾU',
              dataIndex: 'type',
              render: (typeVal) => {
                const cfg = DOC_TYPE_CONFIG[typeVal] || { label: 'Khác', color: 'default', icon: null };
                return <Tag color={cfg.color} style={{ fontSize: 9.5, padding: '0 3px', lineHeight: '16px' }}>{cfg.label}</Tag>;
              }
            },
            { title: 'CHI NHÁNH', dataIndex: 'branchName', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
            {
              title: 'NGÀY CHỨNG TỪ',
              dataIndex: 'businessDate',
              render: (date) => <span style={{ fontSize: 10 }}>{dayjs(date).format('DD/MM/YYYY HH:mm')}</span>
            },
            {
              title: 'GIÁ TRỊ (VNĐ)',
              dataIndex: 'totalAmount',
              align: 'right',
              render: (val) => <b style={{ fontSize: 10.5 }}>{val ? val.toLocaleString() : 0} đ</b>
            },
            {
              title: 'TRẠNG THÁI',
              dataIndex: 'status',
              render: (status, record) => {
                if (record.type === 3 && record.transferStatus === 'Pending') {
                  return <Tag color="warning" style={{ fontSize: 9.5, padding: '0 3px' }}>Chờ nhận kho</Tag>;
                }
                return <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Hoàn thành</Tag>;
              }
            },
            { title: 'NGƯỜI TẠO', dataIndex: 'creator', render: t => <span style={{ fontSize: 10, color: '#64748b' }}>{t}</span> },
            {
              title: 'THAO TÁC',
              key: 'action',
              align: 'center',
              render: (_, record) => (
                <Space size={2}>
                  {record.type === 3 && record.transferStatus === 'Pending' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined style={{ fontSize: 9.5 }} />}
                      style={{ fontSize: 9.5, height: 20, padding: '0 4px' }}
                      onClick={() => {
                        setSelectedTransferDoc(record);
                        setModalTransferReceiveOpen(true);
                      }}
                    >
                      Nhận
                    </Button>
                  )}
                  <Popconfirm
                    title="Xóa chứng từ?"
                    onConfirm={() => handleDeleteDocument(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button size="small" type="text" danger icon={<DeleteOutlined style={{ fontSize: 10 }} />} style={{ height: 20, padding: '0 4px' }} />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </div>
    </Card>
  );
};

export default DocumentsTable;
