import React, { useState, useMemo } from 'react';
import ImportSidebar from './ImportSidebar';
import ImportTable from './ImportTable';
import ImportDocumentModal from './ImportDocumentModal';

const ImportTab = ({
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
  const [modalImportOpen, setModalImportOpen] = useState(false);

  const importDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.type !== 1) return false;
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
      <ImportSidebar statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <ImportTable
        documents={importDocuments}
        searchText={searchText}
        setSearchText={setSearchText}
        loading={loading}
        setModalImportOpen={setModalImportOpen}
        handleDeleteDocument={handleDeleteDocument}
      />

      <ImportDocumentModal
        open={modalImportOpen}
        onClose={() => setModalImportOpen(false)}
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

export default ImportTab;
