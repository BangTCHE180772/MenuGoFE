import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  Table,
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
} from "@ant-design/icons";
import dayjs from "dayjs";
import { searchBranches } from "../api/branchApi";
import "../styles/Branch/BranchPage.css";
import CreateUpdateBranchFormPopup from "../Popup/CreateUpdateBranchFormPopup";

const { RangePicker } = DatePicker;

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const getMockFinancials = (range, customDates, branchCount) => {
  let days = 30;
  if (range === "7days") days = 7;
  else if (range === "thisMonth") days = dayjs().date();
  else if (range === "lastMonth") days = 30;
  else if (range === "thisYear") {
    const start = dayjs().startOf("year");
    days = dayjs().diff(start, "day") + 1;
  } else if (range === "lastYear") days = 365;
  else if (
    range === "custom" &&
    customDates &&
    customDates[0] &&
    customDates[1]
  ) {
    const diff = customDates[1].diff(customDates[0], "day");
    days = diff > 0 ? diff : 1;
  }

  const factor = branchCount > 0 ? branchCount : 3;
  const revenue = factor * days * 5500000;
  const expenses = Math.round(revenue * 0.64);
  const profit = revenue - expenses;

  return { revenue, expenses, profit };
};

const BranchPage = () => {
  // ─── States ────────────────────────────────────────────────────────────────
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [searchKeyword, setSearchKeyword] = useState("");
  // const [filterType, setFilterType] = useState(undefined);
  const [sortBy, setSortBy] = useState("Id");
  const [sortDesc, setSortDesc] = useState(false);

  const [dateRange, setDateRange] = useState("thisMonth");
  const [customDates, setCustomDates] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingBranchObject, setEditingBranchObject] = useState(null);
  //====================================================================================================================Fetch Data
  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        Keyword: searchKeyword || undefined,
        // Type: filterType || undefined,
        SortBy: sortBy,
        Desc: sortDesc,
        Page: currentPage,
        PageSize: pageSize,
      };

      const res = await searchBranches(params);
      const data = res.data || [];
      setBranches(data);

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
  }, [
    searchKeyword,
    // filterType,
    sortBy,
    sortDesc,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBranches();
  }, [loadBranches]);

  //======================================================================================================================Dashboard
  const stats = useMemo(() => {
    return getMockFinancials(dateRange, customDates, branches.length);
  }, [dateRange, customDates, branches.length]);

  const chartData = useMemo(() => {
    const total = stats.revenue + stats.expenses + stats.profit;
    const items = [
      {
        key: "revenue",
        label: "Doanh thu",
        value: stats.revenue,
        color: "#1890ff",
        className: "revenue",
      },
      {
        key: "expenses",
        label: "Chi phí",
        value: stats.expenses,
        color: "#ff4d4f",
        className: "expenses",
      },
      {
        key: "profit",
        label: "Lợi nhuận",
        value: stats.profit,
        color: "#52c41a",
        className: "profit",
      },
    ];

    let accumulatedPercent = 0;
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

  //===================================================================================================================Filter data
  const handleSearch = (e) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadBranches();
    message.success("Làm mới danh sách thành công");
  };

  // const handleTableChange = (pagination, filters, sorter) => {
  //   setCurrentPage(pagination.current);
  //   setPageSize(pagination.pageSize);
  //   if (sorter.field) {
  //     setSortBy(sorter.field === "name" ? "Name" : "Id");
  //     setSortDesc(sorter.order === "descend");
  //   }
  // };

  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    if (sorter.field) {
      const fieldMap = {
        id: "Id",
        name: "Name",
        createdAt: "CreatedAt",
        openTime: "OpenTime",
        closeTime: "CloseTime",
        addressName: "AddressName",
        managerName: "ManagerName",
      };

      if (sorter.order) {
        setSortBy(fieldMap[sorter.field] || "Id");
        setSortDesc(sorter.order === "descend");
      } else {
        setSortBy("Id");
        setSortDesc(false);
      }
    }
  };

  //====================================================================================================================data fomat
  const columns = [
    {
      title: "Tên chi nhánh",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Địa chỉ",
      dataIndex: "addressName",
      key: "addressName",
      sorter: true,
      render: (text) => <span>{text}</span>,
    },
    // {
    //   title: "Loại hình",
    //   dataIndex: "type",
    //   key: "type",
    //   render: (type) => (
    //     <span className={`branch-type-label ${type?.toLowerCase()}`}>
    //       {type || "N/A"}
    //     </span>
    //   ),
    // },
    {
      title: "Giờ mở cửa",
      dataIndex: "openTime",
      key: "openTime",
      sorter: true,
      render: (text) => <span className="branch-time-tag">{text}</span>,
    },
    {
      title: "Giờ đóng cửa",
      dataIndex: "closeTime",
      key: "closeTime",
      sorter: true,
      render: (text) => <span className="branch-time-tag">{text}</span>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Quản lý",
      dataIndex: "managerName",
      key: "managerName",
      sorter: true,
      render: (text) =>
        text || <span style={{ color: "#aaa" }}>Chưa phân công</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      width: 80,
      render: (_, record) => {
        const ActionsMenu = (
          <div className="ant-dropdown-menu">
            <div className="ant-dropdown-menu-item">
              <Button
                type="text"
                onClick={() => {
                  setEditingBranchObject(record);
                  setOpenModal(true);
                }}
              >
                Sửa
              </Button>
            </div>
          </div>
        );

        return (
          <Dropdown dropdownRender={() => ActionsMenu} trigger={["click"]}>
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
      {/*==========================================================================================================dashboard div*/}
      <div className="branch-dashboard-card">
        {/*=====================================================================================================dashboard header*/}
        <div className="branch-dashboard-header">
          <h2 className="branch-dashboard-title">
            Thống Kê Hoạt Động Hệ Thống
          </h2>
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

        {/*============================================================================================================chart div*/}
        <div className="branch-dashboard-body">
          {/* Chart div */}
          <div className="branch-chart-wrapper">
            {/* Pie Chart */}
            <svg viewBox="0 0 220 220" className="branch-svg-chart">
              <circle
                cx="110"
                cy="110"
                r="50"
                fill="none"
                stroke="#f0f0f0"
                strokeWidth="32"
              />
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

            {/* Legend */}
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

            {/* Overlay hiển thị thông số khi hover Legend*/}
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
          </div>

          {/* report div */}
          <div className="branch-stats-grid">
            <div className="branch-stat-card revenue">
              <span className="branch-stat-label">Tổng Doanh Thu</span>
              <span className="branch-stat-value">
                {formatCurrency(stats.revenue)}
              </span>
              <span className="branch-stat-sub">
                Ước tính từ hóa đơn thanh toán
              </span>
            </div>

            <div className="branch-stat-card expenses">
              <span className="branch-stat-label">Tổng Chi Phí</span>
              <span className="branch-stat-value">
                {formatCurrency(stats.expenses)}
              </span>
              <span className="branch-stat-sub">
                Nguyên vật liệu & vận hành
              </span>
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

      {/*===========================================================================================================table div*/}
      <div className="branch-list-card">
        {/* Toolbar */}
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

            <Tooltip title="Làm mới dữ liệu">
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
            </Tooltip>
          </div>

          <div className="branch-toolbar-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                backgroundColor: "var(--color-primary)",
                borderColor: "var(--color-primary)",
              }}
              onClick={() => {
                setEditingBranchObject(null);
                setOpenModal(true);
              }}
            >
              Thêm Chi Nhánh
            </Button>
          </div>
        </div>

        {/* Table */}
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

        <div>
          <CreateUpdateBranchFormPopup
            open={openModal}
            onClose={() => setOpenModal(false)}
            branchObject={editingBranchObject}
            onSuccess={loadBranches}
          />
        </div>
      </div>
    </div>
  );
};

export default BranchPage;
