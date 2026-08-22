import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Input,
  Button,
  Card,
  Avatar,
  List,
  Badge,
  Modal,
  Form,
  Select,
  Spin,
  Typography,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  ShopOutlined,
  HistoryOutlined,
  CheckOutlined,
  UserSwitchOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import { useSignalR } from "../context/SignalRContext";
import { getRoleRange } from "../api/accountApi";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs";

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const BranchChatPage = () => {
  const { user, role } = useAuth();
  const { currentBranchId } = useBranch();
  const connection = useSignalR();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [inputText, setInputText] = useState("");

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const messagesEndRef = useRef(null);
  const [assignForm] = Form.useForm();

  // Fetch conversations list
  const fetchConversations = async (selectId = null) => {
    if (!currentBranchId) return;
    setLoadingList(true);
    try {
      const res = await axiosInstance.get(`/api/BranchChat/conversations`, {
        params: { branchId: currentBranchId },
      });
      setConversations(res.data);
      if (res.data.length > 0 && !activeConvId && !selectId) {
        handleSelectConversation(res.data[0].id);
      } else if (selectId) {
        handleSelectConversation(selectId);
      }
    } catch (error) {
      message.error("Không thể tải danh sách cuộc trò chuyện.");
      console.warn("Fetch conversations error:", error);
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch branch staff for assignment dropdown
  const fetchStaffList = async () => {
    if (!currentBranchId) return;
    try {
      const res = await getRoleRange(currentBranchId);
      setStaffList(res.data || []);
    } catch (error) {
      console.warn("Không thể tải danh sách nhân sự chi nhánh.", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations();
    fetchStaffList();
  }, [currentBranchId]);

  // Real-time listener via SignalR
  useEffect(() => {
    if (connection && currentBranchId) {
      // Connect to branch group
      connection
        .invoke("JoinBranchGroup", currentBranchId)
        .catch((err) => console.warn("JoinBranchGroup SignalR error:", err));

      const handleNewConversation = (conv) => {
        if (conv.branchId === currentBranchId) {
          setConversations((prev) => {
            if (prev.some((c) => c.id === conv.id)) return prev;
            return [conv, ...prev];
          });
          message.info(
            `Có cuộc trò chuyện mới từ khách hàng: ${conv.customerName}`,
          );
        }
      };

      const handleNewMessage = (msg) => {
        if (msg.conversationId === activeConvId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
        }
        fetchConversations(activeConvId);
      };

      const handleAssigned = (update) => {
        if (update.id === activeConvId) {
          fetchMessages(activeConvId);
        }
        fetchConversations(activeConvId);
      };

      connection.on("ReceiveNewConversation", handleNewConversation);
      connection.on("ReceiveNewMessage", handleNewMessage);
      connection.on("ConversationAssigned", handleAssigned);

      return () => {
        connection.off("ReceiveNewConversation", handleNewConversation);
        connection.off("ReceiveNewMessage", handleNewMessage);
        connection.off("ConversationAssigned", handleAssigned);
      };
    }
  }, [connection, activeConvId, currentBranchId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchMessages = async (convId) => {
    setLoadingDetail(true);
    try {
      const res = await axiosInstance.get(
        `/api/BranchChat/conversations/${convId}`,
      );
      setMessages(res.data.messages);
      scrollToBottom();
    } catch (error) {
      message.error("Không thể tải nội dung tin nhắn.");
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
    setInputText("");

    try {
      const res = await axiosInstance.post(
        `/api/BranchChat/conversations/${activeConvId}/messages`,
        {
          content: textToSend,
        },
      );
      // Append locally
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      scrollToBottom();
      fetchConversations(activeConvId);
    } catch (error) {
      message.error("Không thể gửi tin nhắn.");
      setInputText(textToSend);
    }
  };

  // Self Assign chat thread
  const handleSelfAssign = async () => {
    try {
      await axiosInstance.post(
        `/api/BranchChat/conversations/${activeConvId}/assign`,
        {
          assignedEmployeeId: user.id,
          note: "Tự nhận phụ trách hỗ trợ khách hàng",
        },
      );
      message.success("Đã tự nhận phụ trách cuộc trò chuyện này.");
      fetchConversations(activeConvId);
    } catch (error) {
      message.error(error.response?.data?.message || "Thao tác thất bại.");
    }
  };

  // Open transfer modal
  const openAssignModal = () => {
    setAssignModalOpen(true);
    assignForm.setFieldsValue({
      employeeId: activeConversation?.assignedEmployeeId || undefined,
    });
  };

  // Submit transfer/assignment
  const handleAssignSubmit = async (values) => {
    setSubmittingAssign(true);
    try {
      await axiosInstance.post(
        `/api/BranchChat/conversations/${activeConvId}/assign`,
        {
          assignedEmployeeId: values.employeeId || null,
          note: values.note || "",
        },
      );
      message.success("Cập nhật phân công thành công!");
      setAssignModalOpen(false);
      assignForm.resetFields();
      fetchConversations(activeConvId);
    } catch (error) {
      message.error(error.response?.data?.message || "Phân công thất bại.");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Fetch assignment logs audit history
  const handleViewHistory = async () => {
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await axiosInstance.get(
        `/api/BranchChat/conversations/${activeConvId}/assignment-history`,
      );
      setHistoryData(res.data);
    } catch (error) {
      message.error("Không thể tải lịch sử phân công.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const isManagerOrAbove = [
    "Admin",
    "Owner",
    "Manager",
    "Quản trị viên",
    "Chủ sở hữu",
    "Quản lý",
  ].includes(user?.role || role);

  return (
    <div
      style={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
        padding: 16,
      }}
    >
      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Layout style={{ background: "#fff", height: "100%" }}>
          {/* Sider (Conversations list) */}
          <Sider
            width={320}
            theme="light"
            style={{ borderRight: "1px solid #e2e8f0", background: "#fff" }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f1f5f9",
                fontWeight: 700,
                color: "#1e293b",
                fontSize: 16,
              }}
            >
              Khách Hàng Đang Chat
            </div>
            {loadingList ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <Spin />
              </div>
            ) : (
              <List
                style={{ height: "calc(100% - 60px)", overflowY: "auto" }}
                dataSource={conversations}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => handleSelectConversation(item.id)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      background:
                        item.id === activeConvId ? "#fff7ed" : "transparent",
                      borderLeft:
                        item.id === activeConvId
                          ? "4px solid #ea580c"
                          : "4px solid transparent",
                      transition: "all 0.2s",
                    }}
                    className="chat-thread-item"
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ background: "#ffedd5", color: "#ea580c" }}
                        />
                      }
                      title={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: item.id === activeConvId ? 700 : 600,
                              color: "#1e293b",
                            }}
                          >
                            {item.customerName}
                          </span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            {dayjs(item.updatedAt).format("HH:mm")}
                          </span>
                        </div>
                      }
                      description={
                        <div>
                          <Text
                            type="secondary"
                            ellipsis
                            style={{ display: "block", fontSize: 12 }}
                          >
                            {item.subject
                              ? item.subject
                              : item.topic === "Booking"
                                ? "Lịch đặt bàn"
                                : item.topic === "Menu"
                                  ? "Thực đơn"
                                  : "Yêu cầu hỗ trợ"}
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: 4,
                            }}
                          >
                            {item.assignedEmployeeName ? (
                              <Tag
                                color="cyan"
                                style={{ fontSize: 10, margin: 0 }}
                              >
                                {item.assignedEmployeeName}
                              </Tag>
                            ) : (
                              <Tag
                                color="warning"
                                style={{ fontSize: 10, margin: 0 }}
                              >
                                Chưa phân công
                              </Tag>
                            )}
                            {item.unreadCount > 0 && (
                              <Badge
                                count={item.unreadCount}
                                style={{ backgroundColor: "#ef4444" }}
                              />
                            )}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: (
                    <div
                      style={{
                        padding: 24,
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      Chưa có tin nhắn hỗ trợ nào
                    </div>
                  ),
                }}
              />
            )}
          </Sider>

          {/* Chat details layout */}
          <Layout
            style={{
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {activeConvId ? (
              <>
                {/* Active chat header with actions */}
                <div
                  style={{
                    padding: "12px 24px",
                    background: "#fff",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#0f172a",
                        display: "block",
                      }}
                    >
                      {activeConversation?.customerName}
                    </span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Chủ đề: {activeConversation?.topic}{" "}
                      {activeConversation?.subject &&
                        ` - ${activeConversation?.subject}`}
                    </Text>
                  </div>

                  <Space>
                    {/* Self Assign */}
                    {activeConversation?.assignedEmployeeId !== user.id && (
                      <Button
                        type="default"
                        icon={<CheckOutlined />}
                        onClick={handleSelfAssign}
                        style={{
                          fontWeight: 600,
                          borderColor: "#ea580c",
                          color: "#ea580c",
                        }}
                      >
                        Nhận phụ trách (Self-assign)
                      </Button>
                    )}

                    {/* Manage assignment (Manager only) */}
                    {isManagerOrAbove && (
                      <Button
                        type="default"
                        icon={<UserSwitchOutlined />}
                        onClick={openAssignModal}
                        style={{ fontWeight: 600 }}
                      >
                        Chuyển phụ trách / Phân công
                      </Button>
                    )}

                    {/* Audit History (Manager only) */}
                    {isManagerOrAbove && (
                      <Button
                        type="text"
                        icon={<HistoryOutlined />}
                        onClick={handleViewHistory}
                        title="Xem lịch sử phân công"
                      />
                    )}
                  </Space>
                </div>

                {/* Message display pane */}
                <Content
                  style={{
                    padding: "24px",
                    overflowY: "auto",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {loadingDetail ? (
                    <div style={{ textAlign: "center", margin: "auto" }}>
                      <Spin size="large" />
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => {
                        const isCustomer = msg.customerId !== null; // Sent by customer
                        return (
                          <div
                            key={msg.id || index}
                            style={{
                              display: "flex",
                              justifyContent: isCustomer
                                ? "flex-start"
                                : "flex-end",
                              width: "100%",
                            }}
                          >
                            <div
                              style={{
                                maxWidth: "70%",
                                background: isCustomer ? "#fff" : "#ea580c",
                                color: isCustomer ? "#1e293b" : "#fff",
                                borderRadius: isCustomer
                                  ? "16px 16px 16px 4px"
                                  : "16px 16px 4px 16px",
                                padding: "10px 16px",
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                border: isCustomer
                                  ? "1px solid #e2e8f0"
                                  : "none",
                                position: "relative",
                              }}
                            >
                              {!isCustomer && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#ffedd5",
                                    marginBottom: 4,
                                  }}
                                >
                                  {msg.employeeName}
                                </div>
                              )}
                              {isCustomer && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#ea580c",
                                    marginBottom: 4,
                                  }}
                                >
                                  Khách hàng
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 14,
                                  wordBreak: "break-word",
                                  lineHeight: 1.5,
                                }}
                              >
                                {msg.content}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: isCustomer ? "#94a3b8" : "#ffedd5",
                                  textAlign: "right",
                                  marginTop: 4,
                                  fontWeight: 500,
                                }}
                              >
                                {dayjs(msg.createdAt).format("HH:mm")}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </Content>

                {/* Bottom Input Area */}
                {activeConversation?.status !== "Closed" ? (
                  <div
                    style={{
                      padding: "16px 24px",
                      background: "#fff",
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    <Input.TextArea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Nhập tin nhắn trả lời khách hàng..."
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      onPressEnter={(e) => {
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
                        height: "auto",
                        background: "#ea580c",
                        borderColor: "#ea580c",
                        borderRadius: 8,
                        padding: "0 20px",
                        fontWeight: 600,
                      }}
                    >
                      Trả lời
                    </Button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "16px 24px",
                      background: "#f1f5f9",
                      textAlign: "center",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Cuộc trò chuyện này đã đóng.
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  margin: "auto",
                  textAlign: "center",
                  color: "#94a3b8",
                  padding: 48,
                }}
              >
                <MessageOutlined
                  style={{ fontSize: 64, color: "#cbd5e1", marginBottom: 16 }}
                />
                <Title level={5} style={{ color: "#64748b", margin: 0 }}>
                  Hãy chọn một cuộc trò chuyện từ danh sách bên trái.
                </Title>
              </div>
            )}
          </Layout>
        </Layout>
      </Card>

      {/* Assignment Modal (Manager/Admin Only) */}
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
            Phân Công Nhân Viên Phụ Trách
          </span>
        }
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignSubmit}
          size="large"
        >
          <Form.Item
            name="employeeId"
            label={
              <span style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>
                Nhân viên nhận bàn chat
              </span>
            }
          >
            <Select
              placeholder="Chọn nhân viên nhận bàn chat (Để trống để hủy phân công)..."
              allowClear
            >
              {staffList.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name} ({s.roleName || "Nhân viên"})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="note"
            label={
              <span style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>
                Ghi chú phân công
              </span>
            }
          >
            <Input.TextArea
              placeholder="Ghi chú lý do chuyển bàn giao hoặc phân công..."
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <div
              style={{
                display: "flex",
                justifyItems: "flex-end",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <Button onClick={() => setAssignModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submittingAssign}
                style={{
                  background: "#ea580c",
                  borderColor: "#ea580c",
                  fontWeight: 600,
                }}
              >
                Cập nhật
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assignment Audit History Modal (Manager/Admin Only) */}
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
            Lịch Sử Phân Công Tư Vấn
          </span>
        }
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <Table
            dataSource={historyData}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="middle"
            columns={[
              {
                title: "Thời gian",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (time) => dayjs(time).format("DD/MM/YYYY HH:mm:ss"),
              },
              {
                title: "Hành động",
                dataIndex: "action",
                key: "action",
                render: (action) => {
                  let color = "default";
                  let text = action;
                  if (action === "Assigned") {
                    color = "blue";
                    text = "Phân công";
                  } else if (action === "Reassigned") {
                    color = "purple";
                    text = "Chuyển giao";
                  } else if (action === "Unassigned") {
                    color = "red";
                    text = "Hủy phân công";
                  }
                  return <Tag color={color}>{text}</Tag>;
                },
              },
              {
                title: "Nhân viên phụ trách",
                dataIndex: "employeeName",
                key: "employeeName",
                render: (name) => name || <Text type="secondary">—</Text>,
              },
              {
                title: "Người thực hiện",
                dataIndex: "creatorName",
                key: "creatorName",
              },
              {
                title: "Ghi chú",
                dataIndex: "note",
                key: "note",
                ellipsis: true,
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default BranchChatPage;
