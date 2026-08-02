import React, { useState, useMemo } from 'react';
import PartnerTable from './PartnerTable';
import PartnerModal from './PartnerModal';

const PartnerTab = ({ partners = [] }) => {
  const [partnerList, setPartnerList] = useState(partners);
  const [searchText, setSearchText] = useState('');
  const [partnerType, setPartnerType] = useState('ALL');
  const [modalPartnerOpen, setModalPartnerOpen] = useState(false);

  const filteredPartners = useMemo(() => {
    return partnerList.filter((p) => {
      if (partnerType !== 'ALL' && p.type !== partnerType) return false;
      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(lower);
        const matchPhone = p.phone?.toLowerCase().includes(lower);
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [partnerList, partnerType, searchText]);

  const handleAddPartnerSuccess = (newPartner) => {
    setPartnerList((prev) => [newPartner, ...prev]);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <PartnerTable
        partners={filteredPartners}
        searchText={searchText}
        setSearchText={setSearchText}
        partnerType={partnerType}
        setPartnerType={setPartnerType}
        setModalPartnerOpen={setModalPartnerOpen}
      />

      <PartnerModal
        open={modalPartnerOpen}
        onClose={() => setModalPartnerOpen(false)}
        onSuccess={handleAddPartnerSuccess}
      />
    </div>
  );
};

export default PartnerTab;
