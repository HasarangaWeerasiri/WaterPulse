import React, { useState } from 'react';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { ReportForm } from '../../components/reports/ReportForm';
import { ReportList } from '../../components/reports/ReportList';

// ReportCenter page: high-level composition/root for citizen contamination reports.
// SRP: orchestrates report form + list within a themed layout.
// Open/Closed: new widgets can be added without touching lower-level components.
export const ReportCenter = () => {
  const [editingReport, setEditingReport] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleEditReport = (report) => {
    if (report.status !== 'Unverified') return;
    setEditingReport(report);
  };

  const handleEditCompleted = () => {
    setEditingReport(null);
    setRefreshToken((token) => token + 1);
  };

  const handleCreated = () => {
    setRefreshToken((token) => token + 1);
  };

  return (
    <ReportLayout
      title="Water Contamination Reports"
      subtitle="Submit new contamination reports, pinpoint locations on the map, and track the status of your previous submissions. Help keep your community's water safe."
      actions={
        <span className="inline-flex items-center rounded-full bg-[#E5F0F4] px-4 py-2 text-xs md:text-sm font-medium text-[#164871] border border-[#608A9A]/40 shadow-sm">
          💧 Citizen Portal – Reports
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReportForm
          editingReport={editingReport}
          onEditCompleted={handleEditCompleted}
          onCreated={handleCreated}
        />
        <ReportList onEdit={handleEditReport} refreshToken={refreshToken} />
      </div>
    </ReportLayout>
  );
};

export default ReportCenter;
