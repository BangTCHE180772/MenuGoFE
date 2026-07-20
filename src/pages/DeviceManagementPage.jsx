import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Tag, Select, Popconfirm, Spin } from 'antd';
import { getDevicesByBranch, deleteDevice, revokeDevice } from '../api/deviceApi';
import { getAllBranches } from '../api/branchApi';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

import { Link } from 'react-router-dom';

const DeviceManagementPage = () => {
  const [devices, setDevices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await getAllBranches();
        const allBranches = res.data;
        let availableBranches = allBranches;
        const isAdminOrOwner = user?.roles?.some(r => r === 'Admin' || r === 'Owner');
        if (!isAdminOrOwner && user?.branchIds && user.branchIds.length > 0) {
          availableBranches = allBranches.filter(b => user.branchIds.includes(b.id));
        }
        setBranches(availableBranches);
        if (availableBranches.length > 0) {
          setSelectedBranch(availableBranches[0].id);
        }
      } catch (err) {
        message.error('Lỗi khi tải chi nhánh');
      }
    };
    fetchBranches();
  }, [user]);

  useEffect(() => {
    if (selectedBranch) {
      loadDevices();
    }
  }, [selectedBranch]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await getDevicesByBranch(selectedBranch);
      setDevices(res.data);
    } catch (err) {
      message.error('Lỗi khi tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeDevice(id);
      message.success('Đã thu hồi quyền thiết bị thành công');
      loadDevices();
    } catch (err) {
      message.error('Lỗi khi thu hồi thiết bị');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDevice(id);
      message.success('Đã xóa thiết bị thành công');
      loadDevices();
    } catch (err) {
      message.error('Lỗi khi xóa thiết bị');
    }
  };

  const columns = [
    { title: 'Tên thiết bị', dataIndex: 'name', key: 'name' },
    { 
      title: 'Loại', 
      dataIndex: 'deviceType', 
      key: 'deviceType',
      render: (type) => {
        const colors = { POS: 'blue', Waiter: 'green', Kitchen: 'orange', Attendance: 'purple' };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => isActive ? <Tag color="success">Hoạt động</Tag> : <Tag color="error">Đã thu hồi</Tag>
    },
    { 
      title: 'Hoạt động cuối', 
      dataIndex: 'lastActiveAt', 
      key: 'lastActiveAt',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Chưa hoạt động'
    },
    { 
      title: 'Ngày tạo', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : ''
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.isActive && (
            <Popconfirm title="Thu hồi quyền của thiết bị này?" onConfirm={() => handleRevoke(record.id)}>
              <Button size="small" type="primary" danger>Thu hồi</Button>
            </Popconfirm>
          )}
          <Popconfirm title="Xóa thiết bị này khỏi hệ thống?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Quản Lý Thiết Bị</h2>
        <Space>
          <Select 
            value={selectedBranch}
            onChange={setSelectedBranch}
            style={{ width: 200 }}
            placeholder="Chọn chi nhánh"
          >
            {branches.map(b => (
              <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
            ))}
          </Select>
          <Link to="/device-setup">
            <Button type="primary">Thiết lập thiết bị này</Button>
          </Link>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={devices} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default DeviceManagementPage;
