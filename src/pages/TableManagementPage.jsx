import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Button, List, Typography, Space, Modal,
  Form, Input, Switch, Select, message, Spin, Popconfirm, Empty
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  AppstoreOutlined, TableOutlined
} from '@ant-design/icons';

import { useAuth, ROLES } from '../context/AuthContext';
import { getAllBranches } from '../api/branchApi';
import {
  getAreasByBranchId, getTablesByAreaId,
  createArea, updateArea, deleteArea
} from '../api/areaApi';
import { createTable, updateTable, deleteTable } from '../api/tableApi';

const { Title, Text } = Typography;
const { Option } = Select;

const TableManagementPage = () => {
  const { user, role } = useAuth();

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [loadingAreas, setLoadingAreas] = useState(false);

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const [isAreaModalVisible, setIsAreaModalVisible] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [areaForm] = Form.useForm();

  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm] = Form.useForm();

  useEffect(() => {
    if (role === ROLES.ADMIN || role === ROLES.OWNER) {
      fetchBranches();
    } else if (role === ROLES.MANAGER) {
      setSelectedBranch(user.branchId);
    }
  }, [role, user]);

  useEffect(() => {
    if (selectedBranch) {
      fetchAreas(selectedBranch);
      setSelectedArea(null);
      setTables([]);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedArea) {
      fetchTables(selectedArea.id);
    }
  }, [selectedArea]);

  const fetchBranches = async () => {
    try {
      const res = await getAllBranches();
      setBranches(res.data);
      if (res.data.length > 0 && !selectedBranch) {
        setSelectedBranch(res.data[0].id);
      }
    } catch (err) {
      message.error('Lỗi khi tải danh sách chi nhánh');
    }
  };

  const fetchAreas = async (branchId) => {
    setLoadingAreas(true);
    try {
      const res = await getAreasByBranchId(branchId);
      setAreas(res.data || []);
    } catch (err) {
      message.error('Lỗi khi tải khu vực');
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchTables = async (areaId) => {
    setLoadingTables(true);
    try {
      const res = await getTablesByAreaId(areaId);
      setTables(res.data || []);
    } catch (err) {
      message.error('Lỗi khi tải bàn');
    } finally {
      setLoadingTables(false);
    }
  };

  const openAreaModal = (area = null) => {
    setEditingArea(area);
    if (area) {
      areaForm.setFieldsValue({
        name: area.name,
        isActive: area.isActive,
        status: area.status || 'Active'
      });
    } else {
      areaForm.resetFields();
      areaForm.setFieldsValue({ isActive: true, status: 'Active' });
    }
    setIsAreaModalVisible(true);
  };

  const handleSaveArea = async (values) => {
    try {
      if (editingArea) {
        await updateArea({ ...editingArea, ...values });
        message.success('Cập nhật khu vực thành công');
      } else {
        await createArea({ ...values, branchId: selectedBranch });
        message.success('Thêm khu vực thành công');
      }
      setIsAreaModalVisible(false);
      fetchAreas(selectedBranch);
    } catch (err) {
      message.error('Lỗi khi lưu khu vực');
    }
  };

  const handleDeleteArea = async (id) => {
    try {
      await deleteArea(id);
      message.success('Xoá khu vực thành công');
      if (selectedArea?.id === id) {
        setSelectedArea(null);
        setTables([]);
      }
      fetchAreas(selectedBranch);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể xoá khu vực này. Có thể khu vực đang chứa bàn.');
    }
  };

  const openTableModal = (table = null) => {
    setEditingTable(table);
    if (table) {
      tableForm.setFieldsValue({
        name: table.name,
        isActive: table.isActive,
        status: table.status || 'Empty'
      });
    } else {
      tableForm.resetFields();
      tableForm.setFieldsValue({ isActive: true, status: 'Empty' });
    }
    setIsTableModalVisible(true);
  };

  const handleSaveTable = async (values) => {
    try {
      if (editingTable) {
        await updateTable({ ...editingTable, ...values });
        message.success('Cập nhật bàn thành công');
      } else {
        await createTable({ ...values, areaId: selectedArea.id });
        message.success('Thêm bàn thành công');
      }
      setIsTableModalVisible(false);
      fetchTables(selectedArea.id);
    } catch (err) {
      message.error('Lỗi khi lưu bàn');
    }
  };

  const handleDeleteTable = async (id) => {
    try {
      await deleteTable(id);
      message.success('Xoá bàn thành công');
      fetchTables(selectedArea.id);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể xoá bàn này. Có thể bàn đang có đơn hàng.');
    }
  };

  return (
    <div className="table-management-page" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>Quản Lý Bàn & Khu Vực</Title>

        {(role === ROLES.ADMIN || role === ROLES.OWNER) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong>Chi nhánh:</Text>
            <Select
              style={{ width: 200 }}
              value={selectedBranch}
              onChange={(val) => setSelectedBranch(val)}
              placeholder="Chọn chi nhánh"
            >
              {branches.map(b => (
                <Option key={b.id} value={b.id}>{b.name}</Option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {!selectedBranch ? (
        <Card>
          <Empty description="Vui lòng chọn chi nhánh" />
        </Card>
      ) : (
        <Row gutter={24}>
          {/* AREAS COLUMN */}
          <Col xs={24} md={8}>
            <Card
              title={<><AppstoreOutlined /> Khu Vực</>}
              extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openAreaModal()} size="small">Thêm</Button>}
              style={{ height: '100%' }}
            >
              <Spin spinning={loadingAreas}>
                <List
                  dataSource={areas}
                  locale={{ emptyText: 'Chưa có khu vực nào' }}
                  renderItem={item => (
                    <List.Item
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedArea?.id === item.id ? '#e6f4ff' : 'transparent',
                        padding: '12px',
                        borderBottom: '1px solid #f0f0f0',
                        borderRadius: selectedArea?.id === item.id ? '8px' : '0'
                      }}
                      onClick={() => setSelectedArea(item)}
                      actions={[
                        <Button type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openAreaModal(item); }} />,
                        <Popconfirm
                          title="Bạn có chắc muốn xoá?"
                          onConfirm={(e) => { e.stopPropagation(); handleDeleteArea(item.id); }}
                          onCancel={(e) => e.stopPropagation()}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        title={<Text strong={selectedArea?.id === item.id}>{item.name}</Text>}
                        description={
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Trạng thái: {item.isActive ? 'Hoạt động' : 'Đang tắt'}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Spin>
            </Card>
          </Col>

          {/* TABLES COLUMN */}
          <Col xs={24} md={16}>
            <Card
              title={<><TableOutlined /> Danh Sách Bàn {selectedArea ? `- ${selectedArea.name}` : ''}</>}
              extra={
                selectedArea &&
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openTableModal()} size="small">Thêm Bàn</Button>
              }
              style={{ height: '100%' }}
            >
              {!selectedArea ? (
                <Empty description="Vui lòng chọn một khu vực ở cột bên trái" style={{ margin: '40px 0' }} />
              ) : (
                <Spin spinning={loadingTables}>
                  <Row gutter={[16, 16]}>
                    {tables.map(table => (
                      <Col xs={12} sm={8} md={6} lg={6} key={table.id}>
                        <Card
                          size="small"
                          hoverable
                          style={{ textAlign: 'center', borderColor: table.isActive ? '#d9d9d9' : '#ffccc7' }}
                          actions={[
                            <EditOutlined key="edit" onClick={() => openTableModal(table)} />,
                            <Popconfirm
                              title="Chắc chắn xoá?"
                              onConfirm={() => handleDeleteTable(table.id)}
                            >
                              <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
                            </Popconfirm>
                          ]}
                        >
                          <Title level={4} style={{ margin: '8px 0', color: table.isActive ? 'inherit' : '#bfbfbf' }}>
                            {table.name}
                          </Title>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {table.status || 'Empty'}
                          </Text>
                        </Card>
                      </Col>
                    ))}
                    {tables.length === 0 && (
                      <Col span={24}>
                        <Empty description="Khu vực này chưa có bàn nào" />
                      </Col>
                    )}
                  </Row>
                </Spin>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* MODAL AREA */}
      <Modal
        title={editingArea ? 'Cập nhật khu vực' : 'Thêm khu vực mới'}
        open={isAreaModalVisible}
        onCancel={() => setIsAreaModalVisible(false)}
        onOk={() => areaForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={areaForm} layout="vertical" onFinish={handleSaveArea}>
          <Form.Item name="name" label="Tên khu vực" rules={[{ required: true, message: 'Vui lòng nhập tên khu vực' }]}>
            <Input placeholder="VD: Tầng 1, Sân vườn..." />
          </Form.Item>
          <Form.Item name="status" label="Tình trạng">
            <Input placeholder="VD: Active" />
          </Form.Item>
          <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL TABLE */}
      <Modal
        title={editingTable ? 'Cập nhật bàn' : 'Thêm bàn mới'}
        open={isTableModalVisible}
        onCancel={() => setIsTableModalVisible(false)}
        onOk={() => tableForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={tableForm} layout="vertical" onFinish={handleSaveTable}>
          <Form.Item name="name" label="Tên bàn" rules={[{ required: true, message: 'Vui lòng nhập tên bàn' }]}>
            <Input placeholder="VD: Bàn 01, VIP 1..." />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái hiện tại" rules={[{ required: true }]}>
            <Select>
              <Option value="Empty">Trống (Empty)</Option>
              <Option value="Reserved">Đã đặt (Reserved)</Option>
              <Option value="Occupied">Có khách (Occupied)</Option>
              <Option value="Cleaning">Đang dọn (Cleaning)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TableManagementPage;
