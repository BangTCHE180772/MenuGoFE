import React, { useState, useMemo } from 'react';
import ExportDeleteTable from './ExportDeleteTable';
import DisposalDocumentModal from './DisposalDocumentModal';

const ExportDeleteTab = ({
  documents = [],
  loading,
  selectedBranchId,
  products = [],
  fetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalExportOpen, setModalExportOpen] = useState(false);

  const exportDeleteDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.type !== 2) return false;
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

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <ExportDeleteTable
        documents={exportDeleteDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        loading={loading}
        setModalExportOpen={setModalExportOpen}
        handleDeleteDocument={handleDeleteDocument}
      />

      <DisposalDocumentModal
        open={modalExportOpen}
        onClose={() => setModalExportOpen(false)}
        onSuccess={() => {
          fetchDocuments(selectedBranchId);
        }}
        branchId={selectedBranchId}
        products={products}
      />
    </div>
  );
};

export default ExportDeleteTab;
