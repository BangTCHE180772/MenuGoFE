import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
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

import {
  INITIAL_DOCUMENTS,
  INITIAL_PARTNERS,
  INITIAL_CASH_FLOWS
} from './inventoryConstants';

import InventoryHeaderNav from './InventoryHeaderNav';
import InventorySidebar from './InventorySidebar';

import DocumentsTable from './views/DocumentsTable';
import PartnersTable from './views/PartnersTable';
import CashbookTable from './views/CashbookTable';
import InvoicesTable from './views/InvoicesTable';
import ReturnsTable from './views/ReturnsTable';
import DishesTable from './views/DishesTable';
import DishGroupsTable from './views/DishGroupsTable';
import MenuListingsTable from './views/MenuListingsTable';
import RoomsTablesView from './views/RoomsTablesView';
import EmployeesTable from './views/EmployeesTable';
import ReportsTable from './views/ReportsTable';

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
  const [activeSubOption, setActiveSubOption] = useState('1_4'); // '1_4' | '6' | '3' | '5' | '2' | 'partners' ...

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
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  // Partners Data
  const [partners] = useState(INITIAL_PARTNERS);
  // Cashbook Data
  const [cashFlows] = useState(INITIAL_CASH_FLOWS);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const bRes = await getAllBranches();
        const branchList = Array.isArray(bRes?.data) ? bRes.data : (Array.isArray(bRes) ? bRes : []);
        setBranches(branchList);
        if (branchList.length > 0) {
          setSelectedBranchId(branchList[0].id);
        }

        const pRes = await getAllProducts();
        setProducts(Array.isArray(pRes?.data) ? pRes.data : (Array.isArray(pRes) ? pRes : []));
      } catch (err) {
        console.error('Error loading branch/inventory data:', err);
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
        }
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

      {/* TOP HEADER NAVIGATION BAR */}
      <InventoryHeaderNav
        branches={branches}
        selectedBranchId={selectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        loading={loading}
        activeMainCategory={activeMainCategory}
        setActiveMainCategory={setActiveMainCategory}
        activeSubOption={activeSubOption}
        setActiveSubOption={setActiveSubOption}
      />

      {/* ─── BODY CONTAINER: PERSISTENT FILTER SIDEBAR (190PX) + RIGHT MAIN CONTENT ────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ─── LEFT SIDEBAR ──── */}
        <InventorySidebar
          activeSubOption={activeSubOption}
          activeMainCategory={activeMainCategory}
        />

        {/* ─── RIGHT MAIN CONTENT AREA ──── */}
        <div style={{ flex: 1, padding: 0, overflow: 'hidden', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>

          {/* VIEW: CHỨNG TỪ KHO HÀNG HÓA */}
          {['1_4', '4', '2', '3', '5', '6'].includes(activeSubOption) && activeMainCategory === 'operations' && (
            <DocumentsTable
              activeSubOption={activeSubOption}
              searchText={searchText}
              setSearchText={setSearchText}
              filteredDocuments={filteredDocuments}
              loading={loading}
              setModalImportOpen={setModalImportOpen}
              setModalExportOpen={setModalExportOpen}
              setModalTransferOpen={setModalTransferOpen}
              setModalCheckOpen={setModalCheckOpen}
              setModalProductionOpen={setModalProductionOpen}
              setSelectedTransferDoc={setSelectedTransferDoc}
              setModalTransferReceiveOpen={setModalTransferReceiveOpen}
              handleDeleteDocument={handleDeleteDocument}
            />
          )}

          {/* VIEW: ĐỐI TÁC */}
          {activeMainCategory === 'operations' && activeSubOption === 'partners' && (
            <PartnersTable
              searchText={searchText}
              setSearchText={setSearchText}
              partners={partners}
            />
          )}

          {/* VIEW: SỔ QUỶ */}
          {activeMainCategory === 'cashbook' && (
            <CashbookTable
              searchText={searchText}
              setSearchText={setSearchText}
              cashFlows={cashFlows}
            />
          )}

          {/* VIEW: HÓA ĐƠN & GIAO DỊCH */}
          {activeSubOption === 'invoices' && (
            <InvoicesTable
              searchText={searchText}
              setSearchText={setSearchText}
            />
          )}

          {/* VIEW: TRẢ HÀNG KHÁCH HÀNG */}
          {activeSubOption === 'returns' && (
            <ReturnsTable
              searchText={searchText}
              setSearchText={setSearchText}
            />
          )}

          {/* VIEW: MÓN ĂN */}
          {activeSubOption === 'dishes' && (
            <DishesTable
              searchText={searchText}
              setSearchText={setSearchText}
            />
          )}

          {/* VIEW: NHÓM MÓN */}
          {activeSubOption === 'dish_groups' && (
            <DishGroupsTable
              searchText={searchText}
              setSearchText={setSearchText}
            />
          )}

          {/* VIEW: THỰC ĐƠN */}
          {activeSubOption === 'menu_list' && (
            <MenuListingsTable
              searchText={searchText}
              setSearchText={setSearchText}
            />
          )}

          {/* VIEW: PHÒNG / BÀN */}
          {activeSubOption === 'rooms_tables' && (
            <RoomsTablesView
              searchText={searchText}
              setSearchText={setSearchText}
            />
          )}

          {/* VIEW: NHÂN VIÊN */}
          {activeSubOption === 'employees' && (
            <EmployeesTable
              searchText={searchText}
              setSearchText={setSearchText}
            />
          )}

          {/* VIEW: BÁO CÁO */}
          {activeSubOption === 'reports' && (
            <ReportsTable
              searchText={searchText}
              setSearchText={setSearchText}
            />
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
