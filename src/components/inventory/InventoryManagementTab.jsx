import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Space,
  Tag,
  Row,
  Col,
  DatePicker,
  Popconfirm,
  Badge,
  Divider,
  Typography,
  Dropdown,
  message
} from 'antd';
import {
  ImportOutlined,
  ExportOutlined,
  SwapOutlined,
  AuditOutlined,
  BuildOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  UpOutlined,
  FilterOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  BankOutlined,
  FileTextOutlined,
  ContainerOutlined,
  EnvironmentOutlined,
  RightOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllBranches } from '../../api/branchApi';
import { getAllProducts } from '../../api/productApi';
import { deleteDocument } from '../../api/documentApi';
import { useAuth } from '../../context/AuthContext';
import {
  ImportModal,
  ExportModal,
  TransferModal,
  TransferReceiveModal,
  CheckModal,
  ProductionModal
} from './DocumentFormModals';

const { Text } = Typography;
const { RangePicker } = DatePicker;

// ─── CONSTANTS & CONFIG ──────────────────────────────────────────────────────
const DOC_TYPE_CONFIG = {
  1: { label: 'Nhập kho', color: 'blue', icon: <ImportOutlined /> },
  2: { label: 'Xuất hủy', color: 'red', icon: <ExportOutlined /> },
  3: { label: 'Chuyển hàng', color: 'cyan', icon: <SwapOutlined /> },
  4: { label: 'Trả hàng nhập', color: 'orange', icon: <ExportOutlined /> },
  5: { label: 'Kiểm kho', color: 'gold', icon: <AuditOutlined /> },
  6: { label: 'Sản xuất', color: 'purple', icon: <BuildOutlined /> }
};

const SECTION_TITLES = {
  ALL: '📋 TÀI LIỆU',
  '1_4': '📋 NHẬP KHO / TRẢ HÀNG NHẬP',
  '6': '📋 SẢN XUẤT CHẾ BIẾN',
  '3': '📋 CHUYỂN HÀNG CHI NHÁNH',
  '5': '📋 KIỂM KHO & ĐIỀU CHỈNH',
  '2': '📋 XUẤT HỦY HÀNG HÓA',
  partners: '👥 QUẢN LÝ ĐỐI TÁC'
};

const SIDEBAR_HEADER_TITLES = {
  overview: 'TỔNG QUAN',
  '1_4': 'NHẬP HÀNG',
  '4': 'TRẢ HÀNG NHẬP',
  '6': 'SẢN XUẤT',
  '3': 'CHUYỂN HÀNG',
  '5': 'KIỂM KHO',
  '2': 'XUẤT HỦY',
  partners: 'NHÀ CUNG CẤP / ĐỐI TÁC',
  dishes: 'MÓN',
  dish_groups: 'NHÓM MÓN',
  menu_list: 'THỰC ĐƠN',
  rooms_tables: 'PHÒNG / BÀN',
  invoices: 'HÓA ĐƠN',
  returns: 'TRẢ HÀNG',
  employees: 'NHÂN VIÊN',
  cashbook: 'SỔ QUỶ',
  reports: 'BÁO CÁO'
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const InventoryManagementTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Branch & Data states
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Left Sidebar navigation states
  const [activeMainCategory, setActiveMainCategory] = useState('operations'); // 'operations' | 'cashbook' | 'invoices'
  const [isOperationsExpanded, setIsOperationsExpanded] = useState(true);
  const [activeSubOption, setActiveSubOption] = useState('1_4'); // '1_4' | '6' | '3' | '5' | '2' | 'partners'

  // Collapsible Advance Search Panel state
  const [isAdvanceSearchOpen, setIsAdvanceSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Document creation & receive modals states
  const [modalImportOpen, setModalImportOpen] = useState(false);
  const [modalExportOpen, setModalExportOpen] = useState(false);
  const [modalTransferOpen, setModalTransferOpen] = useState(false);
  const [modalTransferReceiveOpen, setModalTransferReceiveOpen] = useState(false);
  const [selectedTransferDoc, setSelectedTransferDoc] = useState(null);
  const [modalCheckOpen, setModalCheckOpen] = useState(false);
  const [modalProductionOpen, setModalProductionOpen] = useState(false);

  // Mock / Real Documents Data
  const [documents, setDocuments] = useState([
    { id: 101, code: 'IM202607261001', type: 1, typeLabel: 'Nhập kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T10:00:00Z', totalAmount: 15500000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
    { id: 102, code: 'EX202607261115', type: 2, typeLabel: 'Xuất hủy', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T11:15:00Z', totalAmount: 450000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
    { id: 103, code: 'TR202607261200', type: 3, typeLabel: 'Chuyển hàng', branchName: 'Chi nhánh Trung Tâm -> CN Quận 3', businessDate: '2026-07-26T12:00:00Z', totalAmount: 3200000, status: 'Completed', transferStatus: 'Pending', creator: 'Quản lý Kho' },
    { id: 104, code: 'AD202607261230', type: 5, typeLabel: 'Kiểm kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T12:30:00Z', totalAmount: 0, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
    { id: 105, code: 'PR202607261245', type: 6, typeLabel: 'Sản xuất', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T12:45:00Z', totalAmount: 2100000, status: 'Completed', transferStatus: 'None', creator: 'Đầu Bếp Trưởng' },
    { id: 106, code: 'IM202607261300', type: 1, typeLabel: 'Nhập kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T13:00:00Z', totalAmount: 8400000, status: 'Completed', transferStatus: 'None', creator: 'Nhân viên Nhập' },
    { id: 107, code: 'RT202607261330', type: 4, typeLabel: 'Trả hàng nhập', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T13:30:00Z', totalAmount: 1200000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
    { id: 108, code: 'TR202607261400', type: 3, typeLabel: 'Chuyển hàng', branchName: 'Chi nhánh Trung Tâm -> CN Gò Vấp', businessDate: '2026-07-26T14:00:00Z', totalAmount: 5100000, status: 'Completed', transferStatus: 'Completed', creator: 'Quản lý Kho' },
    { id: 109, code: 'EX202607261430', type: 2, typeLabel: 'Xuất hủy', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T14:30:00Z', totalAmount: 280000, status: 'Completed', transferStatus: 'None', creator: 'Bếp Phó' },
    { id: 110, code: 'AD202607261500', type: 5, typeLabel: 'Kiểm kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T15:00:00Z', totalAmount: 0, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
    { id: 111, code: 'IM202607261530', type: 1, typeLabel: 'Nhập kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T15:30:00Z', totalAmount: 19200000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
    { id: 112, code: 'PR202607261600', type: 6, typeLabel: 'Sản xuất', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T16:00:00Z', totalAmount: 3800000, status: 'Completed', transferStatus: 'None', creator: 'Đầu Bếp Trưởng' },
    { id: 113, code: 'TR202607261630', type: 3, typeLabel: 'Chuyển hàng', branchName: 'Chi nhánh Trung Tâm -> CN Tân Bình', businessDate: '2026-07-26T16:30:00Z', totalAmount: 4200000, status: 'Completed', transferStatus: 'Pending', creator: 'Quản lý Kho' },
    { id: 114, code: 'RT202607261700', type: 4, typeLabel: 'Trả hàng nhập', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T17:00:00Z', totalAmount: 850000, status: 'Completed', transferStatus: 'None', creator: 'Nhân viên Kho' },
    { id: 115, code: 'IM202607261730', type: 1, typeLabel: 'Nhập kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T17:30:00Z', totalAmount: 6700000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' }
  ]);

  // Partners Data (15 records)
  const [partners] = useState([
    { id: 1, name: 'Công ty Thực Phẩm Sạch VIETFOOD', type: 'Nhà cung cấp', phone: '0901234567', totalDebt: 15500000 },
    { id: 2, name: 'Đơn Vị Vận Chuyển Nhanh 247', type: 'Vận chuyển', phone: '0988776655', totalDebt: 350000 },
    { id: 3, name: 'Nông Trại Rau Xanh Đà Lạt Sạch', type: 'Nhà cung cấp', phone: '0912345678', totalDebt: 0 },
    { id: 4, name: 'Nhà Phân Phối Đồ Uống Tân Hiệp', type: 'Nhà cung cấp', phone: '0933445566', totalDebt: 8200000 },
    { id: 5, name: 'Công Ty Hải Sản Biển Đông', type: 'Nhà cung cấp', phone: '0977889900', totalDebt: 24000000 },
    { id: 6, name: 'Xưởng Bao Bì & In Ấn Hoàng Nam', type: 'Nhà cung cấp', phone: '0944556677', totalDebt: 1200000 },
    { id: 7, name: 'Đội Vận Chuyển Hàng Đông Lạnh Express', type: 'Vận chuyển', phone: '0922334455', totalDebt: 650000 },
    { id: 8, name: 'Công Ty Thịt Bò Nhập Khẩu Mỹ-Úc', type: 'Nhà cung cấp', phone: '0966778899', totalDebt: 45000000 },
    { id: 9, name: 'Cơ Sở Gia Vị & Nước Chấm Truyền Thống', type: 'Nhà cung cấp', phone: '0911223344', totalDebt: 890000 },
    { id: 10, name: 'Đơn Vị Cung Cấp Gas Công Nghiệp Bình Minh', type: 'Nhà cung cấp', phone: '0955667788', totalDebt: 3400000 },
    { id: 11, name: 'Nông Trại Trứng Gà Sạch Ba Huân', type: 'Nhà cung cấp', phone: '0988990011', totalDebt: 1500000 },
    { id: 12, name: 'Công Ty Thiết Bị Bếp Công Nghiệp Inox', type: 'Đối tác dịch vụ', phone: '0933221100', totalDebt: 12500000 },
    { id: 13, name: 'Công Ty Khăn Lạnh & Vật Tư Tiêu Hao', type: 'Nhà cung cấp', phone: '0977665544', totalDebt: 420000 },
    { id: 14, name: 'Đơn Vị Thu Gom Rác Thải Sinh Hoạt MT', type: 'Đối tác dịch vụ', phone: '0944332211', totalDebt: 300000 },
    { id: 15, name: 'Nhà Phân Phối Bia & Nước Giải Khát SABECO', type: 'Nhà cung cấp', phone: '0911998877', totalDebt: 31000000 }
  ]);

  // Cashbook Data (15 records)
  const [cashFlows] = useState([
    { id: 1, code: 'CF-001', date: '2026-07-26T10:00:00Z', direction: 'Outflow', amount: 15500000, category: 'Thanh toán nhập kho NCC', partner: 'Công ty Thực Phẩm Sạch VIETFOOD' },
    { id: 2, code: 'CF-002', date: '2026-07-26T10:30:00Z', direction: 'Inflow', amount: 2450000, category: 'Thu tiền bán hàng ca sáng', partner: 'Khách lẻ' },
    { id: 3, code: 'CF-003', date: '2026-07-26T11:45:00Z', direction: 'Outflow', amount: 350000, category: 'Chi phí vận chuyển', partner: 'Đơn Vị Vận Chuyển Nhanh 247' },
    { id: 4, code: 'CF-004', date: '2026-07-26T12:15:00Z', direction: 'Inflow', amount: 8900000, category: 'Thu tiền đặt tiệc sinh nhật', partner: 'Anh Hoàng (Khách VIP)' },
    { id: 5, code: 'CF-005', date: '2026-07-26T13:00:00Z', direction: 'Outflow', amount: 8200000, category: 'Thanh toán tiền nước giải khát', partner: 'Nhà Phân Phối Đồ Uống Tân Hiệp' },
    { id: 6, code: 'CF-006', date: '2026-07-26T13:40:00Z', direction: 'Inflow', amount: 4150000, category: 'Thu tiền hóa đơn bán hàng', partner: 'Khách lẻ (Bàn 08)' },
    { id: 7, code: 'CF-007', date: '2026-07-26T14:10:00Z', direction: 'Outflow', amount: 1200000, category: 'Chi trả tiền in ấn menu & bao bì', partner: 'Xưởng Bao Bì & In Ấn Hoàng Nam' },
    { id: 8, code: 'CF-008', date: '2026-07-26T14:50:00Z', direction: 'Inflow', amount: 1250000, category: 'Thu tiền cọc đặt bàn trước', partner: 'Chị Lan' },
    { id: 9, code: 'CF-009', date: '2026-07-26T15:20:00Z', direction: 'Outflow', amount: 3400000, category: 'Chi đổi bình gas công nghiệp', partner: 'Gas Bình Minh' },
    { id: 10, code: 'CF-010', date: '2026-07-26T16:00:00Z', direction: 'Inflow', amount: 6700000, category: 'Thu tiền doanh thu bán lẻ ca chiều', partner: 'Khách lẻ' },
    { id: 11, code: 'CF-011', date: '2026-07-26T16:30:00Z', direction: 'Outflow', amount: 4500000, category: 'Tạm ứng lương nhân viên bếp', partner: 'Nguyễn Văn B (Đầu bếp)' },
    { id: 12, code: 'CF-012', date: '2026-07-26T17:00:00Z', direction: 'Inflow', amount: 3100000, category: 'Thu hoàn ứng tiền mua đồ lẻ', partner: 'Quản lý Kho' },
    { id: 13, code: 'CF-013', date: '2026-07-26T17:30:00Z', direction: 'Outflow', amount: 890000, category: 'Chi gia vị & phụ gia bếp', partner: 'Cơ Sở Gia Vị Truyền Thống' },
    { id: 14, code: 'CF-014', date: '2026-07-26T18:00:00Z', direction: 'Inflow', amount: 15400000, category: 'Thu tiền hóa đơn tiệc công ty', partner: 'Công ty Công Nghệ ABC' },
    { id: 15, code: 'CF-015', date: '2026-07-26T18:30:00Z', direction: 'Outflow', amount: 1500000, category: 'Chi phí vệ sinh & diệt khuẩn', partner: 'Dịch vụ Môi Trường MT' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const bRes = await getAllBranches();
        const branchList = Array.isArray(bRes) ? bRes : bRes?.data || [];
        setBranches(branchList);
        if (branchList.length > 0) setSelectedBranchId(branchList[0].id);

        const pRes = await getAllProducts();
        setProducts(Array.isArray(pRes) ? pRes : pRes?.data || []);
      } catch (err) {
        console.error('Error loading inventory data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteDocument = async (id) => {
    try {
      await deleteDocument(id);
      message.success('Xóa chứng từ thành công!');
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      message.error(err.response?.data?.message || 'Xóa chứng từ thất bại.');
    }
  };

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Sub-option filter
      if (activeSubOption === '1_4' && doc.type !== 1 && doc.type !== 4) return false;
      if (activeSubOption === '6' && doc.type !== 6) return false;
      if (activeSubOption === '3' && doc.type !== 3) return false;
      if (activeSubOption === '5' && doc.type !== 5) return false;
      if (activeSubOption === '2' && doc.type !== 2) return false;

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Pending' && doc.transferStatus !== 'Pending') return false;
        if (statusFilter === 'Completed' && doc.status !== 'Completed') return false;
      }

      // Search text
      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchCode = doc.code.toLowerCase().includes(lower);
        const matchCreator = doc.creator?.toLowerCase().includes(lower);
        if (!matchCode && !matchCreator) return false;
      }

      // Date range
      if (dateRange && dateRange[0] && dateRange[1]) {
        const docDate = dayjs(doc.businessDate);
        if (docDate.isBefore(dateRange[0], 'day') || docDate.isAfter(dateRange[1], 'day')) {
          return false;
        }
      }
      return true;
    });
  }, [documents, activeSubOption, statusFilter, searchText, dateRange]);

  const activeBranchObj = branches.find((b) => b.id === selectedBranchId);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontSize: 11 }}>
      
      {/* GLOBAL HIGH-DENSITY TABLE & SIDEBAR CSS OVERRIDES */}
      <style>{`
        .dense-table {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          height: calc(100vh - 148px) !important;
          max-height: calc(100vh - 148px) !important;
          overflow: hidden !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 6px !important;
          background: #ffffff !important;
          position: relative !important;
        }
        .dense-table .ant-table-wrapper,
        .dense-table .ant-spin-nested-loading,
        .dense-table .ant-spin-container {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          height: 100% !important;
          overflow: hidden !important;
        }
        .dense-table .ant-table {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          overflow: hidden !important;
          background: transparent !important;
          border: none !important;
        }
        .dense-table .ant-table-container {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          overflow: hidden !important;
          border: none !important;
        }
        .dense-table .ant-table-header {
          flex-shrink: 0 !important;
        }
        .dense-table .ant-table-body,
        .dense-table .ant-table-content {
          flex: 1 !important;
          min-height: 0 !important;
          max-height: calc(100vh - 218px) !important;
          overflow-y: auto !important;
          overflow-x: auto !important;
        }
        .cashbook-table {
          height: calc(100vh - 198px) !important;
          max-height: calc(100vh - 198px) !important;
        }
        .cashbook-table .ant-table-body,
        .cashbook-table .ant-table-content {
          max-height: calc(100vh - 268px) !important;
        }
        .dense-table .ant-table-placeholder {
          flex: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .dense-table .ant-pagination,
        .dense-table .ant-table-pagination {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          flex-shrink: 0 !important;
          margin: 6px 12px 6px auto !important;
          padding: 4px 0 !important;
          background: #ffffff !important;
          z-index: 10 !important;
        }
        .dense-table .ant-pagination-item {
          border-radius: 50% !important;
          min-width: 24px !important;
          height: 24px !important;
          line-height: 22px !important;
          border-color: #e8442a !important;
          font-size: 11px !important;
        }
        .dense-table .ant-pagination-item-active {
          border-color: #e8442a !important;
          background: #ffffff !important;
        }
        .dense-table .ant-pagination-item-active a {
          color: #e8442a !important;
          font-weight: 700 !important;
        }
        .dense-table .ant-pagination-prev .ant-pagination-item-link,
        .dense-table .ant-pagination-next .ant-pagination-item-link {
          border: none !important;
          background: transparent !important;
          font-size: 11px !important;
          color: #64748b !important;
        }
        .dense-table .ant-table-thead > tr > th {
          font-size: 10px !important;
          font-weight: 700 !important;
          background: #f1f5f9 !important;
          color: #334155 !important;
          padding: 6px 10px !important;
          border-bottom: 1px solid #cbd5e1 !important;
          border-radius: 0 !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 2 !important;
        }
        .dense-table .ant-table-tbody > tr > td {
          font-size: 10px !important;
          padding: 6px 10px !important;
          color: #1e293b !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .dense-table .ant-table-tbody > tr:hover > td {
          background: #f0f7ff !important;
        }

        /* LEFT SIDEBAR SMOOTH STYLES & ACCORDION TRANSITION */
        .sidebar-item {
          padding: 9px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          transition: all 0.25s ease-in-out;
          border-left: 3px solid transparent;
        }
        .sidebar-item:hover {
          background: #fdf2f0;
          color: #e8442a;
          padding-left: 15px;
        }
        .sidebar-item.active {
          background: #fff1f0;
          color: #e8442a;
          font-weight: 700;
          border-left-color: #e8442a;
        }
        .sidebar-sub-container {
          max-height: 0px;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.35s ease-in-out, opacity 0.3s ease-in-out;
          background: #fafafa;
        }
        .sidebar-sub-container.open {
          max-height: 280px;
          opacity: 1;
        }
        .sidebar-sub-item {
          padding: 7px 12px 7px 28px;
          cursor: pointer;
          font-size: 12px;
          color: #64748b;
          transition: all 0.2s ease-in-out;
        }
        .sidebar-sub-item:hover {
          color: #e8442a;
          background: #fff5f3;
          padding-left: 32px;
        }
        .sidebar-sub-item.active {
          color: #e8442a;
          font-weight: 600;
          background: #fee2e2;
          border-left: 2px solid #e8442a;
        }
        .arrow-rotate {
          transition: transform 0.3s ease;
        }
        .arrow-rotate.open {
          transform: rotate(180deg);
        }

        /* FULL ORANGE-RED CAPSULE NAVIGATION BAR STYLES */
        .kiotviet-nav-bar {
          display: flex;
          align-items: center;
          background: linear-gradient(90deg, #e8442a, #f97316);
          border-radius: 20px;
          padding: 3px 10px;
        .kiotviet-nav-item {
          padding: 3px 10px;
          border-radius: 14px;
          color: #ffffff;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          white-space: nowrap;
        }
        .kiotviet-nav-item:hover {
          background: rgba(255, 255, 255, 0.22);
          color: #ffffff;
        }
        .kiotviet-nav-item.active {
          background: #ffffff;
          color: #e8442a;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
      `}</style>
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '3px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 38
        }}
      >
        {/* LEFT GROUP: BRANCH SELECT (315PX) & CAPSULE NAV BAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Space size="small">
            <Text strong style={{ fontSize: 11, color: '#334155' }}>Chi nhánh:</Text>
            <Select
              value={selectedBranchId}
              onChange={(val) => setSelectedBranchId(val)}
              style={{ width: 315 }}
              size="small"
              loading={loading}
            >
              {branches.map((b) => (
                <Select.Option key={b.id} value={b.id}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{b.name}</span>
                </Select.Option>
              ))}
            </Select>
          </Space>

          {/* FULL ORANGE CAPSULE NAVIGATION OPTIONS (SINGLE-PAGE IN-PLACE TAB SWITCHING) */}
          <div className="kiotviet-nav-bar">
            <div className={activeSubOption === 'overview' ? "kiotviet-nav-item active" : "kiotviet-nav-item"} onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('overview'); }}>Tổng quan</div>
            
            {/* HOVER DROPDOWN MENU FOR THỰC ĐƠN */}
            <Dropdown
              dropdownRender={() => (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 8,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #cbd5e1',
                    padding: '4px 0',
                    fontSize: 11,
                    minWidth: 130
                  }}
                >
                  <div
                    onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('dishes'); }}
                    style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'dishes' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'dishes' ? 700 : 500 }}
                  >
                    Món
                  </div>
                  <div
                    onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('dish_groups'); }}
                    style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'dish_groups' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'dish_groups' ? 700 : 500 }}
                  >
                    Nhóm món
                  </div>
                  <div
                    onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('menu_list'); }}
                    style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'menu_list' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'menu_list' ? 700 : 500 }}
                  >
                    Thực đơn
                  </div>
                </div>
              )}
              trigger={['hover']}
            >
              <div className={['dishes', 'dish_groups', 'menu_list'].includes(activeSubOption) ? "kiotviet-nav-item active" : "kiotviet-nav-item"}>Thực đơn</div>
            </Dropdown>
            
            {/* 2-COLUMN HOVER DROPDOWN MENU FOR KHO HÀNG */}
            <Dropdown
              dropdownRender={() => (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 8,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    padding: '8px 0',
                    fontSize: 11,
                    minWidth: 320,
                    overflow: 'hidden'
                  }}
                >
                  {/* LEFT COLUMN: KHO HÀNG OPERATIONAL MODULES */}
                  <div style={{ flex: 1, borderRight: '1px solid #f1f5f9', padding: '2px 0' }}>
                    <div style={{ padding: '4px 14px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8' }}>Kho hàng</div>
                    {[
                      { key: '5', label: 'Kiểm kho' },
                      { key: '6', label: 'Sản xuất' },
                      { key: '3', label: 'Chuyển hàng' },
                      { key: '2', label: 'Xuất hủy' }
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() => {
                          setActiveMainCategory('operations');
                          setActiveSubOption(item.key);
                        }}
                        style={{
                          padding: '6px 14px',
                          cursor: 'pointer',
                          color: activeSubOption === item.key ? '#e8442a' : '#334155',
                          fontWeight: activeSubOption === item.key ? 700 : 500,
                          background: activeSubOption === item.key ? '#fff1f0' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* RIGHT COLUMN: NHẬP HÀNG & ĐỐI TÁC */}
                  <div style={{ flex: 1, padding: '2px 0' }}>
                    <div style={{ padding: '4px 14px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8' }}>Nhập hàng</div>
                    {[
                      { key: '1_4', label: 'Nhập hàng' },
                      { key: '4', label: 'Trả hàng nhập' },
                      { key: 'partners', label: 'Nhà cung cấp / Đối tác' }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveMainCategory('operations');
                          setActiveSubOption(item.key);
                        }}
                        style={{
                          padding: '6px 14px',
                          cursor: 'pointer',
                          color: activeSubOption === item.key ? '#e8442a' : '#334155',
                          fontWeight: activeSubOption === item.key ? 700 : 500,
                          background: activeSubOption === item.key ? '#fff1f0' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              trigger={['hover']}
            >
              <div className={['1_4', '4', '5', '6', '3', '2'].includes(activeSubOption) && activeMainCategory === 'operations' ? "kiotviet-nav-item active" : "kiotviet-nav-item"}>Kho hàng</div>
            </Dropdown>

            {/* NÚT PHÒNG/BÀN (ĐẶT TRƯỚC GIAO DỊCH) */}
            <div
              className={activeSubOption === 'rooms_tables' ? "kiotviet-nav-item active" : "kiotviet-nav-item"}
              onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('rooms_tables'); }}
            >
              Phòng/Bàn
            </div>

            {/* HOVER DROPDOWN MENU FOR GIAO DỊCH (HÓA ĐƠN & TRẢ HÀNG) */}
            <Dropdown
              dropdownRender={() => (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 8,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #cbd5e1',
                    padding: '4px 0',
                    fontSize: 11,
                    minWidth: 120
                  }}
                >
                  <div
                    onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('invoices'); }}
                    style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'invoices' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'invoices' ? 700 : 500 }}
                  >
                    Hóa đơn
                  </div>
                  <div
                    onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('returns'); }}
                    style={{ padding: '6px 14px', cursor: 'pointer', color: activeSubOption === 'returns' ? '#e8442a' : '#334155', fontWeight: activeSubOption === 'returns' ? 700 : 500 }}
                  >
                    Trả hàng
                  </div>
                </div>
              )}
              trigger={['hover']}
            >
              <div className={['invoices', 'returns', 'transactions'].includes(activeSubOption) ? "kiotviet-nav-item active" : "kiotviet-nav-item"}>Giao dịch</div>
            </Dropdown>

            <div className={activeSubOption === 'employees' ? "kiotviet-nav-item active" : "kiotviet-nav-item"} onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('employees'); }}>Nhân viên</div>
            <div className={activeMainCategory === 'cashbook' ? "kiotviet-nav-item active" : "kiotviet-nav-item"} onClick={() => { setActiveMainCategory('cashbook'); setActiveSubOption('cashbook'); }}>Sổ quỹ</div>
            <div className={activeSubOption === 'reports' ? "kiotviet-nav-item active" : "kiotviet-nav-item"} onClick={() => { setActiveMainCategory('operations'); setActiveSubOption('reports'); }}>Báo cáo</div>
          </div>
        </div>

        <Space size="small">
          <Badge status="processing" text={<span style={{ fontSize: 10, color: '#10b981' }}>Live Synced</span>} />
        </Space>
      </div>

      {/* ─── BODY CONTAINER: PERSISTENT FILTER SIDEBAR (190PX) + RIGHT MAIN CONTENT ────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* ─── LEFT SIDEBAR (CHỦ YẾU LÀM CÁC Ô FILTER CHO USER - HIỆN TẠI ĐỂ TRỐNG) ──── */}
        <div
          style={{
            width: 190,
            minWidth: 190,
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            color: '#475569',
            display: 'flex',
            flexDirection: 'column',
            fontSize: 10.5,
            padding: '8px 10px',
            userSelect: 'none'
          }}
        >
          {/* HEADER TÊN TÍNH NĂNG ĐANG TRUY CẬP (ĐỂ TRỐNG KHI Ở TỔNG QUAN) */}
          {activeSubOption !== 'overview' && (
            <div style={{ paddingBottom: 6, marginBottom: 8, borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 11, color: '#e8442a' }}>
              <span style={{ textTransform: 'uppercase', color: '#e8442a', letterSpacing: '0.3px' }}>
                {SIDEBAR_HEADER_TITLES[activeSubOption] || SIDEBAR_HEADER_TITLES[activeMainCategory]}
              </span>
            </div>
          )}

          {/* SIDEBAR BODY CLEARED AND BLANK - RESERVED FOR USER FILTER OPTIONS */}
          <div style={{ flex: 1 }}>
            {/* Khu vực ô Filter dành riêng cho user (hiện tại để trống theo yêu cầu) */}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 6, fontSize: 9.5, color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
            MenuGo ERP v2.5
          </div>
        </div>

        {/* ─── RIGHT MAIN CONTENT AREA (FLUSH FULL HEIGHT & ULTRA HIGH DATA DENSITY) ──── */}
        <div style={{ flex: 1, padding: 0, overflow: 'hidden', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          
          {/* VIEW: CHỨNG TỪ KHO HÀNG HÓA (NHẬP, TRẢ, XUẤT HỦY, CHUYỂN HÀNG, KIỂM KHO, SẢN XUẤT) */}
          {['1_4', '4', '2', '3', '5', '6'].includes(activeSubOption) && activeMainCategory === 'operations' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              {/* CONTENT ACTION HEADER: SEARCH BAR (LEFT) & ACTION BUTTONS (RIGHT) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                {/* THANH SEARCH KHỐI CONTENT (GỌN VỪA VẶN CHUẨN PILL) */}
                <Input
                  placeholder="Theo mã phiếu..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{
                    width: 240,
                    height: 24,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: '#1e293b',
                    borderRadius: 16,
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
                  }}
                />
                <Space wrap size={4}>
                  {activeSubOption === '1_4' && (
                    <Button size="small" type="primary" onClick={() => setModalImportOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
                      + Nhập kho
                    </Button>
                  )}

                  {activeSubOption === '4' && (
                    <Button size="small" type="primary" onClick={() => message.info('Mở form Trả hàng nhập')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
                      + Trả hàng nhập
                    </Button>
                  )}

                  {activeSubOption === '2' && (
                    <Button size="small" type="primary" onClick={() => setModalExportOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
                      + Xuất hủy
                    </Button>
                  )}

                  {activeSubOption === '3' && (
                    <Button size="small" type="primary" onClick={() => setModalTransferOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
                      + Chuyển hàng
                    </Button>
                  )}

                  {activeSubOption === '5' && (
                    <Button size="small" type="primary" onClick={() => setModalCheckOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
                      + Kiểm kho
                    </Button>
                  )}

                  {activeSubOption === '6' && (
                    <Button size="small" type="primary" onClick={() => setModalProductionOpen(true)} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
                      + Sản xuất
                    </Button>
                  )}

                  <Button
                    size="small"
                    onClick={() => message.info('Đã làm mới dữ liệu chứng từ.')}
                    style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}
                  >
                    Làm mới
                  </Button>

                  <Button
                    size="small"
                    onClick={() => message.success('Đã xuất file dữ liệu chứng từ thành công!')}
                    style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}
                  >
                    Xuất file
                  </Button>
                </Space>
              </div>

              {/* DATA TABLE */}
              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={filteredDocuments}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
                  size="small"
                  columns={[
                    {
                      title: 'MÃ PHIẾU',
                      dataIndex: 'code',
                      render: (text) => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{text}</b>
                    },
                    {
                      title: 'LOẠI PHIẾU',
                      dataIndex: 'type',
                      render: (typeVal) => {
                        const cfg = DOC_TYPE_CONFIG[typeVal] || { label: 'Khác', color: 'default', icon: null };
                        return <Tag color={cfg.color} style={{ fontSize: 9.5, padding: '0 3px', lineHeight: '16px' }}>{cfg.label}</Tag>;
                      }
                    },
                    { title: 'CHI NHÁNH', dataIndex: 'branchName', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    {
                      title: 'NGÀY CHỨNG TỪ',
                      dataIndex: 'businessDate',
                      render: (date) => <span style={{ fontSize: 10 }}>{dayjs(date).format('DD/MM/YYYY HH:mm')}</span>
                    },
                    {
                      title: 'GIÁ TRỊ (VNĐ)',
                      dataIndex: 'totalAmount',
                      align: 'right',
                      render: (val) => <b style={{ fontSize: 10.5 }}>{val ? val.toLocaleString() : 0} đ</b>
                    },
                    {
                      title: 'TRẠNG THÁI',
                      dataIndex: 'status',
                      render: (status, record) => {
                        if (record.type === 3 && record.transferStatus === 'Pending') {
                          return <Tag color="warning" style={{ fontSize: 9.5, padding: '0 3px' }}>Chờ nhận kho</Tag>;
                        }
                        return <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Hoàn thành</Tag>;
                      }
                    },
                    { title: 'NGƯỜI TẠO', dataIndex: 'creator', render: t => <span style={{ fontSize: 10, color: '#64748b' }}>{t}</span> },
                    {
                      title: 'THAO TÁC',
                      key: 'action',
                      align: 'center',
                      render: (_, record) => (
                        <Space size={2}>
                          {record.type === 3 && record.transferStatus === 'Pending' && (
                            <Button
                              size="small"
                              type="primary"
                              icon={<CheckCircleOutlined style={{ fontSize: 9.5 }} />}
                              style={{ fontSize: 9.5, height: 20, padding: '0 4px' }}
                              onClick={() => {
                                setSelectedTransferDoc(record);
                                setModalTransferReceiveOpen(true);
                              }}
                            >
                              Nhận
                            </Button>
                          )}
                          <Popconfirm
                            title="Xóa chứng từ?"
                            onConfirm={() => handleDeleteDocument(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                          >
                            <Button size="small" type="text" danger icon={<DeleteOutlined style={{ fontSize: 10 }} />} style={{ height: 20, padding: '0 4px' }} />
                          </Popconfirm>
                        </Space>
                      )
                    }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: ĐỐI TÁC (PARTNERS VIEW - ĐỘC LẬP KHÔNG LẶP BẢNG CHỨNG TỪ) */}
          {activeMainCategory === 'operations' && activeSubOption === 'partners' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo tên đối tác..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{
                    width: 240,
                    height: 24,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: '#1e293b',
                    borderRadius: 16,
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
                  }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form thêm Đối tác')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
                    + Thêm đối tác
                  </Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới danh sách đối tác.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>
                    Làm mới
                  </Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file đối tác!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>
                    Xuất file
                  </Button>
                </Space>
              </div>

              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={partners}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
                  columns={[
                    { title: 'TÊN ĐỐI TÁC', dataIndex: 'name', render: t => <b style={{ fontSize: 10.5, color: '#0f172a' }}>{t}</b> },
                    { title: 'PHÂN LOẠI', dataIndex: 'type', render: t => <Tag color="blue" style={{ fontSize: 9.5, padding: '0 3px' }}>{t}</Tag> },
                    { title: 'SỐ ĐIỆN THOẠI', dataIndex: 'phone', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'CÔNG NỢ HỆ THỐNG', dataIndex: 'totalDebt', align: 'right', render: v => <b style={{ fontSize: 10.5, color: '#dc2626' }}>{v.toLocaleString()} VNĐ</b> }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: SỔ QUỶ (CASHBOOK VIEW - ĐỘC LẬP TÁCH NÚT PHIẾU THU & PHIẾU CHI) */}
          {activeMainCategory === 'cashbook' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo mã phiếu thu/chi..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{
                    width: 240,
                    height: 24,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: '#1e293b',
                    borderRadius: 16,
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
                  }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form Lập phiếu THU')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
                    + Lập phiếu thu
                  </Button>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form Lập phiếu CHI')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>
                    + Lập phiếu chi
                  </Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới sổ quỹ.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>
                    Làm mới
                  </Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file sổ quỹ!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>
                    Xuất file
                  </Button>
                </Space>
              </div>

              <Row gutter={6} style={{ marginBottom: 4 }}>
                <Col span={8}>
                  <div style={{ padding: '4px 8px', background: '#eff6ff', borderRadius: 4, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: 9.5, color: '#64748b' }}>Tổng Thu Quỹ:</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563eb' }}>+2,450,000 đ</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ padding: '4px 8px', background: '#fef2f2', borderRadius: 4, border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: 9.5, color: '#64748b' }}>Tổng Chi Quỹ:</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2626' }}>-15,850,000 đ</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ padding: '4px 8px', background: '#ecfdf5', borderRadius: 4, border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: 9.5, color: '#64748b' }}>Số Dư Quỹ Tiền Mặt:</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#059669' }}>45,200,000 đ</div>
                  </div>
                </Col>
              </Row>

              <div className="dense-table cashbook-table" style={{ flex: 1, overflow: 'hidden' }}>
                <Table
                  dataSource={cashFlows}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 268px)' }}
                  columns={[
                    { title: 'MÃ PHIẾU', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
                    { title: 'NGÀY SỔ QUỶ', dataIndex: 'date', render: d => <span style={{ fontSize: 10 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</span> },
                    {
                      title: 'LOẠI QUỸ',
                      dataIndex: 'direction',
                      render: dir => dir === 'Inflow' ? <Tag color="green" style={{ fontSize: 9.5, padding: '0 3px' }}>Thu tiền</Tag> : <Tag color="red" style={{ fontSize: 9.5, padding: '0 3px' }}>Chi tiền</Tag>
                    },
                    { title: 'HẠNG MỤC', dataIndex: 'category', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'ĐỐI TÁC / KHÁCH', dataIndex: 'partner', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    {
                      title: 'SỐ TIỀN',
                      dataIndex: 'amount',
                      align: 'right',
                      render: (val, r) => (
                        <b style={{ fontSize: 10.5, color: r.direction === 'Inflow' ? '#059669' : '#dc2626' }}>
                          {r.direction === 'Inflow' ? '+' : '-'}{val.toLocaleString()} đ
                        </b>
                      )
                    }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: HÓA ĐƠN & GIAO DỊCH (INVOICES VIEW) */}
          {activeSubOption === 'invoices' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo mã hóa đơn..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form Lập hóa đơn')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Lập hóa đơn</Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
                </Space>
              </div>
              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={[
                    { id: 1, code: 'HD20260726001', date: '2026-07-26T10:15:00Z', customer: 'Anh Tuấn (Bàn 03)', total: 450000, status: 'Paid' },
                    { id: 2, code: 'HD20260726002', date: '2026-07-26T11:00:00Z', customer: 'Chị Mai (VIP 1)', total: 1200000, status: 'Paid' },
                    { id: 3, code: 'HD20260726003', date: '2026-07-26T11:30:00Z', customer: 'Anh Hoàng (Bàn 05)', total: 890000, status: 'Paid' },
                    { id: 4, code: 'HD20260726004', date: '2026-07-26T12:15:00Z', customer: 'Chị Linh (Bàn 01)', total: 350000, status: 'Paid' },
                    { id: 5, code: 'HD20260726005', date: '2026-07-26T12:45:00Z', customer: 'Anh Đức (VIP 2)', total: 2400000, status: 'Paid' },
                    { id: 6, code: 'HD20260726006', date: '2026-07-26T13:20:00Z', customer: 'Khách lẻ (Bàn 08)', total: 670000, status: 'Paid' },
                    { id: 7, code: 'HD20260726007', date: '2026-07-26T14:00:00Z', customer: 'Công ty FPT (Sảnh chính)', total: 5800000, status: 'Paid' },
                    { id: 8, code: 'HD20260726008', date: '2026-07-26T14:40:00Z', customer: 'Chị Hải (Bàn 10)', total: 520000, status: 'Paid' },
                    { id: 9, code: 'HD20260726009', date: '2026-07-26T15:15:00Z', customer: 'Anh Nam (Bàn 04)', total: 980000, status: 'Paid' },
                    { id: 10, code: 'HD20260726010', date: '2026-07-26T16:00:00Z', customer: 'Chị Thảo (VIP 3)', total: 3100000, status: 'Paid' },
                    { id: 11, code: 'HD20260726011', date: '2026-07-26T16:30:00Z', customer: 'Anh Hùng (Bàn 06)', total: 420000, status: 'Paid' },
                    { id: 12, code: 'HD20260726012', date: '2026-07-26T17:10:00Z', customer: 'Khách lẻ (Bàn 02)', total: 760000, status: 'Paid' }
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
                  columns={[
                    { title: 'MÃ HÓA ĐƠN', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
                    { title: 'NGÀY LẬP', dataIndex: 'date', render: d => <span style={{ fontSize: 10 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</span> },
                    { title: 'KHÁCH HÀNG', dataIndex: 'customer', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'TỔNG TIỀN', dataIndex: 'total', align: 'right', render: v => <b style={{ fontSize: 10.5 }}>{v.toLocaleString()} đ</b> },
                    { title: 'TRẠNG THÁI', dataIndex: 'status', render: () => <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Đã thanh toán</Tag> }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: TRẢ HÀNG KHÁCH HÀNG (RETURNS VIEW) */}
          {activeSubOption === 'returns' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo mã phiếu trả..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form Tạo trả hàng')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Tạo trả hàng</Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
                </Space>
              </div>
              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={[
                    { id: 1, code: 'TH20260726001', date: '2026-07-26T14:20:00Z', customer: 'Khách lẻ (Bàn 05)', amount: 150000, reason: 'Đổi món ăn' },
                    { id: 2, code: 'TH20260726002', date: '2026-07-26T15:10:00Z', customer: 'Anh Minh (VIP 1)', amount: 220000, reason: 'Khách đổi nước uống' },
                    { id: 3, code: 'TH20260726003', date: '2026-07-26T16:05:00Z', customer: 'Chị Hồng (Bàn 02)', amount: 95000, reason: 'Hủy món gọi thừa' },
                    { id: 4, code: 'TH20260726004', date: '2026-07-26T16:45:00Z', customer: 'Khách lẻ (Bàn 09)', amount: 180000, reason: 'Món ăn nguội khách đổi' },
                    { id: 5, code: 'TH20260726005', date: '2026-07-26T17:30:00Z', customer: 'Anh Bảo (VIP 2)', amount: 450000, reason: 'Khách bớt suất tiệc' }
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
                  columns={[
                    { title: 'MÃ PHIẾU TRẢ', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#dc2626' }}>{t}</b> },
                    { title: 'NGÀY TRẢ', dataIndex: 'date', render: d => <span style={{ fontSize: 10 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</span> },
                    { title: 'KHÁCH HÀNG', dataIndex: 'customer', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'GIÁ TRỊ HOÀN', dataIndex: 'amount', align: 'right', render: v => <b style={{ fontSize: 10.5, color: '#dc2626' }}>{v.toLocaleString()} đ</b> },
                    { title: 'LÝ DO TRẢ', dataIndex: 'reason', render: t => <span style={{ fontSize: 10, color: '#64748b' }}>{t}</span> }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: MÓN ĂN (DISHES VIEW) */}
          {activeSubOption === 'dishes' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo tên món..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form thêm Món ăn')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Thêm món</Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
                </Space>
              </div>
              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={[
                    { id: 1, code: 'M001', name: 'Lẩu Thái Hải Sản Đặc Biệt', group: 'Món Lẩu', price: 299000, status: 'Active' },
                    { id: 2, code: 'M002', name: 'Bò Lúc Lắc Sốt Tiêu Đen', group: 'Món Xào', price: 155000, status: 'Active' },
                    { id: 3, code: 'M003', name: 'Trà Đào Cam Sả Thạch', group: 'Đồ Uống', price: 45000, status: 'Active' },
                    { id: 4, code: 'M004', name: 'Cơm Chiên Dương Châu Hải Sản', group: 'Món Cơm', price: 95000, status: 'Active' },
                    { id: 5, code: 'M005', name: 'Gà Nướng Mật Ong Nguyên Con', group: 'Món Nướng', price: 240000, status: 'Active' },
                    { id: 6, code: 'M006', name: 'Súp Hải Sản Tóc Tiên', group: 'Khai Vị', price: 65000, status: 'Active' },
                    { id: 7, code: 'M007', name: 'Mì Ý Sốt Bò Bằm Bolognese', group: 'Món Mì', price: 120000, status: 'Active' },
                    { id: 8, code: 'M008', name: 'Salad Cá Hồi Sốt Chanh Dây', group: 'Khai Vị', price: 135000, status: 'Active' },
                    { id: 9, code: 'M009', name: 'Tôm Hùm Bỏ Lò Phô Mai', group: 'Hải Sản', price: 580000, status: 'Active' },
                    { id: 10, code: 'M010', name: 'Sinh Tố Bơ Nước Cốt Dừa', group: 'Đồ Uống', price: 50000, status: 'Active' },
                    { id: 11, code: 'M011', name: 'Mực Hấp Gừng Hành', group: 'Hải Sản', price: 175000, status: 'Active' },
                    { id: 12, code: 'M012', name: 'Lẩu Nấm Chim Câu Trắng', group: 'Món Lẩu', price: 350000, status: 'Active' },
                    { id: 13, code: 'M013', name: 'Rau Muống Xào Tỏi Hồng Bàng', group: 'Món Xào', price: 45000, status: 'Active' },
                    { id: 14, code: 'M014', name: 'Bia Heineken Silver Cống', group: 'Đồ Uống', price: 35000, status: 'Active' },
                    { id: 15, code: 'M015', name: 'Bánh Mì Tỏi Phô Mai Nướng', group: 'Tráng Miệng', price: 40000, status: 'Active' }
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
                  columns={[
                    { title: 'MÃ MÓN', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
                    { title: 'TÊN MÓN ĂN', dataIndex: 'name', render: t => <b style={{ fontSize: 10.5 }}>{t}</b> },
                    { title: 'NHÓM MÓN', dataIndex: 'group', render: t => <Tag color="blue" style={{ fontSize: 9.5, padding: '0 3px' }}>{t}</Tag> },
                    { title: 'GIÁ BÁN (VNĐ)', dataIndex: 'price', align: 'right', render: v => <b style={{ fontSize: 10.5, color: '#059669' }}>{v.toLocaleString()} đ</b> },
                    { title: 'TRẠNG THÁI', dataIndex: 'status', render: () => <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Đang kinh doanh</Tag> }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: NHÓM MÓN (DISH GROUPS VIEW) */}
          {activeSubOption === 'dish_groups' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo tên nhóm món..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form thêm Nhóm món')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Thêm nhóm món</Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
                </Space>
              </div>
              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={[
                    { id: 1, code: 'NG01', name: 'Món Lẩu', count: 12, note: 'Lẩu truyền thống & hiện đại' },
                    { id: 2, code: 'NG02', name: 'Món Xào', count: 18, note: 'Các món xào nóng hổi' },
                    { id: 3, code: 'NG03', name: 'Đồ Uống', count: 25, note: 'Trà, sinh tố, nước giải khát' },
                    { id: 4, code: 'NG04', name: 'Món Nướng', count: 14, note: 'Nướng than hoa & bỏ lò' },
                    { id: 5, code: 'NG05', name: 'Khai Vị & Salad', count: 10, note: 'Gỏi, salad, món súp' },
                    { id: 6, code: 'NG06', name: 'Món Mì & Cơm', count: 16, note: 'Cơm chiên, mì xào, mỳ Ý' },
                    { id: 7, code: 'NG07', name: 'Hải Sản Tươi Sống', count: 22, note: 'Tôm, cua, cá, mực hằng ngày' },
                    { id: 8, code: 'NG08', name: 'Tráng Miệng & Chè', count: 8, note: 'Kem, chè, hoa quả tươi' },
                    { id: 9, code: 'NG09', name: 'Món Hấp & Luộc', count: 15, note: 'Hấp thanh vị, giữ trọn dưỡng chất' },
                    { id: 10, code: 'NG10', name: 'Món Chiên Rán', count: 20, note: 'Chiên giòn rụm đậm vị' },
                    { id: 11, code: 'NG11', name: 'Đặc Sản Vùng Miền', count: 11, note: 'Hương vị truyền thống các vùng' },
                    { id: 12, code: 'NG12', name: 'Cơm Niêu & Cơm Thố', count: 9, note: 'Cơm niêu nóng hổi cháy giòn' },
                    { id: 13, code: 'NG13', name: 'Lẩu Hai Ngăn VIP', count: 7, note: 'Nước lẩu kép tùy chọn vị' },
                    { id: 14, code: 'NG14', name: 'Rượu & Đồ Uống Cùng Cồn', count: 30, note: 'Rượu vang, bia craft cao cấp' },
                    { id: 15, code: 'NG15', name: 'Nước Ép & Sinh Tố Tươi', count: 18, note: 'Trái cây tươi nguyên chất 100%' },
                    { id: 16, code: 'NG16', name: 'Món Chay Thanh Đạm', count: 14, note: 'Chế biến từ nấm và rau củ tươi' },
                    { id: 17, code: 'NG17', name: 'Món Trẻ Em (Kids Menu)', count: 6, note: 'Thiết kế riêng dinh dưỡng cho trẻ' },
                    { id: 18, code: 'NG18', name: 'Combo Gia Đình 4-6 Người', count: 5, note: 'Tiết kiệm 15% so với gọi món lẻ' },
                    { id: 19, code: 'NG19', name: 'Set Tiệc Công Ty', count: 4, note: 'Thực đơn tiệc trọn gói cao cấp' },
                    { id: 20, code: 'NG20', name: 'Món Đi Kèm & Gia Vị Extra', count: 22, note: 'Sốt chấm, kim chi, dưa góp' },
                    { id: 21, code: 'NG21', name: 'Bánh Ngọt & Soft Cake', count: 10, note: 'Bánh tráng miệng phong cách Âu' },
                    { id: 22, code: 'NG22', name: 'Cà Phê & Trà Chiều', count: 16, note: 'Espresso, Matcha, trà hoa quả' },
                    { id: 23, code: 'NG23', name: 'Súp & Chao Đêm', count: 8, note: 'Phục vụ ca đêm thanh nhẹ' },
                    { id: 24, code: 'NG24', name: 'Hải Sản Cao Cấp (Order Trước)', count: 5, note: 'Cua Kingcrab, tôm hùm Alaska' },
                    { id: 25, code: 'NG25', name: 'Món Nướng Hàn Quốc', count: 19, note: 'Dẻ sườn bò, ba chỉ ướp sốt' }
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
                  columns={[
                    { title: 'MÃ NHÓM', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
                    { title: 'TÊN NHÓM MÓN', dataIndex: 'name', render: t => <b style={{ fontSize: 10.5 }}>{t}</b> },
                    { title: 'SỐ LƯỢNG MÓN', dataIndex: 'count', align: 'center', render: c => <Tag color="orange" style={{ fontSize: 9.5, padding: '0 4px' }}>{c} món</Tag> },
                    { title: 'GHI CHÚ', dataIndex: 'note', render: t => <span style={{ fontSize: 10, color: '#64748b' }}>{t}</span> }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: THỰC ĐƠN (MENU LIST VIEW) */}
          {activeSubOption === 'menu_list' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo tên thực đơn..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form tạo Thực đơn')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Thêm thực đơn</Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
                </Space>
              </div>
              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={[
                    { id: 1, code: 'TD01', name: 'Thực đơn Bán Hàng Hằng Ngày', branch: 'Tất cả chi nhánh', status: 'Active' },
                    { id: 2, code: 'TD02', name: 'Thực đơn Tiệc & Sự Kiện', branch: 'Chi nhánh Trung Tâm', status: 'Active' },
                    { id: 3, code: 'TD03', name: 'Thực đơn Ăn Sáng & Coffee', branch: 'Tất cả chi nhánh', status: 'Active' },
                    { id: 4, code: 'TD04', name: 'Thực đơn Buffet Lẩu Hải Sản', branch: 'Chi nhánh Quận 3', status: 'Active' },
                    { id: 5, code: 'TD05', name: 'Thực đơn Khuyến Mãi Hè 2026', branch: 'Tất cả chi nhánh', status: 'Active' },
                    { id: 6, code: 'TD06', name: 'Thực đơn Mang Về & GrabFood', branch: 'Tất cả chi nhánh', status: 'Active' }
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
                  columns={[
                    { title: 'MÃ THỰC ĐƠN', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
                    { title: 'TÊN THỰC ĐƠN', dataIndex: 'name', render: t => <b style={{ fontSize: 10.5 }}>{t}</b> },
                    { title: 'ÁP DỤNG CHI NHÁNH', dataIndex: 'branch', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'TRẠNG THÁI', dataIndex: 'status', render: () => <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Đang áp dụng</Tag> }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: PHÒNG / BÀN (ROOMS & TABLES VIEW) */}
          {activeSubOption === 'rooms_tables' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo tên phòng/bàn..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form tạo Phòng/Bàn')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Thêm phòng/bàn</Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
                </Space>
              </div>
              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={[
                    { id: 1, code: 'TB01', name: 'Bàn 01', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Trống' },
                    { id: 2, code: 'TB02', name: 'Bàn 02', area: 'Tầng 1 - Sảnh chính', capacity: '6 người', status: 'Trống' },
                    { id: 3, code: 'TB03', name: 'Bàn 03', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Đang phục vụ' },
                    { id: 4, code: 'TB04', name: 'Bàn 04', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Trống' },
                    { id: 5, code: 'TB05', name: 'Bàn 05', area: 'Tầng 1 - Sảnh chính', capacity: '8 người', status: 'Đang phục vụ' },
                    { id: 6, code: 'TB06', name: 'Bàn 06', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Trống' },
                    { id: 7, code: 'TB07', name: 'Bàn 07', area: 'Tầng 1 - Sảnh chính', capacity: '6 người', status: 'Trống' },
                    { id: 8, code: 'TB08', name: 'Bàn 08', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Đang phục vụ' },
                    { id: 9, code: 'TB09', name: 'Bàn 09', area: 'Tầng 2 - Ban công', capacity: '4 người', status: 'Trống' },
                    { id: 10, code: 'TB10', name: 'Bàn 10', area: 'Tầng 2 - Ban công', capacity: '6 người', status: 'Trống' },
                    { id: 11, code: 'VIP01', name: 'Phòng VIP 1', area: 'Tầng 2 - Phòng VIP', capacity: '12 người', status: 'Đang phục vụ' },
                    { id: 12, code: 'VIP02', name: 'Phòng VIP 2', area: 'Tầng 2 - Phòng VIP', capacity: '16 người', status: 'Trống' },
                    { id: 13, code: 'VIP03', name: 'Phòng VIP 3', area: 'Tầng 2 - Phòng VIP', capacity: '20 người', status: 'Đang phục vụ' },
                    { id: 14, code: 'TB11', name: 'Bàn Sân Vườn 01', area: 'Khu Sân Vườn', capacity: '6 người', status: 'Trống' },
                    { id: 15, code: 'TB12', name: 'Bàn Sân Vườn 02', area: 'Khu Sân Vườn', capacity: '8 người', status: 'Trống' }
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
                  columns={[
                    { title: 'MÃ PHÒNG/BÀN', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
                    { title: 'TÊN PHÒNG/BÀN', dataIndex: 'name', render: t => <b style={{ fontSize: 10.5 }}>{t}</b> },
                    { title: 'KHU VỰC', dataIndex: 'area', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'SỨC CHỨA', dataIndex: 'capacity', render: c => <Tag color="blue" style={{ fontSize: 9.5, padding: '0 3px' }}>{c}</Tag> },
                    { title: 'TRẠNG THÁI', dataIndex: 'status', render: s => s === 'Trống' ? <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Trống</Tag> : <Tag color="error" style={{ fontSize: 9.5, padding: '0 3px' }}>Đang phục vụ</Tag> }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: NHÂN VIÊN (EMPLOYEES VIEW) */}
          {activeSubOption === 'employees' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo tên nhân viên..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Mở form thêm Nhân viên')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Thêm nhân viên</Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
                </Space>
              </div>
              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={[
                    { id: 1, code: 'NV001', name: 'Nguyen Van A', role: 'Quản lý Kho', phone: '0901234567', status: 'Active' },
                    { id: 2, code: 'NV002', name: 'Tran Thi B', role: 'Đầu Bếp Trưởng', phone: '0912345678', status: 'Active' },
                    { id: 3, code: 'NV003', name: 'Le Van C', role: 'Nhân viên Phục vụ', phone: '0923456789', status: 'Active' },
                    { id: 4, code: 'NV004', name: 'Pham Thi D', role: 'Thu Ngân Ca Sáng', phone: '0934567890', status: 'Active' },
                    { id: 5, code: 'NV005', name: 'Hoang Van E', role: 'Pha Chế Barista', phone: '0945678901', status: 'Active' },
                    { id: 6, code: 'NV006', name: 'Vu Thi F', role: 'Nhân viên Tiếp Tân', phone: '0956789012', status: 'Active' },
                    { id: 7, code: 'NV007', name: 'Doan Van G', role: 'Bếp Phó Chuyên Món Lẩu', phone: '0967890123', status: 'Active' },
                    { id: 8, code: 'NV008', name: 'Bui Thi H', role: 'Quản Lý Thu Ngân Ca Tối', phone: '0978901234', status: 'Active' },
                    { id: 9, code: 'NV009', name: 'Ngo Van I', role: 'Nhân viên Giao Hàng', phone: '0989012345', status: 'Active' },
                    { id: 10, code: 'NV010', name: 'Trinh Thi K', role: 'Tổ Trưởng Phục Vụ Tầng 2', phone: '0990123456', status: 'Active' },
                    { id: 11, code: 'NV011', name: 'Phung Van L', role: 'Bảo Vệ & Giữ Xe', phone: '0909876543', status: 'Active' },
                    { id: 12, code: 'NV012', name: 'Ly Thi M', role: 'Nhân viên Vệ Sinh', phone: '0918765432', status: 'Active' }
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 218px)' }}
                  columns={[
                    { title: 'MÃ NHÂN VIÊN', dataIndex: 'code', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
                    { title: 'HỌ VÀ TÊN', dataIndex: 'name', render: t => <b style={{ fontSize: 10.5 }}>{t}</b> },
                    { title: 'VỊ TRÍ / CHỨC VỤ', dataIndex: 'role', render: r => <Tag color="purple" style={{ fontSize: 9.5, padding: '0 3px' }}>{r}</Tag> },
                    { title: 'SỐ ĐIỆN THOẠI', dataIndex: 'phone', render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'TRẠNG THÁI', dataIndex: 'status', render: () => <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Đang làm việc</Tag> }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* VIEW: BÁO CÁO (REPORTS VIEW) */}
          {activeSubOption === 'reports' && (
            <Card
              variant="borderless"
              style={{ borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { padding: '4px 6px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                <Input
                  placeholder="Theo loại báo cáo..."
                  prefix={<SearchOutlined style={{ color: '#475569', fontSize: 11.5, marginRight: 2 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: 240, height: 24, fontSize: 10.5, fontWeight: 600, color: '#1e293b', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                />
                <Space wrap size={4}>
                  <Button size="small" type="primary" onClick={() => message.info('Xuất báo cáo tổng hợp')} style={{ background: '#e8442a', borderColor: '#e8442a', fontSize: 10.5, fontWeight: 600, height: 22, padding: '0 8px', borderRadius: 4 }}>+ Tạo báo cáo</Button>
                  <Button size="small" onClick={() => message.info('Đã làm mới.')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Làm mới</Button>
                  <Button size="small" onClick={() => message.success('Đã xuất file!')} style={{ fontSize: 10.5, fontWeight: 500, height: 22, padding: '0 8px', borderRadius: 4, borderColor: '#cbd5e1', color: '#334155' }}>Xuất file</Button>
                </Space>
              </div>
              <div className="dense-table" style={{ flex: 1, overflow: 'hidden', marginTop: 4 }}>
                <Table
                  dataSource={[
                    { id: 1, code: 'BC-KHO-01', name: 'Báo cáo tồn kho tổng hợp tháng 7', type: 'Kho hàng', period: 'Tháng 07/2026', date: '26/07/2026 14:00', creator: 'Quản lý Kho', dept: 'Bộ phận Kho', branch: 'Chi nhánh Trung Tâm', records: 1450, total: 450000000, format: 'PDF / Excel', status: 'Đã phê duyệt' },
                    { id: 2, code: 'BC-TC-01', name: 'Báo cáo doanh thu & sổ quỹ chi nhánh', type: 'Tài chính', period: 'Tháng 07/2026', date: '26/07/2026 15:30', creator: 'Kế toán trưởng', dept: 'Phòng Tài chính', branch: 'Chi nhánh Trung Tâm', records: 890, total: 1250000000, format: 'Excel', status: 'Đã phê duyệt' },
                    { id: 3, code: 'BC-BH-01', name: 'Báo cáo top món ăn bán chạy', type: 'Bán hàng', period: 'Tuần 30/2026', date: '26/07/2026 16:15', creator: 'Giám sát bán hàng', dept: 'Phòng Kinh doanh', branch: 'Tất cả chi nhánh', records: 120, total: 320000000, format: 'PDF', status: 'Đã phê duyệt' },
                    { id: 4, code: 'BC-KHO-02', name: 'Báo cáo xuất hủy nguyên liệu quá hạn', type: 'Kho hàng', period: 'Tháng 07/2026', date: '25/07/2026 09:00', creator: 'Thủ kho chính', dept: 'Bộ phận Kho', branch: 'Chi nhánh Quận 3', records: 35, total: 12500000, format: 'Excel', status: 'Chờ duyệt' },
                    { id: 5, code: 'BC-NV-01', name: 'Báo cáo công nợ nhà cung cấp chi tiết', type: 'Công nợ', period: 'Qúy II/2026', date: '25/07/2026 11:20', creator: 'Kế toán công nợ', dept: 'Phòng Tài chính', branch: 'Chi nhánh Trung Tâm', records: 48, total: 850000000, format: 'Excel', status: 'Đã phê duyệt' },
                    { id: 6, code: 'BC-BH-02', name: 'Báo cáo hiệu suất phục vụ theo phòng/bàn', type: 'Bán hàng', period: 'Tháng 07/2026', date: '24/07/2026 17:45', creator: 'Quản lý vận hành', dept: 'Phòng Vận hành', branch: 'Chi nhánh Trung Tâm', records: 560, total: 680000000, format: 'PDF', status: 'Đã phê duyệt' },
                    { id: 7, code: 'BC-NS-01', name: 'Báo cáo chấm công & bảng lương ca làm', type: 'Nhân sự', period: 'Tháng 07/2026', date: '24/07/2026 18:00', creator: 'Trưởng phòng Nhân sự', dept: 'Phòng Hành chính', branch: 'Tất cả chi nhánh', records: 85, total: 420000000, format: 'Excel', status: 'Đã phê duyệt' },
                    { id: 8, code: 'BC-TC-02', name: 'Báo cáo thu chi quỹ tiền mặt theo hạng mục', type: 'Tài chính', period: 'Tháng 07/2026', date: '23/07/2026 16:30', creator: 'Thủ quỹ chi nhánh', dept: 'Phòng Tài chính', branch: 'Chi nhánh Trung Tâm', records: 210, total: 155000000, format: 'PDF / Excel', status: 'Đã phê duyệt' }
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 25, showSizeChanger: false, size: 'small', position: ['bottomRight'] }}
                  scroll={{ x: 1820, y: 'calc(100vh - 218px)' }}
                  columns={[
                    { title: 'MÃ BÁO CÁO', dataIndex: 'code', width: 120, fixed: 'left', render: t => <b style={{ fontSize: 10.5, color: '#2563eb' }}>{t}</b> },
                    { title: 'TÊN BÁO CÁO', dataIndex: 'name', width: 260, render: t => <b style={{ fontSize: 10.5 }}>{t}</b> },
                    { title: 'LOẠI BÁO CÁO', dataIndex: 'type', width: 120, render: t => <Tag color="cyan" style={{ fontSize: 9.5, padding: '0 3px' }}>{t}</Tag> },
                    { title: 'KỲ BÁO CÁO', dataIndex: 'period', width: 120, render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'NGÀY LẬP', dataIndex: 'date', width: 130, render: d => <span style={{ fontSize: 10 }}>{d}</span> },
                    { title: 'NGƯỜI LẬP', dataIndex: 'creator', width: 140, render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'PHÒNG BAN', dataIndex: 'dept', width: 140, render: t => <span style={{ fontSize: 10, color: '#64748b' }}>{t}</span> },
                    { title: 'CHI NHÁNH', dataIndex: 'branch', width: 180, render: t => <span style={{ fontSize: 10 }}>{t}</span> },
                    { title: 'TỔNG BẢN GHI', dataIndex: 'records', width: 110, align: 'right', render: c => <Tag color="blue" style={{ fontSize: 9.5, padding: '0 3px' }}>{c.toLocaleString()} mục</Tag> },
                    { title: 'TỔNG GIÁ TRỊ', dataIndex: 'total', width: 160, align: 'right', render: v => <b style={{ fontSize: 10.5, color: '#059669' }}>{v.toLocaleString()} đ</b> },
                    { title: 'ĐỊNH DẠNG', dataIndex: 'format', width: 110, render: f => <Tag color="purple" style={{ fontSize: 9.5, padding: '0 3px' }}>{f}</Tag> },
                    { title: 'TRẠNG THÁI', dataIndex: 'status', width: 130, render: s => s === 'Đã phê duyệt' ? <Tag color="success" style={{ fontSize: 9.5, padding: '0 3px' }}>Đã phê duyệt</Tag> : <Tag color="warning" style={{ fontSize: 9.5, padding: '0 3px' }}>Chờ duyệt</Tag> },
                    {
                      title: 'THAO TÁC',
                      key: 'action',
                      width: 100,
                      align: 'center',
                      fixed: 'right',
                      render: () => (
                        <Button size="small" type="link" icon={<DownloadOutlined style={{ fontSize: 11 }} />} onClick={() => message.success('Đã tải báo cáo!')} style={{ fontSize: 10, padding: 0 }}>
                          Tải về
                        </Button>
                      )
                    }
                  ]}
                />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ─── MODAL DIALOGS ───────────────────────────────────────────────────────────── */}
      <ImportModal
        open={modalImportOpen}
        onClose={() => setModalImportOpen(false)}
        onSuccess={() => message.success('Đã làm mới danh sách.')}
        branchId={selectedBranchId}
        products={products}
        partners={partners}
      />

      <ExportModal
        open={modalExportOpen}
        onClose={() => setModalExportOpen(false)}
        onSuccess={() => message.success('Đã làm mới danh sách.')}
        branchId={selectedBranchId}
        products={products}
      />

      <TransferModal
        open={modalTransferOpen}
        onClose={() => setModalTransferOpen(false)}
        onSuccess={() => message.success('Đã làm mới danh sách.')}
        fromBranchId={selectedBranchId}
        branches={branches}
        products={products}
      />

      <TransferReceiveModal
        open={modalTransferReceiveOpen}
        onClose={() => setModalTransferReceiveOpen(false)}
        onSuccess={() => message.success('Đã làm mới danh sách.')}
        transferDoc={selectedTransferDoc}
      />

      <CheckModal
        open={modalCheckOpen}
        onClose={() => setModalCheckOpen(false)}
        onSuccess={() => message.success('Đã làm mới danh sách.')}
        branchId={selectedBranchId}
        products={products}
      />

      <ProductionModal
        open={modalProductionOpen}
        onClose={() => setModalProductionOpen(false)}
        onSuccess={() => message.success('Đã làm mới danh sách.')}
        branchId={selectedBranchId}
        products={products}
      />
    </div>
  );
};

export default InventoryManagementTab;
