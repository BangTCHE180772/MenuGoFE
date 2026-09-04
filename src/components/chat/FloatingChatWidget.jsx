import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Select,
  Badge,
  Avatar,
  Spin,
  Typography,
  Tooltip,
  message as antMessage
} from 'antd';
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  ShopOutlined,
  AppstoreAddOutlined,
  CustomerServiceOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  initGuestSession,
  getGuestConversations,
  getGuestConversationDetails,
  sendGuestChatMessage,
  sendGuestProductConsultation,
  getStoredGuestToken,
  getStoredGuestId,
  setStoredGuestSession,
  sendCustomerProductConsultation
} from '../../api/guestChatApi';
import {
  getCustomerConversations,
  getCustomerConversationDetails,
  sendCustomerChatMessage,
  openCustomerConversation
} from '../../api/customerPortalApi';
import { useSignalR } from '../../context/SignalRContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useNavigate } from 'react-router-dom';
import ProductConsultationCard from './ProductConsultationCard';
import SelectProductConsultationModal from './SelectProductConsultationModal';

const { Text } = Typography;
const { Option } = Select;

const FloatingChatWidget = ({
  activeBranchId,
  branches = [],
  onSelectBranch,
  externalConsultationItem = null,
  onClearExternalConsultation = () => {}
}) => {
  const connection = useSignalR();
  const { customer, isAuthenticated } = useCustomerAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [guestSession, setGuestSession] = useState(null);
  const [currentBranchId, setCurrentBranchId] = useState(activeBranchId || null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuModalOpen, setMenuModalOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const activeBranches = branches.filter(b => !b.isDeleted && b.status !== "Ngừng kinh doanh");

  // Sync activeBranchId from parent
  useEffect(() => {
    if (activeBranchId && activeBranches.some(b => b.id === activeBranchId)) {
      setCurrentBranchId(activeBranchId);
    } else if (activeBranches.length > 0 && !currentBranchId) {
      setCurrentBranchId(activeBranches[0].id);
    }
  }, [activeBranchId, activeBranches]);

  // Khởi tạo phiên
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations(currentBranchId);
    } else {
      initSession();
    }
  }, [currentBranchId, isAuthenticated]);

  const initSession = async () => {
    try {
      const storedToken = getStoredGuestToken();
      const storedGuestId = getStoredGuestId();

      const res = await initGuestSession({
        guestId: storedGuestId || null,
        token: storedToken || null,
        branchId: currentBranchId || null
      });

      if (res.data) {
        setGuestSession(res.data);
        setStoredGuestSession(res.data);
        loadConversations(currentBranchId);
      }
    } catch {
      // Fallback
    }
  };

  // SignalR Hub listener
  useEffect(() => {
    if (!connection) return;

    let groupId = null;
    let joinMethod = '';
    let leaveMethod = '';

    if (isAuthenticated && customer?.id) {
      groupId = customer.id;
      joinMethod = 'JoinCustomerGroup';
      leaveMethod = 'LeaveCustomerGroup';
    } else if (!isAuthenticated && guestSession?.guestId) {
      groupId = guestSession.guestId;
      joinMethod = 'JoinGuestGroup';
      leaveMethod = 'LeaveGuestGroup';
    }

    if (!groupId) return;

    connection
      .invoke(joinMethod, groupId)
      .catch((err) => console.warn(joinMethod + ' SignalR error:', err));

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    };

    connection.on('ReceiveNewMessage', handleNewMessage);

    return () => {
      if (connection && groupId) {
        connection
          .invoke(leaveMethod, groupId)
          .catch(() => {});
        connection.off('ReceiveNewMessage', handleNewMessage);
      }
    };
  }, [connection, guestSession?.guestId, isAuthenticated, customer?.id, isOpen]);

  // Tải danh sách hội thoại của chi nhánh hiện tại
  const loadConversations = async (branchId) => {
    if (!isAuthenticated) {
      const token = getStoredGuestToken();
      if (!token) return;
    }

    setLoading(true);
    try {
      const res = isAuthenticated 
        ? await getCustomerConversations()
        : await getGuestConversations();
        
      if (res.data) {
        setConversations(res.data);
        const targetConv = res.data.find((c) => c.branchId === branchId);
        if (targetConv) {
          setActiveConversation(targetConv);
          loadConversationDetails(targetConv.id);
        } else {
          setActiveConversation(null);
          setMessages([]);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetails = async (convId) => {
    try {
      const res = isAuthenticated 
        ? await getCustomerConversationDetails(convId)
        : await getGuestConversationDetails(convId);
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch {
      // Ignored
    }
  };

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Xử lý khi có yêu cầu tư vấn món từ bên ngoài (card món ăn)
  useEffect(() => {
    if (externalConsultationItem && currentBranchId) {
      setIsOpen(true);
      handleSendProductConsultation([externalConsultationItem.productId || externalConsultationItem.id]);
      onClearExternalConsultation();
    }
  }, [externalConsultationItem, currentBranchId]);

  // Chuyển đổi chi nhánh
  const handleBranchChange = (newBranchId) => {
    setCurrentBranchId(newBranchId);
    if (onSelectBranch) onSelectBranch(newBranchId);
    loadConversations(newBranchId);
  };

  // Gửi tin nhắn văn bản
  const handleSendMessage = async () => {
    if (!inputText.trim() || sending || !currentBranchId) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      let res;
      if (isAuthenticated) {
        let convId = activeConversation?.id;
        if (!convId) {
          const newConvRes = await openCustomerConversation({
            branchId: currentBranchId,
            topic: 'Khác',
            subject: 'Khách hàng liên hệ'
          });
          convId = newConvRes.data.id;
        }
        res = await sendCustomerChatMessage(convId, content);
      } else {
        res = await sendGuestChatMessage({
          branchId: currentBranchId,
          conversationId: activeConversation?.id || null,
          content: content,
          messageType: 'Text'
        });
      }

      if (res.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
        if (!activeConversation) {
          loadConversations(currentBranchId);
        }
      }
    } catch {
      antMessage.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  // Gửi tư vấn món ăn
  const handleSendProductConsultation = async (productIds) => {
    if (!productIds || productIds.length === 0 || !currentBranchId || sending) return;

    setSending(true);
    try {
      let res;
      if (isAuthenticated) {
        let convId = activeConversation?.id;
        if (!convId) {
          const newConvRes = await openCustomerConversation({
            branchId: currentBranchId,
            topic: 'Khác',
            subject: 'Khách hàng liên hệ'
          });
          convId = newConvRes.data.id;
        }
        res = await sendCustomerProductConsultation({
          branchId: currentBranchId,
          conversationId: convId,
          productIds: productIds
        });
      } else {
        res = await sendGuestProductConsultation({
          branchId: currentBranchId,
          conversationId: activeConversation?.id || null,
          productIds: productIds
        });
      }

      if (res.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
        antMessage.success('Đã gửi yêu cầu tư vấn món ăn tới nhân viên.');
        if (!activeConversation) {
          loadConversations(currentBranchId);
        }
      }
    } catch {
      antMessage.error('Không thể gửi yêu cầu tư vấn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setUnreadCount(0);
      if (currentBranchId) {
        loadConversations(currentBranchId);
      }
    }
  };

  const currentBranchName =
    branches.find((b) => b.id === currentBranchId)?.name || 'Chi nhánh';

  return (
    <>
      {/* Nút Chat nổi cố định */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1050 }}>
        {!isOpen && (
          <Badge count={unreadCount} overflowCount={99}>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<CustomerServiceOutlined style={{ fontSize: 26 }} />}
              onClick={handleToggleOpen}
              style={{
                width: 60,
                height: 60,
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                borderColor: '#ea580c',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </Badge>
        )}

        {/* Khung Chat nổi */}
        {isOpen && (
          <div
            style={{
              width: 380,
              maxWidth: 'calc(100vw - 32px)',
              height: 520,
              maxHeight: 520,
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
              border: '1px solid #fed7aa',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header Khung Chat */}
            <div
              style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                padding: '12px 16px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <Avatar
                  style={{ background: '#ffffff', color: '#ea580c' }}
                  icon={<CustomerServiceOutlined />}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                    Hỗ trợ trực tuyến
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                    {isAuthenticated ? (customer?.fullName || 'Khách hàng') : (guestSession?.guestName || 'Khách vãng lai')}
                  </div>
                </div>
              </div>

              <Button
                type="text"
                shape="circle"
                icon={<CloseOutlined style={{ color: '#fff', fontSize: 16 }} />}
                onClick={handleToggleOpen}
              />
            </div>

            {/* Chi nhánh Chat Selector */}
            <div
              style={{
                padding: '8px 12px',
                background: '#fffaf5',
                borderBottom: '1px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <ShopOutlined style={{ color: '#ea580c', fontSize: 15 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', flexShrink: 0 }}>
                Chi nhánh:
              </span>
              <Select
                value={currentBranchId}
                onChange={handleBranchChange}
                size="small"
                style={{ flex: 1, borderRadius: 6 }}
                placeholder="Chọn chi nhánh chat"
              >
                {activeBranches.map((b) => (
                  <Option key={b.id} value={b.id}>
                    {b.name}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Vùng hiển thị tin nhắn (Locked Height Scroll) */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 14px',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Spin tip="Đang tải tin nhắn..." />
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px 10px',
                    color: '#64748b',
                    fontSize: 13,
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px dashed #e2e8f0',
                    margin: 'auto 0'
                  }}
                >
                  <CustomerServiceOutlined style={{ fontSize: 32, color: '#ea580c', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>
                    Chào mừng bạn đến với MenuGo!
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    Hãy gửi tin nhắn hoặc chọn món ăn bên dưới để được nhân viên hỗ trợ nhanh nhất.
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = isAuthenticated ? (m.customerId === customer?.id) : (!m.employeeName);
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        marginBottom: 4
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                          marginBottom: 3,
                          padding: '0 4px'
                        }}
                      >
                        {isMe ? 'Bạn' : (m.employeeName || `MenuGo - ${currentBranchName}`)}
                      </div>

                      <div
                        style={{
                          maxWidth: '85%',
                          padding: '10px 14px',
                          borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          background: isMe ? '#ea580c' : '#ffffff',
                          color: isMe ? '#ffffff' : '#1e293b',
                          boxShadow: isMe
                            ? '0 2px 8px rgba(234, 88, 12, 0.25)'
                            : '0 1px 3px rgba(0, 0, 0, 0.08)',
                          fontSize: 13,
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                          border: isMe ? 'none' : '1px solid #f1f5f9'
                        }}
                      >
                        {m.content}
                        {m.messageType === 'ProductReference' && (
                          <ProductConsultationCard metadataJson={m.metadataJson} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Action Toolbar & Input Area */}
            <div style={{ background: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '8px 10px' }}>
              {/* Quick actions */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <Button
                  size="small"
                  icon={<AppstoreAddOutlined style={{ color: '#ea580c' }} />}
                  onClick={() => setMenuModalOpen(true)}
                  style={{
                    borderRadius: 6,
                    fontSize: 12,
                    borderColor: '#fed7aa',
                    background: '#fffaf5',
                    color: '#ea580c',
                    fontWeight: 600
                  }}
                >
                  Chọn món tư vấn
                </Button>
              </div>

              {/* Input Form */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPressEnter={handleSendMessage}
                  disabled={sending || !currentBranchId}
                  style={{ borderRadius: 8, fontSize: 13 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={sending}
                  disabled={!inputText.trim() || !currentBranchId}
                  style={{
                    background: '#ea580c',
                    borderColor: '#ea580c',
                    borderRadius: 8
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chọn Món Ăn Tư Vấn */}
      <SelectProductConsultationModal
        open={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        branchId={currentBranchId}
        onConfirmSend={handleSendProductConsultation}
        loading={sending}
      />
    </>
  );
};

export default FloatingChatWidget;
