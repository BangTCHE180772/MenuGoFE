import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Select,
  Button,
  Table,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Tabs,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getLeftoverRecordsByBranch, deleteLeftoverRecord } from '../api/leftoverApi';
import { getCancelledHistory } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

const { Title } = Typography;

const HANDLING_ACTION_LABELS = {
  Discard: 'Huỷ',
  StaffUse: 'Nhân viên dùng',
  Reuse: 'Tái sử dụng',
};

const LeftoverPage = () => {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();
  const branchId = currentBranchId || user?.branchId;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState(undefined);

  // ── Lịch sử hủy món (đơn đã hoàn thành vs đơn chờ xác nhận) ──────────
  const [cancelledHistory, setCancelledHistory] = useState([]);
  const [cancelledLoading, setCancelledLoading] = useState(false);
  const [cancelledCategoryFilter, setCancelledCategoryFilter] = useState(undefined);

  const fetchCancelledHistory = useCallback(async () => {
    if (!branchId) return;
    setCancelledLoading(true);
    try {
      const res = await getCancelledHistory(branchId);
      setCancelledHistory(res.data || []);
    } catch {
      message.error('Không thể tải lịch sử hủy món.');
    } finally {
      setCancelledLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchCancelledHistory();
  }, [fetchCancelledHistory]);

  const fetchRecords = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await getLeftoverRecordsByBranch(branchId, filterType ? { type: filterType } : {});
      setRecords(res.data || []);
    } catch {
      message.error('Không thể tải danh sách món thừa.');
    } finally {
      setLoading(false);
    }
  }, [branchId, filterType]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id) => {
    try {
      await deleteLeftoverRecord(id);
      message.success('Đã xóa bản ghi');
      fetchRecords();
    } catch {
      message.error('Không thể xóa bản ghi.');
    }
  };

  const columns = [
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (t) => (t === 'Return' ? <Tag color="volcano">Khách trả món</Tag> : <Tag color="orange">Bếp làm dư</Tag>),
    },
    { title: 'Món', dataIndex: 'productName', key: 'productName' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', width: 60 },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason' },
    {
      title: 'Bàn / Xử lý',
      key: 'detail',
      render: (_, r) =>
        r.type === 'Return' ? (
          <Space direction="vertical" size={0}>
            {r.tableName && <span>Bàn: {r.tableName}</span>}
            {r.handlingAction && <Tag>{HANDLING_ACTION_LABELS[r.handlingAction] || r.handlingAction}</Tag>}
            {r.discountAmount ? (
              <span style={{ color: '#cf1322', fontSize: 12 }}>Giảm: {r.discountAmount.toLocaleString('vi-VN')}đ</span>
            ) : null}
            {r.usedAt && <Tag color="blue">Đã dùng lại</Tag>}
          </Space>
        ) : (
          <span>{r.shiftName || '—'}</span>
        ),
    },
    { title: 'Ngày', dataIndex: 'recordDate', key: 'recordDate' },
    { title: 'Người ghi', dataIndex: 'createdByName', key: 'createdByName' },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, r) => (
        <Popconfirm title="Xóa bản ghi này?" onConfirm={() => handleDelete(r.id)} okText="Đồng ý" cancelText="Hủy">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const cancelledColumns = [
    {
      title: 'Trạng thái khi huỷ',
      dataIndex: 'category',
      key: 'category',
      render: (c) =>
        c === 'Completed' ? (
          <Tag color="red">Món đã làm xong (bếp làm chậm)</Tag>
        ) : (
          <Tag color="default">Món chưa chế biến</Tag>
        ),
    },
    { title: 'Món', dataIndex: 'productName', key: 'productName' },
    { title: 'Bàn', dataIndex: 'tableName', key: 'tableName' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', width: 60 },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const filteredCancelledHistory = cancelledCategoryFilter
    ? cancelledHistory.filter((r) => r.category === cancelledCategoryFilter)
    : cancelledHistory;

  const completedCancelCount = cancelledHistory.filter((r) => r.category === 'Completed').length;

  const leftoverTab = (
    <>
      <Card
        title="Lịch sử món thừa"
        style={{ borderRadius: 12 }}
        extra={
          <Select
            allowClear
            placeholder="Lọc theo loại"
            style={{ width: 180 }}
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'Return', label: 'Khách trả món' },
              { value: 'Extra', label: 'Bếp làm dư' },
            ]}
          />
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </>
  );

  const cancelledHistoryTab = (
    <Card
      title="Lịch sử hủy món"
      style={{ borderRadius: 12 }}
      extra={
        <Select
          allowClear
          placeholder="Lọc theo trạng thái"
          style={{ width: 220 }}
          value={cancelledCategoryFilter}
          onChange={setCancelledCategoryFilter}
          options={[
            { value: 'Completed', label: 'Món đã làm xong' },
            { value: 'Pending', label: 'Món chưa chế biến' },
          ]}
        />
      }
    >
      {completedCancelCount > 0 && (
        <div style={{ marginBottom: 12, color: '#cf1322' }}>
          Bếp làm chậm (khách không nhận món đã hoàn thành): <strong>{completedCancelCount}</strong> lần
        </div>
      )}
      <Table
        rowKey="orderDetailId"
        columns={cancelledColumns}
        dataSource={filteredCancelledHistory}
        loading={cancelledLoading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <Title level={3}>Trả món &amp; Lịch sử huỷ món</Title>

      <Tabs
        defaultActiveKey="leftover"
        items={[
          { key: 'leftover', label: 'Món thừa', children: leftoverTab },
          { key: 'cancelled', label: 'Lịch sử hủy món', children: cancelledHistoryTab },
        ]}
      />
    </div>
  );
};

export default LeftoverPage;
