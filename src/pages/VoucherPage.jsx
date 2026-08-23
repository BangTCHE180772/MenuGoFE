import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, Select, 
  InputNumber, DatePicker, message, Tag, Switch 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllVouchers, deleteVoucher } from '../api/voucherApi';
import { getAllBranches } from '../api/branchApi';
import VoucherCreateModal from '../components/voucher/VoucherCreateModal';
import VoucherEditModal from '../components/voucher/VoucherEditModal';

const { Option } = Select;

const VoucherPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);



  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await getAllVouchers();
      setVouchers(data);
    } catch (error) {
      message.error('Lỗi tải danh sách Khuyến mãi');
    }
    setLoading(false);
  };

  const fetchBranches = async () => {
    try {
      const res = await getAllBranches();
      setBranches(res.data || res);
    } catch (error) {
      console.error('Lỗi tải chi nhánh:', error);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchBranches();
  }, []);

  const showModal = (record = null) => {
    if (record) {
      setEditingVoucher(record);
      setIsEditModalVisible(true);
    } else {
      setIsCreateModalVisible(true);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xóa Khuyến mãi',
      content: 'Bạn có chắc chắn muốn xóa khuyến mãi này không?',
      onOk: async () => {
        try {
          await deleteVoucher(id);
          message.success('Xóa thành công');
          fetchVouchers();
        } catch (error) {
          message.error('Xóa thất bại');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Mã Voucher',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Tên CTKM',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Giá trị giảm',
      key: 'discount',
      render: (_, record) => {
        if (record.discountType === 'Fixed') {
          return `${record.discountValue.toLocaleString()} đ`;
        }
        return `${record.discountValue}% (Tối đa ${record.maxDiscount.toLocaleString()} đ)`;
      }
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'minOrderValue',
      render: (val) => `${val.toLocaleString()} đ`
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'branchName',
      render: (val) => val || 'Toàn hệ thống'
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => (
        <span style={{fontSize: 12}}>
          {dayjs(record.startDate).format('DD/MM/YYYY')} - {dayjs(record.endDate).format('DD/MM/YYYY')}
        </span>
      )
    },
    {
      title: 'SL',
      key: 'quantity',
      render: (_, record) => `${record.usedCount} / ${record.quantity}`
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Hoạt động' : 'Đã khóa'}</Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Quản lý Khuyến mãi & Voucher</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Tạo Khuyến mãi mới
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={vouchers} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <VoucherCreateModal 
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={fetchVouchers}
        branches={branches}
      />

      <VoucherEditModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={fetchVouchers}
        branches={branches}
        editingVoucher={editingVoucher}
      />
    </div>
  );
};

export default VoucherPage;
