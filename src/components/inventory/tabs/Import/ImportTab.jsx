import React, { useState, useMemo } from 'react';
import ImportSidebar from './ImportSidebar';
import ImportTable from './ImportTable';
import ImportDocumentModal from './ImportDocumentModal';
import ReturnDocumentModal from './ReturnDocumentModal';

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
  const [modalReturnOpen, setModalReturnOpen] = useState(false);
  const [selectedReturnDoc, setSelectedReturnDoc] = useState(null);

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
        allDocuments={documents}
        searchText={searchText}
        setSearchText={setSearchText}
        loading={loading}
        setModalImportOpen={setModalImportOpen}
        handleDeleteDocument={handleDeleteDocument}
        onOpenReturnModal={(doc) => {
          setSelectedReturnDoc(doc);
          setModalReturnOpen(true);
        }}
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

      <ReturnDocumentModal
        open={modalReturnOpen}
        onClose={() => {
          setModalReturnOpen(false);
          setSelectedReturnDoc(null);
        }}
        onSuccess={() => {
          fetchDocuments(selectedBranchId);
        }}
        branchId={selectedBranchId}
        products={products}
        partners={partners}
        importDocument={selectedReturnDoc}
      />
    </div>
  );
};

export default ImportTab;
