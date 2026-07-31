import React, { useState, useMemo } from 'react';
import PartnerSidebar from './PartnerSidebar';
import PartnerTable from './PartnerTable';

const PartnerTab = ({ partners = [] }) => {
  const [searchText, setSearchText] = useState('');
  const [partnerType, setPartnerType] = useState('ALL');

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (partnerType !== 'ALL' && p.type !== partnerType) return false;
      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(lower);
        const matchPhone = p.phone?.toLowerCase().includes(lower);
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [partners, partnerType, searchText]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <PartnerSidebar partnerType={partnerType} setPartnerType={setPartnerType} />
      <PartnerTable
        partners={filteredPartners}
        searchText={searchText}
        setSearchText={setSearchText}
      />
    </div>
  );
};

export default PartnerTab;
