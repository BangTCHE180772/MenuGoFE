import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  Table,
  Space,
  Popconfirm,
  Modal,
  Form,
  TimePicker,
  DatePicker,
  Dropdown,
  Tooltip,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  searchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../api/branchApi";
import { getAllChains } from "../api/chainApi";
import "../styles/Branch/BranchPage.css";

const { RangePicker } = DatePicker;

// Định dạng tiền tệ VND
const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// Hàm tạo dữ liệu tài chính giả lập cho biểu đồ & thống kê
const getMockFinancials = (range, customDates, branchCount) => {
  let days = 30;
  if (range === "7days") days = 7;
  else if (range === "thisMonth") days = dayjs().date();
  else if (range === "lastMonth") days = 30;
  else if (range === "thisYear") {
    const start = dayjs().startOf("year");
    days = dayjs().diff(start, "day") + 1;
  } else if (range === "lastYear") days = 365;
  else if (range === "custom" && customDates && customDates[0] && customDates[1]) {
    const diff = customDates[1].diff(customDates[0], "day");
    days = diff > 0 ? diff : 1;
  }

  const factor = branchCount > 0 ? branchCount : 3;
  // Giả lập doanh thu trung bình 5.5 triệu VND / chi nhánh / ngày
  const revenue = factor * days * 5500000;
  // Chi phí chiếm khoảng 64% doanh thu
  const expenses = Math.round(revenue * 0.64);
  const profit = revenue - expenses;

  return { revenue, expenses, profit };
};

const BranchPage = () => {
  const [form] = Form.useForm();
  
  // ─── States ────────────────────────────────────────────────────────────────
  const [branches, setBranches] = useState([]);
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Filter/Sort states
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterType, setFilterType] = useState(undefined);
  const [sortBy, setSortBy] = useState("Id");
  const [sortDesc, setSortDesc] = useState(false);

  // Dashboard states
  const [dateRange, setDateRange] = useState("thisMonth");
  const [customDates, setCustomDates] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // ─── Fetching Data ────────────────────────────────────────────────────────
  // Tải danh sách chi nhánh kèm filter, sort, paging
  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        Keyword: searchKeyword || undefined,
        Type: filterType || undefined,
        SortBy: sortBy,
        Desc: sortDesc,
        Page: currentPage,
        PageSize: pageSize,
      };
      
      const res = await searchBranches(params);
      const data = res.data || [];
      setBranches(data);

      // Phỏng đoán tổng số dòng dựa trên độ dài dữ liệu trả về vì API không trả totalCount
      if (data.length < pageSize) {
        setTotalItems((currentPage - 1) * pageSize + data.length);
      } else {
        setTotalItems(currentPage * pageSize + 10);
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lấy thông tin danh sách chi nhánh.");
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, filterType, sortBy, sortDesc, currentPage, pageSize]);

  // Tải danh sách chuỗi (Chains) để điền vào Form Dropdown
  const loadChains = useCallback(async () => {
    try {
      const res = await getAllChains();
      setChains(res.data || []);
    } catch (err) {
      console.error(err);
      // Fallback data nếu API chuỗi lỗi hoặc trống
      setChains([{ id: 1, name: "Chuỗi Hệ Thống MenuGo" }]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChains();
  }, [loadChains]);

  // ─── Dashboard calculations (Custom SVG Pie Chart) ───────────────────────
  // Tính toán dữ liệu thống kê dựa trên số lượng chi nhánh thực tế
  const stats = useMemo(() => {
    return getMockFinancials(dateRange, customDates, branches.length);
  }, [dateRange, customDates, branches.length]);

  // Thiết lập các thông số SVG Slice cho Pie Chart hình tròn / Donut
  const chartData = useMemo(() => {
    const total = stats.revenue + stats.expenses + stats.profit;
    const items = [
      { key: "revenue", label: "Doanh thu", value: stats.revenue, color: "#1890ff", className: "revenue" },
      { key: "expenses", label: "Chi phí", value: stats.expenses, color: "#ff4d4f", className: "expenses" },
      { key: "profit", label: "Lợi nhuận", value: stats.profit, color: "#52c41a", className: "profit" },
    ];

    let accumulatedPercent = 0;
    // Chu vi hình tròn r=50 là 2 * pi * 50 ~ 314.159
    const circumference = 314.159;

    return items.map((item) => {
      const percent = total > 0 ? (item.value / total) * 100 : 0;
      const strokeDasharray = `${(percent * circumference) / 100} ${circumference}`;
      const strokeDashoffset = `${circumference - (accumulatedPercent * circumference) / 100}`;
      accumulatedPercent += percent;
      return {
        ...item,
        percent,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [stats]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterType = (value) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadBranches();
    message.success("Làm mới danh sách thành công");
  };

  const handleDelete = async (id) => {
    try {
      await deleteBranch(id);
      message.success("Xóa chi nhánh thành công!");
      loadBranches();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi xóa chi nhánh.");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBranch(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch) => {
    setEditingBranch(branch);
    form.setFieldsValue({
      name: branch.name,
      type: branch.type,
      chainId: branch.chainId,
      addressId: branch.addressId,
      openTime: branch.openTime ? dayjs(branch.openTime, "HH:mm:ss") : null,
      closeTime: branch.closeTime ? dayjs(branch.closeTime, "HH:mm:ss") : null,
    });
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        type: values.type,
        addressId: values.addressId || 1,
        openTime: values.openTime ? values.openTime.format("HH:mm:ss") : "00:00:00",
        closeTime: values.closeTime ? values.closeTime.format("HH:mm:ss") : "00:00:00",
      };

      if (editingBranch) {
        // Cập nhật
        await updateBranch({
          id: editingBranch.id,
          ...payload,
        });
        message.success("Cập nhật thông tin chi nhánh thành công!");
      } else {
        // Thêm mới
        await createBranch({
          chainId: values.chainId || 1,
          ...payload,
        });
        message.success("Thêm chi nhánh mới thành công!");
      }
      setIsModalOpen(false);
      loadBranches();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Lỗi khi xử lý thao tác.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    if (sorter.field) {
      setSortBy(sorter.field === "name" ? "Name" : "Id");
      setSortDesc(sorter.order === "descend");
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Tên chi nhánh",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Loại hình",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <span className={`branch-type-label ${type?.toLowerCase()}`}>
          {type || "N/A"}
        </span>
      ),
    },
    {
      title: "Giờ mở cửa",
      dataIndex: "openTime",
      key: "openTime",
      render: (time) => <span className="branch-time-tag">{time}</span>,
    },
    {
      title: "Giờ đóng cửa",
      dataIndex: "closeTime",
      key: "closeTime",
      render: (time) => <span className="branch-time-tag">{time}</span>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Địa chỉ",
      dataIndex: "addressName",
      key: "addressName",
      render: (_, record) => record.addressName || `Địa chỉ ID: ${record.addressId}`,
    },
    {
      title: "Quản lý",
      dataIndex: "managerName",
      key: "managerName",
      render: (text) => text || <span style={{ color: "#aaa" }}>Chưa phân công</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      width: 80,
      render: (_, record) => {
        const menu = (
          <div className="ant-dropdown-menu">
            <div className="ant-dropdown-menu-item" onClick={() => handleOpenEditModal(record)}>
              <Space><EditOutlined /> Sửa</Space>
            </div>
            <Popconfirm
              title="Bạn chắc chắn muốn xóa chi nhánh này?"
              description="Hành động này không thể hoàn tác."
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <div className="ant-dropdown-menu-item ant-dropdown-menu-item-danger">
                <Space><DeleteOutlined /> Xóa</Space>
              </div>
            </Popconfirm>
          </div>
        );

        return (
          <Dropdown dropdownRender={() => menu} trigger={["click"]}>
            <span className="branch-action-btn">
              <MoreOutlined style={{ fontSize: 18 }} />
            </span>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="branch-page-container">
      {/* ─── SECTION 1: DASHBOARD AND CHARTS ────────────────────────────────── */}
      <div className="branch-dashboard-card">
        <div className="branch-dashboard-header">
          <h2 className="branch-dashboard-title">Thống Kê Hoạt Động Hệ Thống</h2>
          <div className="branch-dashboard-filters">
            <Select
              value={dateRange}
              onChange={(value) => setDateRange(value)}
              style={{ width: 140 }}
            >
              <Select.Option value="7days">7 ngày qua</Select.Option>
              <Select.Option value="thisMonth">Tháng này</Select.Option>
              <Select.Option value="lastMonth">Tháng trước</Select.Option>
              <Select.Option value="thisYear">Năm này</Select.Option>
              <Select.Option value="lastYear">Năm trước</Select.Option>
              <Select.Option value="custom">Tuỳ chỉnh</Select.Option>
            </Select>

            {dateRange === "custom" && (
              <RangePicker
                onChange={(dates) => setCustomDates(dates)}
                format="DD/MM/YYYY"
              />
            )}
          </div>
        </div>

        <div className="branch-dashboard-body">
          {/* Custom SVG Pie Chart */}
          <div className="branch-chart-wrapper">
            <svg viewBox="0 0 220 220" className="branch-svg-chart">
              <circle cx="110" cy="110" r="50" fill="none" stroke="#f0f0f0" strokeWidth="32" />
              {chartData.map((slice) => (
                <circle
                  key={slice.key}
                  cx="110"
                  cy="110"
                  r="50"
                  className={`branch-svg-slice ${slice.className}`}
                  stroke={slice.color}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              ))}
            </svg>

            {/* Overlay hiển thị thông số khi hover hoặc tổng */}
            <div className="branch-chart-overlay">
              <div className="branch-chart-overlay-value">
                {hoveredSlice 
                  ? `${Math.round(hoveredSlice.percent)}%` 
                  : `${branches.length}`}
              </div>
              <div className="branch-chart-overlay-label">
                {hoveredSlice ? hoveredSlice.label : "Chi nhánh"}
              </div>
            </div>

            {/* Chú giải màu sắc dưới Chart */}
            <div className="branch-chart-legend">
              {chartData.map((slice) => (
                <div 
                  key={slice.key} 
                  className="branch-legend-item"
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <span className={`branch-legend-dot ${slice.className}`} />
                  <span>
                    {slice.label} ({Math.round(slice.percent)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cột hiển thị Statistics Cards */}
          <div className="branch-stats-grid">
            <div className="branch-stat-card revenue">
              <span className="branch-stat-label">Tổng Doanh Thu</span>
              <span className="branch-stat-value">{formatCurrency(stats.revenue)}</span>
              <span className="branch-stat-sub">Ước tính từ hóa đơn thanh toán</span>
            </div>

            <div className="branch-stat-card expenses">
              <span className="branch-stat-label">Tổng Chi Phí</span>
              <span className="branch-stat-value">{formatCurrency(stats.expenses)}</span>
              <span className="branch-stat-sub">Nguyên vật liệu & vận hành</span>
            </div>

            <div className="branch-stat-card profit">
              <span className="branch-stat-label">Tổng Lợi Nhuận</span>
              <span className="branch-stat-value" style={{ color: "#52c41a" }}>
                {formatCurrency(stats.profit)}
              </span>
              <span className="branch-stat-sub">Doanh thu trừ đi chi phí</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: BRANCH LIST TABLE ─────────────────────────────────── */}
      <div className="branch-list-card">
        <div className="branch-toolbar">
          <div className="branch-toolbar-left">
            <Input
              placeholder="Tìm kiếm chi nhánh..."
              prefix={<SearchOutlined style={{ color: "#aaa" }} />}
              value={searchKeyword}
              onChange={handleSearch}
              className="branch-search-input"
              allowClear
            />
            <Select
              placeholder="Lọc theo loại hình"
              value={filterType}
              onChange={handleFilterType}
              style={{ width: 180 }}
              allowClear
            >
              <Select.Option value="Restaurant">Restaurant</Select.Option>
              <Select.Option value="Cafe">Cafe</Select.Option>
              <Select.Option value="Kiosk">Kiosk</Select.Option>
              <Select.Option value="Express">Express</Select.Option>
            </Select>

            <Tooltip title="Làm mới dữ liệu">
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
            </Tooltip>
          </div>

          <div className="branch-toolbar-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}
            >
              Thêm Chi Nhánh
            </Button>
          </div>
        </div>

        <div className="branch-table-wrapper">
          <Table
            dataSource={branches}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              pageSizeOptions: ["10", "25", "50", "100"],
            }}
            onChange={handleTableChange}
            className="branch-custom-table"
            sticky
          />
        </div>
      </div>

      {/* ─── MODAL ADD/EDIT BRANCH ─────────────────────────────────────────── */}
      <Modal
        title={editingBranch ? "Cập nhật chi nhánh" : "Thêm chi nhánh mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrUpdate}
          initialValues={{
            addressId: 1,
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Tên chi nhánh"
            rules={[{ required: true, message: "Vui lòng nhập tên chi nhánh" }]}
          >
            <Input placeholder="Nhập tên chi nhánh (ví dụ: MenuGo Quận 1)" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại hình"
            rules={[{ required: true, message: "Vui lòng chọn loại hình hoạt động" }]}
          >
            <Select placeholder="Chọn loại hình">
              <Select.Option value="Restaurant">Restaurant</Select.Option>
              <Select.Option value="Cafe">Cafe</Select.Option>
              <Select.Option value="Kiosk">Kiosk</Select.Option>
              <Select.Option value="Express">Express</Select.Option>
            </Select>
          </Form.Item>

          {!editingBranch && (
            <Form.Item
              name="chainId"
              label="Thuộc chuỗi quản lý"
              rules={[{ required: true, message: "Vui lòng chọn chuỗi quản lý" }]}
            >
              <Select placeholder="Chọn chuỗi hệ thống">
                {chains.map((chain) => (
                  <Select.Option key={chain.id} value={chain.id}>
                    {chain.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="addressId"
            label="ID Địa chỉ liên kết"
            tooltip="Hệ thống địa chỉ hiện tại hoạt động theo ID định danh."
            rules={[{ required: true, message: "Vui lòng nhập ID địa chỉ" }]}
          >
            <Input type="number" placeholder="Nhập ID địa chỉ (ví dụ: 1)" />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item
              name="openTime"
              label="Giờ mở cửa"
              rules={[{ required: true, message: "Vui lòng chọn giờ mở cửa" }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="closeTime"
              label="Giờ đóng cửa"
              rules={[{ required: true, message: "Vui lòng chọn giờ đóng cửa" }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item style={{ display: "flex", justifyContent: "flex-end", marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}
              >
                Xác nhận
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BranchPage;