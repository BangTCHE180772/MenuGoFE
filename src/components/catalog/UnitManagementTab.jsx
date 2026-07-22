import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ColumnHeightOutlined } from '@ant-design/icons';
import { getAllUnits, createUnit, updateUnit, deleteUnit } from '../../api/unitApi';

const UnitManagementTab = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [form] = Form.useForm();

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await getAllUnits();
      setUnits(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách đơn vị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleOpenModal = (unit = null) => {
    setEditingUnit(unit);
    form.resetFields();
    if (unit) {
      form.setFieldsValue({ id: unit.id, name: unit.name });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteUnit(id);
      message.success('Xóa đơn vị thành công!');
      fetchUnits();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Không thể xóa đơn vị.');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUnit) {
        await updateUnit({ ...values, id: editingUnit.id });
        message.success('Cập nhật đơn vị thành công!');
      } else {
        await createUnit(values);
        message.success('Thêm mới đơn vị thành công!');
      }
      setIsModalOpen(false);
      fetchUnits();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Tên Đơn Vị Tính',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <ColumnHeightOutlined style={{ color: '#52c41a' }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Xóa đơn vị này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản lý Đơn vị Tính & Quy đổi"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm Đơn vị mới
        </Button>
      }
      style={{ borderRadius: 12 }}
    >
      <Table dataSource={units} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />

      <Modal
        title={editingUnit ? 'Chỉnh sửa Đơn vị' : 'Thêm Đơn vị mới'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText={editingUnit ? 'Lưu' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên Đơn vị Tính" rules={[{ required: true, message: 'Nhập tên đơn vị' }]}>
            <Input placeholder="Ví dụ: Ly, Dĩa, Kg, Lon, Chai, Hộp..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UnitManagementTab;
