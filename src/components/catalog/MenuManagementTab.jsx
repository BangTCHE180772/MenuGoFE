import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Space, Popconfirm, message, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import { getAllMenus, createMenu, updateMenu, deleteMenu } from '../../api/menuApi';

const MenuManagementTab = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [form] = Form.useForm();

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await getAllMenus();
      setMenus(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách Thực đơn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOpenModal = (menu = null) => {
    setEditingMenu(menu);
    form.resetFields();
    if (menu) {
      form.setFieldsValue({ id: menu.id, name: menu.name, description: menu.description });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteMenu(id);
      message.success('Xóa thực đơn thành công!');
      fetchMenus();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Không thể xóa thực đơn.');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingMenu) {
        await updateMenu({ ...values, id: editingMenu.id });
        message.success('Cập nhật thực đơn thành công!');
      } else {
        await createMenu(values);
        message.success('Tạo thực đơn thành công!');
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Tên Thực Đơn',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <BookOutlined style={{ color: '#1890ff' }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Số món ăn',
      dataIndex: 'menuProducts',
      key: 'count',
      render: (list) => <Tag color="blue">{list?.length || 0} sản phẩm</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Xóa thực đơn này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản lý Thực đơn (Menu)"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Tạo Thực đơn mới
        </Button>
      }
      style={{ borderRadius: 12 }}
    >
      <Table dataSource={menus} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />

      <Modal
        title={editingMenu ? 'Chỉnh sửa Thực đơn' : 'Tạo Thực đơn mới'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText={editingMenu ? 'Lưu' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên Thực đơn" rules={[{ required: true, message: 'Nhập tên thực đơn' }]}>
            <Input placeholder="Ví dụ: Thực đơn Sáng, Thực đơn Tiệc..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết thực đơn..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default MenuManagementTab;
