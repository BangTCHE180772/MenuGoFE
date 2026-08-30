import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  Checkbox,
  Radio,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Space,
  Tooltip,
} from 'antd';
import {
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  EditOutlined,
  ClockCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getBranchShiftFeedbacks, processShiftFeedback } from '../api/shiftFeedbackApi';
import { getAllBranches } from '../api/branchApi';
import { useAuth } from '../context/AuthContext';

const formatOtStatus = (status) => {
  switch (status) {
    case 'Approved':
      return 'Đã duyệt';
    case 'Pending':
      return 'Chờ duyệt';
    case 'Rejected':
      return 'Từ chối';
    case 'None':
    default:
      return 'Không có';
  }
};

const ShiftFeedbackPage = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || null);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Process Modal State
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [processForm] = Form.useForm();
  const updateOTWatch = Form.useWatch('updateOT', processForm);

  const loadBranches = useCallback(async () => {
    try {
      const res = await getAllBranches();
      const branchData = res.data || [];
      setBranches(branchData);
      if (!selectedBranchId && branchData.length > 0) {
        setSelectedBranchId(branchData[0].id);
      }
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách chi nhánh!');
    }
  }, [selectedBranchId]);

  const loadFeedbacks = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const statusParam = selectedStatus === 'ALL' ? undefined : selectedStatus;
      const res = await getBranchShiftFeedbacks(selectedBranchId, statusParam);
      setFeedbacks(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách phản hồi ca!');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, selectedStatus]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const handleOpenProcessModal = (record) => {
    setSelectedFeedback(record);
    processForm.resetFields();
    processForm.setFieldsValue({
      status: 'Resolved',
      responseMessage: 'Đã kiểm tra và cập nhật lại ca làm việc.',
      updateOT: record.feedbackType === 'OTDispute' || record.feedbackType === 'HoursDispute',
      approvedOTHours: record.approvedOTHours || 0,
      otStatus: 'Approved',
      otNotes: 'Cập nhật theo phản hồi ca làm việc',
    });
    setProcessModalOpen(true);
  };

  const handleProcessSubmit = async (values) => {
    if (!selectedFeedback) return;
    setProcessLoading(true);
    try {
      const payload = {
        status: values.status,
        responseMessage: values.responseMessage,
        updateOT: !!values.updateOT,
        approvedOTHours: values.updateOT ? values.approvedOTHours : undefined,
        otStatus: values.updateOT ? values.otStatus : undefined,
        otNotes: values.updateOT ? values.otNotes : undefined,
      };

      await processShiftFeedback(selectedFeedback.id, payload);
      message.success('🟢 Đã xử lý phản hồi thành công!');
      setProcessModalOpen(false);
      loadFeedbacks();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi xử lý phản hồi!';
      message.error(errMsg);
    } finally {
      setProcessLoading(false);
    }
  };

  const getStatusTag = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'RESOLVED':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã giải quyết</Tag>;
      case 'REJECTED':
        return <Tag icon={<CloseCircleOutlined />} color="error">Từ chối</Tag>;
      case 'PENDING':
      default:
        return <Tag icon={<SyncOutlined spin />} color="warning">Chờ xử lý</Tag>;
    }
  };

  const getFeedbackTypeTag = (type) => {
    switch (type) {
      case 'OTDispute':
        return <Tag color="volcano">Quản lý duyệt sai OT</Tag>;
      case 'HoursDispute':
        return <Tag color="purple">Sai tổng giờ công</Tag>;
      case 'AttendanceDispute':
        return <Tag color="orange">Nhầm điểm danh</Tag>;
      default:
        return <Tag color="blue">Khác</Tag>;
    }
  };

  // Stats calculation
  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter((f) => f.status === 'Pending').length;
  const resolvedCount = feedbacks.filter((f) => f.status === 'Resolved').length;
  const rejectedCount = feedbacks.filter((f) => f.status === 'Rejected').length;

  const columns = [
    {
      title: 'Mã & Nhân viên',
      key: 'employee',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1e293b' }}>{record.employeeName}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Mã NV: {record.employeeCode}</div>
        </div>
      ),
    },
    {
      title: 'Thông tin ca làm',
      key: 'shift',
      width: 220,
      render: (_, record) => (
        <div style={{ fontSize: '13px' }}>
          <div>📅 Ngày: <strong>{dayjs(record.workDate).format('DD/MM/YYYY')}</strong></div>
          <div>🕒 Ca: <strong>{record.shiftName}</strong> ({record.shiftTime})</div>
          {record.checkInAt && (
            <div style={{ fontSize: '11px', color: '#16a34a' }}>
              Vào: {dayjs(record.checkInAt).format('HH:mm')} | Ra: {record.checkOutAt ? dayjs(record.checkOutAt).format('HH:mm') : '—'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Giờ công & OT ca này',
      key: 'ot',
      width: 170,
      render: (_, record) => (
        <div style={{ fontSize: '13px' }}>
          <div>Giờ thực tế: <strong>{record.actualHours !== null ? `${record.actualHours}h` : '—'}</strong></div>
          <div>
            OT hiện tại:{' '}
            <Tag color={record.approvedOTHours > 0 ? 'orange' : 'default'} style={{ fontSize: '11px' }}>
              {record.approvedOTHours || 0}h ({formatOtStatus(record.otStatus)})
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Nội dung phản hồi',
      key: 'content',
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            {getFeedbackTypeTag(record.feedbackType)}
            <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{record.title}</strong>
          </div>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#334155',
            }}
          >
            {record.content}
          </div>
          {record.responseMessage && (
            <div
              style={{
                marginTop: '6px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#166534',
              }}
            >
              <strong>💬 Trả lời ({record.resolverName}):</strong> {record.responseMessage}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <div>
          {getStatusTag(record.status)}
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {dayjs(record.createdAt).format('HH:mm DD/MM')}
          </div>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          style={{
            background: record.status === 'Pending' ? '#f97316' : '#0284c7',
            borderColor: record.status === 'Pending' ? '#f97316' : '#0284c7',
            fontWeight: '600',
            borderRadius: '6px',
          }}
          onClick={() => handleOpenProcessModal(record)}
        >
          {record.status === 'Pending' ? 'Xử lý' : 'Xem / Sửa'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Title Card */}
      <Card
        style={{
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #132238 0%, #1e293b 100%)',
          borderRadius: '12px',
          color: '#fff',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageOutlined style={{ fontSize: '28px', color: '#f97316' }} />
            <div>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '700' }}>
                QUẢN LÝ PHẢN HỒI CA LÀM VIỆC & DUYỆT OT
              </h2>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                Xử lý khiếu nại của nhân viên về kết quả ca làm, giờ công và thời gian duyệt OT.
              </div>
            </div>
          </div>

          <Space size="middle">
            <Select
              style={{ width: 220 }}
              placeholder="Chọn chi nhánh"
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadFeedbacks}
              loading={loading}
              style={{ background: '#f97316', borderColor: '#f97316', fontWeight: 'bold' }}
            >
              Làm mới
            </Button>
          </Space>
        </div>
      </Card>

      {/* Stats Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={12} sm={6}>
          <Card bodyStyle={{ padding: '16px' }} style={{ borderRadius: '10px' }}>
            <Statistic title="Tổng số phản hồi" value={totalCount} valueStyle={{ color: '#0f172a', fontWeight: '700' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bodyStyle={{ padding: '16px' }} style={{ borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
            <Statistic title="Chờ xử lý" value={pendingCount} valueStyle={{ color: '#d97706', fontWeight: '700' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bodyStyle={{ padding: '16px' }} style={{ borderRadius: '10px', borderLeft: '4px solid #22c55e' }}>
            <Statistic title="Đã giải quyết" value={resolvedCount} valueStyle={{ color: '#16a34a', fontWeight: '700' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bodyStyle={{ padding: '16px' }} style={{ borderRadius: '10px', borderLeft: '4px solid #ef4444' }}>
            <Statistic title="Đã từ chối" value={rejectedCount} valueStyle={{ color: '#dc2626', fontWeight: '700' }} />
          </Card>
        </Col>
      </Row>

      {/* Table Card */}
      <Card
        style={{ borderRadius: '12px' }}
        bodyStyle={{ padding: '16px' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>Danh sách phản hồi ca</span>
            <Radio.Group
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="ALL">Tất cả</Radio.Button>
              <Radio.Button value="Pending">Chờ xử lý ({pendingCount})</Radio.Button>
              <Radio.Button value="Resolved">Đã giải quyết</Radio.Button>
              <Radio.Button value="Rejected">Đã từ chối</Radio.Button>
            </Radio.Group>
          </div>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={feedbacks}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Chưa có phản hồi nào trong chi nhánh này.' }}
          />
        </Spin>
      </Card>

      {/* Process Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f97316', fontSize: '18px' }}>
            <EditOutlined />
            <span>XỬ LÝ PHẢN HỒI CA LÀM VIỆC</span>
          </div>
        }
        open={processModalOpen}
        onCancel={() => setProcessModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {selectedFeedback && (
          <div style={{ marginTop: '12px' }}>
            {/* Feedback Detail Summary Box */}
            <div
              style={{
                background: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: '700', color: '#ea580c', marginBottom: '4px' }}>
                Thông tin phản hồi từ: {selectedFeedback.employeeName} ({selectedFeedback.employeeCode})
              </div>
              <div>📅 <strong>Ngày ca:</strong> {dayjs(selectedFeedback.workDate).format('DD/MM/YYYY')} | <strong>Ca:</strong> {selectedFeedback.shiftName} ({selectedFeedback.shiftTime})</div>
              <div>⏱ <strong>Giờ làm thực tế:</strong> {selectedFeedback.actualHours !== null ? `${selectedFeedback.actualHours}h` : '—'}</div>
              <div>
                🔸 <strong>OT hiện tại:</strong> {selectedFeedback.approvedOTHours || 0} giờ ({formatOtStatus(selectedFeedback.otStatus)})
              </div>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #fdba74' }}>
                <strong>Vấn đề phản hồi:</strong> <span style={{ color: '#c2410c', fontWeight: '600' }}>{selectedFeedback.title}</span>
                <div style={{ fontStyle: 'italic', color: '#475569', marginTop: '2px' }}>"{selectedFeedback.content}"</div>
              </div>
            </div>

            <Form form={processForm} layout="vertical" onFinish={handleProcessSubmit}>
              <Form.Item
                name="status"
                label={<span style={{ fontWeight: '600' }}>Quyết định xử lý:</span>}
                rules={[{ required: true, message: 'Vui lòng chọn quyết định!' }]}
              >
                <Radio.Group buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
                  <Radio.Button value="Resolved" style={{ flex: 1, textAlign: 'center', background: '#f0fdf4' }}>
                    🟢 Chấp nhận (Đã giải quyết)
                  </Radio.Button>
                  <Radio.Button value="Rejected" style={{ flex: 1, textAlign: 'center', background: '#fef2f2' }}>
                    🔴 Từ chối phản hồi
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="updateOT" valuePropName="checked">
                <Checkbox style={{ fontWeight: '600', color: '#ea580c' }}>
                  ⚡ Cập nhật lại số giờ OT cho ca làm việc này ngay lập tức
                </Checkbox>
              </Form.Item>

              {updateOTWatch && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                  }}
                >
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name="approvedOTHours"
                        label={<span style={{ fontWeight: '600' }}>Số giờ OT mới:</span>}
                        rules={[{ required: true, message: 'Nhập số giờ OT' }]}
                      >
                        <InputNumber min={0} max={24} step={0.5} style={{ width: '100%' }} suffix="giờ" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="otStatus"
                        label={<span style={{ fontWeight: '600' }}>Trạng thái OT:</span>}
                        rules={[{ required: true, message: 'Chọn trạng thái OT' }]}
                      >
                        <Select
                          options={[
                            { value: 'Approved', label: 'Đã duyệt' },
                            { value: 'Pending', label: 'Chờ duyệt' },
                            { value: 'Rejected', label: 'Từ chối OT' },
                            { value: 'None', label: 'Không có OT' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="otNotes" label={<span style={{ fontWeight: '600' }}>Ghi chú OT:</span>} style={{ marginBottom: 0 }}>
                    <Input placeholder="Nhập ghi chú điều chỉnh OT..." />
                  </Form.Item>
                </div>
              )}

              <Form.Item
                name="responseMessage"
                label={<span style={{ fontWeight: '600' }}>Lời nhắn trả lời nhân viên:</span>}
                rules={[{ required: true, message: 'Vui lòng nhập lời nhắn cho nhân viên!' }]}
              >
                <Input.TextArea rows={3} placeholder="Nhập câu trả lời cụ thể cho nhân viên..." />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <Button onClick={() => setProcessModalOpen(false)}>Hủy</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={processLoading}
                  style={{ background: '#f97316', borderColor: '#f97316', fontWeight: 'bold' }}
                >
                  Xác nhận & Gửi kết quả
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ShiftFeedbackPage;
