import React, { useState, useMemo } from 'react';
import ImportReturnSidebar from './ImportReturnSidebar';
import ImportReturnTable from './ImportReturnTable';
import ImportReturnDocumentModal from './ImportReturnDocumentModal';

const ImportReturnTab = ({
  documents = [],
  loading,
  selectedBranchId,
  products = [],
  partners = [],
  fetchDocuments,
  handleDeleteDocument
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalReturnOpen, setModalReturnOpen] = useState(false);

  const importReturnDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.type !== 4) return false;
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
      <ImportReturnSidebar statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <ImportReturnTable
        documents={importReturnDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        loading={loading}
        setModalReturnOpen={setModalReturnOpen}
        handleDeleteDocument={handleDeleteDocument}
      />

      <ImportReturnDocumentModal
        open={modalReturnOpen}
        onClose={() => setModalReturnOpen(false)}
        onSuccess={() => {
          fetchDocuments(selectedBranchId);
        }}
        branchId={selectedBranchId}
        products={products}
        partners={partners}
      />
    </div>
  );
};

export default ImportReturnTab;
