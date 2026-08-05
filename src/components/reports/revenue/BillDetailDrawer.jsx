import React from "react";
import {
  Drawer,
  Descriptions,
  Table,
  Tag,
  Typography,
  Divider,
  Space,
  Button,
} from "antd";
import { PrinterOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0,
  );

/**
 * Revenue Report Component: BillDetailDrawer
 * Drawer xem chi tiết đầy đủ 1 hóa đơn bán hàng khi click vào bất kỳ dòng nào trong Báo cáo Doanh thu.
 */
const BillDetailDrawer = ({ visible, onClose, billData }) => {
  if (!billData) return null;

  const itemsColumns = [
    { title: "STT", key: "idx", width: 50, render: (_, __, i) => i + 1 },
    { title: "Tên món / Sản phẩm", dataIndex: "name", key: "name" },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      align: "right",
      render: (v) => formatVND(v),
    },
    { title: "SL", dataIndex: "qty", key: "qty", align: "center" },
    {
      title: "Thành tiền",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (v) => <strong>{formatVND(v)}</strong>,
    },
  ];

  const mockItems = billData.items || [
    { name: "Lẩu Thái Hải Sản Thập Cẩm", price: 350000, qty: 1, total: 350000 },
    { name: "Mực Chấy Tỏi Nước Mắm", price: 165000, qty: 1, total: 165000 },
    { name: "Bia Heineken Silver (Lon)", price: 28000, qty: 6, total: 168000 },
    { name: "Khăn lạnh cao cấp", price: 3000, qty: 4, total: 12000 },
  ];

  return (
    <Drawer
      title={
        <Space>
          <CheckCircleOutlined style={{ color: "#16a34a" }} />
          <span>
            Chi Tiết Hóa Đơn:{" "}
            <strong>{billData.billCode || billData.id}</strong>
          </span>
        </Space>
      }
      width={640}
      open={visible}
      onClose={onClose}
      extra={
        <Button
          icon={<PrinterOutlined />}
          onClick={() => window.print()}
          type="primary"
          style={{ borderRadius: 6 }}
        >
          In lại bill
        </Button>
      }
    >
      {/* Thông tin hóa đơn */}
      <Descriptions size="small" column={2} bordered>
        <Descriptions.Item label="Mã Hóa Đơn">
          {billData.billCode || billData.id}
        </Descriptions.Item>
        <Descriptions.Item label="Thời gian">
          {billData.date} {billData.time}
        </Descriptions.Item>
        <Descriptions.Item label="Khách hàng">
          {billData.customer || "Khách lẻ"}
        </Descriptions.Item>
        <Descriptions.Item label="Bàn / Khu vực">
          {billData.tableName || "Bàn 12 - Tầng 1"}
        </Descriptions.Item>
        <Descriptions.Item label="Thu ngân">
          {billData.cashier || "Nguyễn Văn An"}
        </Descriptions.Item>
        <Descriptions.Item label="Phương thức TT">
          <Tag color="blue">{billData.paymentMethod || "Tiền mặt"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color="success">Đã thanh toán</Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: "16px 0" }}>Danh mục món đã chọn</Divider>

      {/* Bảng danh sách món */}
      <Table
        columns={itemsColumns}
        dataSource={mockItems}
        pagination={false}
        size="small"
        rowKey="name"
        bordered
      />

      <Divider style={{ margin: "16px 0" }} />

      {/* Tổng kết tiền */}
      <div
        style={{
          background: "#f8fafc",
          padding: 16,
          borderRadius: 8,
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text type="secondary">Tiền món ăn:</Text>
          <Text>{formatVND(billData.dishTotal || 695000)}</Text>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text type="secondary">Phụ thu (Dịch vụ):</Text>
          <Text>{formatVND(billData.surcharge || 0)}</Text>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text type="secondary">Giảm giá / Voucher:</Text>
          <Text type="danger">-{formatVND(billData.discount || 20000)}</Text>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text type="secondary">Thuế VAT (8%):</Text>
          <Text>{formatVND(billData.vat || 54000)}</Text>
        </div>
        <Divider style={{ margin: "8px 0" }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Tổng Tiền Thanh Toán:
          </Title>
          <Title level={4} style={{ margin: 0, color: "var(--color-primary)" }}>
            {formatVND(billData.total || 729000)}
          </Title>
        </div>
      </div>
    </Drawer>
  );
};

export default BillDetailDrawer;
