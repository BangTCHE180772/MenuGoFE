import React, { useState, useEffect } from 'react';
import InventoryHeaderNav from './InventoryHeaderNav';

import { getAllBranches } from '../../api/branchApi';
import { getAllProducts } from '../../api/productApi';
import { deleteDocument, getDocuments } from '../../api/documentApi';

// Tab Components
import ImportTab from './tabs/Import/ImportTab';
import ImportReturnTab from './tabs/ImportReturn/ImportReturnTab';
import CheckTab from './tabs/Check/CheckTab';
import ExportDeleteTab from './tabs/ExportDelete/ExportDeleteTab';
import TransferTab from './tabs/Transfer/TransferTab';
import ProductionTab from './tabs/Production/ProductionTab';
import PartnerTab from './tabs/Partner/PartnerTab';
import MenuListingTab from './tabs/MenuListing/MenuListingTab';
import GroupListingTab from './tabs/GroupListing/GroupListingTab';
import ProductTab from './tabs/Product/ProductTab';
import InvoiceTab from './tabs/Invoice/InvoiceTab';
import ReturnTab from './tabs/Return/ReturnTab';
import CashTab from './tabs/Cash/CashTab';
import ReportTab from './tabs/Report/ReportTab';

const InventoryManagementTab = () => {
  // Branch & Data states
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active Tab state (default: 'Import')
  const [activeTab, setActiveTab] = useState('Import');

  // Real Data states
  const [documents, setDocuments] = useState([]);
  const [partners] = useState([]);
  const [cashFlows] = useState([]);

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
      } catch (err) {
        console.error('Error loading branch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchDocuments = async (branchId) => {
    // STOP immediately if branchId is not provided or <= 0
    if (!branchId || branchId <= 0) {
      console.warn('[InventoryManagementTab] Dừng thao tác: Cần có branchId hợp lệ.');
      setDocuments([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getDocuments(branchId);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching branch documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId && selectedBranchId > 0) {
      fetchDocuments(selectedBranchId);
    } else {
      setDocuments([]);
    }
  }, [selectedBranchId]);

  const handleDeleteDocument = async (id) => {
    try {
      await deleteDocument(id);
      alert('Xóa chứng từ thành công!');
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa chứng từ thất bại.');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontSize: 11 }}>
      {/* CSS STYLES FOR NAVIGATION BAR */}
      <style>{`
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* BODY CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'Report' && (
          <ReportTab
            documents={documents}
            partners={partners}
            cashFlows={cashFlows}
          />
        )}

        {activeTab === 'Import' && (
          <ImportTab
            documents={documents}
            loading={loading}
            selectedBranchId={selectedBranchId}
            products={products}
            partners={partners}
            fetchDocuments={fetchDocuments}
            handleDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'ImportReturn' && (
          <ImportReturnTab
            documents={documents}
            loading={loading}
            selectedBranchId={selectedBranchId}
            products={products}
            partners={partners}
            fetchDocuments={fetchDocuments}
            handleDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'Check' && (
          <CheckTab
            documents={documents}
            loading={loading}
            selectedBranchId={selectedBranchId}
            products={products}
            fetchDocuments={fetchDocuments}
            handleDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'ExportDelete' && (
          <ExportDeleteTab
            documents={documents}
            loading={loading}
            selectedBranchId={selectedBranchId}
            products={products}
            fetchDocuments={fetchDocuments}
            handleDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'Transfer' && (
          <TransferTab
            documents={documents}
            loading={loading}
            selectedBranchId={selectedBranchId}
            branches={branches}
            products={products}
            fetchDocuments={fetchDocuments}
            handleDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'Production' && (
          <ProductionTab
            documents={documents}
            loading={loading}
            selectedBranchId={selectedBranchId}
            products={products}
            fetchDocuments={fetchDocuments}
            handleDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'Partner' && (
          <PartnerTab partners={partners} />
        )}

        {activeTab === 'MenuListing' && (
          <MenuListingTab menuList={[]} />
        )}

        {activeTab === 'GroupListing' && (
          <GroupListingTab dishGroups={[]} />
        )}

        {activeTab === 'Product' && (
          <ProductTab dishes={[]} />
        )}

        {activeTab === 'Invoice' && (
          <InvoiceTab invoices={[]} />
        )}

        {activeTab === 'Return' && (
          <ReturnTab returnsList={[]} />
        )}

        {activeTab === 'Cash' && (
          <CashTab cashFlows={cashFlows} />
        )}
      </div>
    </div>
  );
};

export default InventoryManagementTab;
