import React, { useState, useMemo } from 'react';
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
  const [editDocumentId, setEditDocumentId] = useState(null);
  const [modalReceiveOpen, setModalReceiveOpen] = useState(false);
  const [selectedTransferDoc, setSelectedTransferDoc] = useState(null);

  const transferDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Include Transfer (Type 2 & 3) and ReceiveTransfer (Type 7)
      if (doc.type !== 2 && doc.type !== 3 && doc.type !== 7) return false;
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchCode = doc.code?.toLowerCase().includes(lower);
        const matchCreator = doc.creator?.toLowerCase().includes(lower);
        if (!matchCode && !matchCreator) return false;
      }
      return true;
    });
  }, [documents, statusFilter, searchText]);

  const handleOpenEdit = (docId) => {
    setEditDocumentId(docId);
    setModalTransferOpen(true);
  };

  const handleCloseTransferModal = () => {
    setModalTransferOpen(false);
    setEditDocumentId(null);
  };

  const handleOpenReceiveModal = (doc = null) => {
    setSelectedTransferDoc(doc);
    setModalReceiveOpen(true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <TransferTable
        documents={transferDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        loading={loading}
        setModalTransferOpen={setModalTransferOpen}
        onEditDocument={handleOpenEdit}
        handleReceiveTransfer={handleOpenReceiveModal}
        handleDeleteDocument={handleDeleteDocument}
      />

      {/* MODAL 1: CHUYỂN HÀNG */}
      <TransferDocumentModal
        open={modalTransferOpen}
        editDocumentId={editDocumentId}
        onClose={handleCloseTransferModal}
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
