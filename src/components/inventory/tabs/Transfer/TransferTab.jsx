import React, { useState, useMemo } from 'react';
import TransferSidebar from './TransferSidebar';
import TransferTable from './TransferTable';
import TransferDocumentModal from './TransferDocumentModal';
import ReceiveTransferDocumentModal from './ReceiveTransferDocumentModal';

const TransferTab = ({
  documents = [],
  loading,
  selectedBranchId,
  branches = [],
  products = [],
  fetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalTransferOpen, setModalTransferOpen] = useState(false);
  const [modalReceiveOpen, setModalReceiveOpen] = useState(false);
  const [selectedTransferDoc, setSelectedTransferDoc] = useState(null);

  const transferDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Include both Transfer (Type 3) and ReceiveTransfer (Type 7)
      if (doc.type !== 3 && doc.type !== 7) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Pending' && doc.transferStatus !== 'Pending') return false;
        if (statusFilter === 'Completed' && doc.status !== 'Completed') return false;
      }
      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchCode = doc.code?.toLowerCase().includes(lower);
        const matchCreator = doc.creator?.toLowerCase().includes(lower);
        if (!matchCode && !matchCreator) return false;
      }
      return true;
    });
  }, [documents, statusFilter, searchText]);

  const handleOpenReceiveModal = (doc = null) => {
    setSelectedTransferDoc(doc);
    setModalReceiveOpen(true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <TransferSidebar statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <TransferTable
        documents={transferDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        loading={loading}
        setModalTransferOpen={setModalTransferOpen}
        handleReceiveTransfer={handleOpenReceiveModal}
        handleDeleteDocument={handleDeleteDocument}
      />

      {/* MODAL 1: CHUYỂN HÀNG */}
      <TransferDocumentModal
        open={modalTransferOpen}
        onClose={() => setModalTransferOpen(false)}
        onSuccess={() => {
          fetchDocuments(selectedBranchId);
        }}
        branchId={selectedBranchId}
        branches={branches}
        products={products}
      />

      {/* MODAL 2: NHẬN HÀNG */}
      <ReceiveTransferDocumentModal
        open={modalReceiveOpen}
        onClose={() => setModalReceiveOpen(false)}
        onSuccess={() => {
          fetchDocuments(selectedBranchId);
        }}
        documentData={selectedTransferDoc}
      />
    </div>
  );
};

export default TransferTab;
