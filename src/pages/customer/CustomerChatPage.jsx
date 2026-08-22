import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Input, Button, Card, Avatar, List, Badge, Modal, Form, Select, Spin, Typography, Space, message } from 'antd';
import { MessageOutlined, SendOutlined, ArrowLeftOutlined, ShopOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useSignalR } from '../../context/SignalRContext';
import { getAllBranches } from '../../api/branchApi';
import { getCustomerConversations, getCustomerConversationDetails, openCustomerConversation, sendCustomerChatMessage } from '../../api/customerPortalApi';
import dayjs from 'dayjs';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const CustomerChatPage = () => {
  const { customer } = useCustomerAuth();
  const connection = useSignalR();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [branches, setBranches] = useState([]);
  const [inputText, setInputText] = useState('');
  
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [submittingNewChat, setSubmittingNewChat] = useState(false);

  const messagesEndRef = useRef(null);
  const [form] = Form.useForm();

  // Fetch conversations list
  const fetchConversations = async (selectId = null) => {
    setLoadingList(true);
    try {
      const res = await getCustomerConversations();
      setConversations(res.data);
      if (res.data.length > 0 && !activeConvId && !selectId) {
        // Auto select first conversation
        handleSelectConversation(res.data[0].id);
      } else if (selectId) {
        handleSelectConversation(selectId);
      }
    } catch (error) {
      message.error('Không thể tải danh sách cuộc trò chuyện');
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch branches for new conversation selection
  const fetchBranches = async () => {
    try {
      const res = await getAllBranches();
      setBranches(res.data.filter(b => !b.isDeleted && b.status !== "Ngừng kinh doanh"));
    } catch (error) {
      message.error('Không thể tải danh sách chi nhánh');
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchBranches();
  }, []);

  // Real-time listener via SignalR
  useEffect(() => {
    if (connection && customer) {
      // Join customer real-time notification group
      connection.invoke('JoinCustomerGroup', customer.id)
        .catch(err => console.warn('JoinCustomerGroup SignalR error:', err));

      const handleNewMessage = (msg) => {
        // If it's for the currently open conversation, append it
        if (msg.conversationId === activeConvId) {
          // Prevent duplicates if already present
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
        }
        // Refresh conversation list to show last messages / status updates
        fetchConversations(activeConvId);
      };

      const handleAssigned = (update) => {
        if (update.id === activeConvId) {
          // Re-fetch details to show assignee changes
          fetchMessages(activeConvId);
        }
        fetchConversations(activeConvId);
      };

      connection.on('ReceiveNewMessage', handleNewMessage);
      connection.on('ConversationAssigned', handleAssigned);

      return () => {
        connection.off('ReceiveNewMessage', handleNewMessage);
        connection.off('ConversationAssigned', handleAssigned);
      };
    }
  }, [connection, activeConvId, customer]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchMessages = async (convId) => {
    setLoadingDetail(true);
    try {
      const res = await getCustomerConversationDetails(convId);
      setMessages(res.data.messages);
      scrollToBottom();
    } catch (error) {
      message.error('Không thể tải nội dung tin nhắn');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectConversation = (id) => {
    setActiveConvId(id);
    fetchMessages(id);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await sendCustomerChatMessage(activeConvId, textToSend);
      // Append locally to prevent latency gap
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      scrollToBottom();
      fetchConversations(activeConvId);
    } catch (error) {
      message.error('Gửi tin nhắn thất bại');
      setInputText(textToSend); // Restore text on failure
    }
  };

  const handleCreateNewChat = async (values) => {
    setSubmittingNewChat(true);
    try {
      const res = await openCustomerConversation({
        branchId: values.branchId,
        topic: values.topic,
        subject: values.subject || null,
        preferredContactMethod: 'Chat',
        firstMessageContent: values.firstMessage
      });
      
      message.success('Đã gửi yêu cầu tư vấn thành công!');
      setNewChatModalOpen(false);
      form.resetFields();
      
      // Refresh list and select the new conversation
      await fetchConversations(res.data.conversationId);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo cuộc trò chuyện mới');
    } finally {
      setSubmittingNewChat(false);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConvId);

  return (
    <div
      style={{
        background: '#f8fafc',
        minHeight: '100vh',
        padding: '24px',
        fontFamily: "'Be Vietnam Pro', sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 48px)'
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fff'
          }}
        >
          <Space size="middle">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/customer/dashboard')}
              style={{ fontWeight: 600 }}
            />
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Hộp Thư Tư Vấn Khách Hàng
            </Title>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setNewChatModalOpen(true)}
            style={{ background: '#ea580c', borderColor: '#ea580c', fontWeight: 600 }}
          >
            Yêu cầu tư vấn mới
          </Button>
        </div>

        {/* Chat Area Layout */}
        <Layout style={{ background: '#fff', flex: 1, overflow: 'hidden' }}>
          {/* Threads list (Sider) */}
          <Sider
            width={320}
            theme="light"
            style={{ borderRight: '1px solid #f1f5f9', background: '#fff' }}
          >
            {loadingList ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : (
              <List
                style={{ height: '100%', overflowY: 'auto', padding: '8px 0' }}
                dataSource={conversations}
                renderItem={item => (
                  <List.Item
                    onClick={() => handleSelectConversation(item.id)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: item.id === activeConvId ? '#fff7ed' : 'transparent',
                      borderLeft: item.id === activeConvId ? '4px solid #ea580c' : '4px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    className="chat-thread-item"
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<ShopOutlined />} style={{ background: '#ffedd5', color: '#ea580c' }} />}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: item.id === activeConvId ? 700 : 600, color: '#1e293b' }}>
                            {item.branchName}
                          </span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            {dayjs(item.updatedAt).format('HH:mm')}
                          </span>
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 13, maxWidth: 200 }}>
                            Chủ đề: {item.topic === 'Booking' ? 'Đặt bàn' : item.topic === 'Menu' ? 'Thực đơn' : item.topic === 'Event' ? 'Sự kiện' : 'Hỗ trợ chung'}
                          </Text>
                          {item.unreadCount > 0 && (
                            <Badge count={item.unreadCount} style={{ backgroundColor: '#ef4444', marginTop: 4 }} />
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Chưa có cuộc trò chuyện nào</div> }}
              />
            )}
          </Sider>

          {/* Main Message Panel */}
          <Layout style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {activeConvId ? (
              <>
                {/* Active chat header */}
                <div
                  style={{
                    padding: '12px 24px',
                    background: '#fff',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', display: 'block' }}>
                      MenuGo - Chi nhánh {activeConversation?.branchName}
                    </span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Trạng thái vé: {activeConversation?.status === 'Open' ? 'Đang mở' : activeConversation?.status === 'Assigned' ? 'Đã phân công nhân viên' : 'Đã đóng'}
                    </Text>
                  </div>
                </div>

                {/* Messages Display Area */}
                <Content
                  style={{
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}
                >
                  {loadingDetail ? (
                    <div style={{ textAlign: 'center', margin: 'auto' }}><Spin size="large" /></div>
                  ) : (
                    <>
                      {messages.map((msg, index) => {
                        const isMine = msg.customerId !== null; // Sent by customer
                        return (
                          <div
                            key={msg.id || index}
                            style={{
                              display: 'flex',
                              justifyContent: isMine ? 'flex-end' : 'flex-start',
                              width: '100%'
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '70%',
                                background: isMine ? '#ea580c' : '#fff',
                                color: isMine ? '#fff' : '#1e293b',
                                borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                padding: '10px 16px',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                border: isMine ? 'none' : '1px solid #e2e8f0',
                                position: 'relative'
                              }}
                            >
                              {!isMine && (
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', marginBottom: 4 }}>
                                  {msg.employeeName}
                                </div>
                              )}
                              <div style={{ fontSize: 14, wordBreak: 'break-word', lineHeight: 1.5 }}>
                                {msg.content}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: isMine ? '#ffedd5' : '#94a3b8',
                                  textAlign: 'right',
                                  marginTop: 4,
                                  fontWeight: 500
                                }}
                              >
                                {dayjs(msg.createdAt).format('HH:mm')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </Content>

                {/* Bottom Input Action Bar */}
                {activeConversation?.status !== 'Closed' ? (
                  <div
                    style={{
                      padding: '16px 24px',
                      background: '#fff',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      gap: 12
                    }}
                  >
                    <Input.TextArea
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder="Nhập tin nhắn phản hồi chi nhánh..."
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      onPressEnter={e => {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      style={{ borderRadius: 8 }}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSendMessage}
                      style={{
                        height: 'auto',
                        background: '#ea580c',
                        borderColor: '#ea580c',
                        borderRadius: 8,
                        padding: '0 20px',
                        fontWeight: 600
                      }}
                    >
                      Gửi
                    </Button>
                  </div>
                ) : (
                  <div style={{ padding: '16px 24px', background: '#f1f5f9', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                    Cuộc trò chuyện này đã đóng. Nếu cần hỗ trợ thêm, vui lòng tạo yêu cầu tư vấn mới.
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  margin: 'auto',
                  textAlign: 'center',
                  color: '#94a3b8',
                  padding: 48
                }}
              >
                <MessageOutlined style={{ fontSize: 64, color: '#cbd5e1', marginBottom: 16 }} />
                <Title level={5} style={{ color: '#64748b', margin: 0 }}>
                  Hãy chọn một cuộc trò chuyện từ danh sách bên trái hoặc tạo yêu cầu tư vấn mới.
                </Title>
              </div>
            )}
          </Layout>
        </Layout>
      </div>

      {/* New Consultation Modal */}
      <Modal
        title={<span style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>Yêu Cầu Hỗ Trợ Tư Vấn Mới</span>}
        open={newChatModalOpen}
        onCancel={() => setNewChatModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateNewChat}
          initialValues={{ topic: 'General' }}
          size="large"
        >
          <Form.Item
            name="branchId"
            label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Chọn chi nhánh hỗ trợ</span>}
            rules={[{ required: true, message: 'Vui lòng chọn chi nhánh muốn liên hệ!' }]}
          >
            <Select placeholder="Chọn chi nhánh...">
              {branches.map(b => (
                <Option key={b.id} value={b.id}>
                  {b.name} - {b.newAddressName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="topic"
            label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Chủ đề cần tư vấn</span>}
            rules={[{ required: true, message: 'Vui lòng chọn chủ đề!' }]}
          >
            <Select>
              <Option value="General">Hỗ trợ chung</Option>
              <Option value="Booking">Lịch đặt bàn</Option>
              <Option value="Menu">Thực đơn / Dị ứng món</Option>
              <Option value="Event">Đặt tiệc / Sự kiện</Option>
              <Option value="Other">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Tiêu đề chi tiết (Tùy chọn)</span>}
          >
            <Input placeholder="Ví dụ: Đặt bàn sinh nhật 15 người..." maxLength={100} />
          </Form.Item>

          <Form.Item
            name="firstMessage"
            label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Nội dung lời nhắn đầu tiên</span>}
            rules={[{ required: true, message: 'Vui lòng nhập nội dung nhắn gửi!' }]}
          >
            <Input.TextArea placeholder="Hãy nhập nội dung bạn cần hỗ trợ..." rows={4} maxLength={1000} showCount />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyItems: 'flex-end', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setNewChatModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submittingNewChat}
                style={{ background: '#ea580c', borderColor: '#ea580c', fontWeight: 600 }}
              >
                Gửi yêu cầu
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerChatPage;
