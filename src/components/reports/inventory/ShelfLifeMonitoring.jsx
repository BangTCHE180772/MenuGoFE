import React from "react";
import { Row, Col, Card, Table, Tag, Typography, Alert, Badge } from "antd";
import {
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ShelfLifeMonitoring = ({ expiringItems = [], inspectionItems = [] }) => {
  // Card 1 Columns: Nguyên liệu sắp hết hạn
  const expiringColumns = [
    {
      title: "Tên nguyên liệu",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>{text}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Tồn: {record.quantity} {record.unit}
          </div>
        </div>
      ),
    },
    {
      title: "Hạn sử dụng",
      dataIndex: "expiryDate",
      key: "expiryDate",
      align: "center",
      width: 105,
      render: (text) => <span style={{ fontWeight: 500, fontSize: 12 }}>{text}</span>,
    },
    {
      title: "Còn lại",
      dataIndex: "daysRemaining",
      key: "daysRemaining",
      align: "center",
      width: 95,
      sorter: (a, b) => a.daysRemaining - b.daysRemaining,
      render: (days) => {
        const isUrgent = days <= 5;
        return (
          <Tag
            color={isUrgent ? "error" : "warning"}
            style={{ fontWeight: 700, borderRadius: 10, margin: 0 }}
          >
            {isUrgent ? "🔥 " : "⏳ "}
            {days} ngày
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 115,
      render: (_, record) => {
        const isUrgent = record.daysRemaining <= 5;
        return (
          <Badge
            status={isUrgent ? "error" : "warning"}
            text={isUrgent ? "Cần dùng gấp" : "Cần chú ý"}
          />
        );
      },
    },
  ];

  // Card 2 Columns: Nguyên liệu cần kiểm tra
  const inspectionColumns = [
    {
      title: "Tên nguyên liệu",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>{text}</div>
          <div style={{ fontSize: 11, color: "#e11d48" }}>{record.reason}</div>
        </div>
      ),
    },
    {
      title: "Lần kiểm tra gần nhất",
      dataIndex: "lastCheckedDate",
      key: "lastCheckedDate",
      align: "center",
      width: 145,
      render: (text) => <span style={{ fontSize: 11, color: "#475569" }}>{text}</span>,
    },
    {
      title: "Người kiểm tra",
      dataIndex: "inspector",
      key: "inspector",
      width: 120,
      render: (text) => <span style={{ fontWeight: 500, fontSize: 12 }}>{text}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 135,
      render: (status, record) => {
        return record.isCheckedToday ? (
          <Tag color="success" style={{ margin: 0 }}>
            <CheckCircleOutlined style={{ marginRight: 4 }} />
            Đã kiểm tra
          </Tag>
        ) : (
          <Tag color="error" style={{ margin: 0 }}>
            <ExclamationCircleOutlined style={{ marginRight: 4 }} />
            Chưa kiểm tra
          </Tag>
        );
      },
    },
  ];

  const uncheckedTodayCount = inspectionItems.filter((i) => !i.isCheckedToday).length;

  return (
    <Row gutter={[20, 20]} style={{ marginBottom: 24 }} align="stretch">
      {/* Card 1: Nguyên liệu sắp hết hạn */}
      <Col xs={24} lg={12} style={{ display: "flex" }}>
        <Card
          style={{
            borderRadius: 16,
            width: "100%",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
          }}
          bodyStyle={{
            padding: "20px 24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Card Header */}
          <div style={{ height: 48, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ClockCircleOutlined style={{ fontSize: 20, color: "#ea580c" }} />
                <div>
                  <Title level={5} style={{ margin: 0, color: "#0f172a" }}>
                    ⏳ Nguyên liệu Sắp hết hạn (Shelf-life Monitoring)
                  </Title>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Cảnh báo theo ngày: ≤ 5 ngày (Đỏ), ≤ 10 ngày (Vàng).
                  </Text>
                </div>
              </div>
              <Tag color="orange" style={{ fontWeight: 700, borderRadius: 10 }}>
                {expiringItems.length} nguyên liệu
              </Tag>
            </div>
          </div>

          {/* Sub Header Alert Container - Identical height for perfect alignment */}
          <div style={{ height: 38, marginBottom: 12 }}>
            <Alert
              message="Ưu tiên xuất dùng các nguyên liệu có hạn sử dụng còn lại dưới 5 ngày."
              type="info"
              showIcon
              style={{ borderRadius: 8, fontSize: 12, padding: "6px 12px" }}
            />
          </div>

          {/* Table Container */}
          <div style={{ flex: 1 }}>
            <Table
              columns={expiringColumns}
              dataSource={expiringItems}
              rowKey="id"
              pagination={{ pageSize: 4, size: "small" }}
              size="small"
              bordered={false}
            />
          </div>
        </Card>
      </Col>

      {/* Card 2: Nguyên liệu cần kiểm tra */}
      <Col xs={24} lg={12} style={{ display: "flex" }}>
        <Card
          style={{
            borderRadius: 16,
            width: "100%",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
          }}
          bodyStyle={{
            padding: "20px 24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Card Header */}
          <div style={{ height: 48, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SafetyCertificateOutlined style={{ fontSize: 20, color: "#0284c7" }} />
                <div>
                  <Title level={5} style={{ margin: 0, color: "#0f172a" }}>
                    📋 Nguyên liệu Cần kiểm tra (Quality Inspection)
                  </Title>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Dành cho nguyên liệu chưa set date hoặc có biến động sai số lớn.
                  </Text>
                </div>
              </div>
              <Tag color="cyan" style={{ fontWeight: 700, borderRadius: 10 }}>
                {inspectionItems.length} nguyên liệu
              </Tag>
            </div>
          </div>

          {/* Sub Header Alert Container - Identical height for perfect alignment */}
          <div style={{ height: 38, marginBottom: 12 }}>
            <Alert
              message={`Cảnh báo: Có ${uncheckedTodayCount} nguyên liệu chưa được kiểm tra trong ngày hôm nay!`}
              type="warning"
              showIcon
              style={{ borderRadius: 8, fontSize: 12, padding: "6px 12px" }}
            />
          </div>

          {/* Table Container */}
          <div style={{ flex: 1 }}>
            <Table
              columns={inspectionColumns}
              dataSource={inspectionItems}
              rowKey="id"
              pagination={{ pageSize: 4, size: "small" }}
              size="small"
              bordered={false}
            />
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default ShelfLifeMonitoring;
