import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllGroups, createGroup, updateGroup, deleteGroup } from '../../api/groupApi';

const GroupManagementTab = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await getAllGroups();
      setGroups(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách nhóm sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenModal = (group = null) => {
    setEditingGroup(group);
    form.resetFields();
    if (group) {
      form.setFieldsValue({ id: group.id, name: group.name, description: group.description });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteGroup(id);
      message.success('Xóa nhóm thành công!');
      fetchGroups();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Không thể xóa nhóm sản phẩm.');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingGroup) {
        await updateGroup({ ...values, id: editingGroup.id });
        message.success('Cập nhật nhóm thành công!');
      } else {
        await createGroup(values);
        message.success('Thêm nhóm thành công!');
      }
      setIsModalOpen(false);
      fetchGroups();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên Nhóm', dataIndex: 'name', key: 'name', render: (text) => <strong>{text}</strong> },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Xóa nhóm này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản lý Nhóm Sản phẩm (Group)"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm Nhóm mới
        </Button>
      }
      style={{ borderRadius: 12 }}
    >
      <Table dataSource={groups} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />

      <Modal
        title={editingGroup ? 'Chỉnh sửa Nhóm' : 'Thêm Nhóm sản phẩm mới'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText={editingGroup ? 'Lưu' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên Nhóm" rules={[{ required: true, message: 'Nhập tên nhóm' }]}>
            <Input placeholder="Ví dụ: Đồ uống, Khai vị..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết nhóm..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default GroupManagementTab;
