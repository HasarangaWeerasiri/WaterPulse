import React, { useState } from 'react';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { ReportForm } from '../../components/reports/ReportForm';
import { ReportList } from '../../components/reports/ReportList';
import WaterLogsAnalytics from '../../components/reports/WaterLogsAnalytics';

// ReportCenter page: high-level composition/root for citizen contamination reports.
// SRP: orchestrates report form + list within a themed layout.
// Open/Closed: new widgets can be added without touching lower-level components.
export const ReportCenter = () => {
  const [editingReport, setEditingReport] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [activeTab, setActiveTab] = useState("reports");

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
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "reports"
              ? "bg-[#2d8bba] text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          My Reports
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
            activeTab === "analytics"
              ? "bg-[#2d8bba] text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <img src="/google-analytics.png" alt="Analytics" className="w-5 h-5" />
          Water Quality Analytics
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportForm
            editingReport={editingReport}
            onEditCompleted={handleEditCompleted}
            onCreated={handleCreated}
          />
          <ReportList onEdit={handleEditReport} refreshToken={refreshToken} />
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <WaterLogsAnalytics />
      )}
    </ReportLayout>
  );
};

export default ReportCenter;
