import React, { useState, useMemo } from 'react';
import AdjustmentSidebar from './AdjustmentSidebar';
import AdjustmentTable from './AdjustmentTable';
import AdjustmentDocumentModal from './AdjustmentDocumentModal';

const AdjustmentTab = ({
  documents = [],
  loading,
  selectedBranchId,
  products = [],
  fetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const adjustmentDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.type !== 5) return false;
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
      if (searchText) {
        const lower = searchText.toLowerCase().trim();
        const matchCode = doc.code?.toLowerCase().includes(lower);
        const matchCreator = doc.creator?.toLowerCase().includes(lower);
        const matchNote = doc.note?.toLowerCase().includes(lower);
        if (!matchCode && !matchCreator && !matchNote) return false;
      }
      return true;
    });
  }, [documents, statusFilter, searchText]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      {/* LEFT SIDEBAR (SEARCH & FILTER, NO HEADER TITLE) */}
      <AdjustmentSidebar
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* RIGHT CONTENT TABLE */}
      <AdjustmentTable
        documents={adjustmentDocs}
        loading={loading}
        selectedBranchId={selectedBranchId}
        fetchDocuments={fetchDocuments}
        handleDeleteDocument={handleDeleteDocument}
        setModalOpen={setModalOpen}
      />

      {/* CREATE ADJUSTMENT MODAL */}
      <AdjustmentDocumentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchDocuments(selectedBranchId)}
        branchId={selectedBranchId}
        products={products}
      />
    </div>
  );
};

export default AdjustmentTab;
