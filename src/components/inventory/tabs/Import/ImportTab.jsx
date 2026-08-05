import React, { useState, useMemo } from 'react';
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
  const [editingDocument, setEditingDocument] = useState(null);

  const importDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.type !== 1 && doc.type !== 'Import') return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Pending' && doc.status !== 0 && doc.status !== 'Pending') return false;
        if (statusFilter === 'Completed' && doc.status !== 1 && doc.status !== 'Completed') return false;
        if (statusFilter === 'Cancelled' && doc.status !== 2 && doc.status !== 'Cancelled') return false;
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

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <ImportTable
        documents={importDocuments}
        allDocuments={documents}
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        loading={loading}
        onRefresh={() => fetchDocuments && fetchDocuments(selectedBranchId)}
        onOpenCreateModal={() => {
          setEditingDocument(null);
          setModalImportOpen(true);
        }}
        handleDeleteDocument={handleDeleteDocument}
        onOpenReturnModal={(doc) => {
          setSelectedReturnDoc(doc);
          setModalReturnOpen(true);
        }}
        onEditDocument={(doc) => {
          setEditingDocument(doc);
          setModalImportOpen(true);
        }}
      />

      <ImportDocumentModal
        open={modalImportOpen}
        onClose={() => {
          setModalImportOpen(false);
          setEditingDocument(null);
        }}
        onSuccess={() => {
          fetchDocuments(selectedBranchId);
        }}
        branchId={selectedBranchId}
        products={products}
        partners={partners}
        editingDocument={editingDocument}
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
