import React, { useEffect, useState } from 'react';
import reportApi from '../../services/reportApi';
import { ReportCard } from './ReportCard';

// ReportList: fetches and renders the logged-in user's reports.
// SRP: managing the list of reports for the current user.
export const ReportList = ({ onEdit, refreshToken }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.getMyReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load your reports.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [refreshToken]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await reportApi.deleteReport(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete report.';
      setError(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-600 bg-white shadow-lg rounded-2xl animate-report-fade-in">
        Loading your reports...
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-2xl shadow-lg border border-[#608A9A]/20 animate-report-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#164871] font-universo tracking-wide">Your Reports</h2>
        <button
          type="button"
          onClick={loadReports}
          className="px-4 py-2 text-sm font-medium text-white bg-[#16863f] rounded-lg hover:bg-[#608A9A] transition shadow-sm"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 border border-red-100 rounded-md bg-red-50">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <p className="text-sm text-gray-600">
          You have not submitted any reports yet.
        </p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard
              key={report._id}
              id={report._id}
              title={report.title}
              description={report.description}
              createdAt={report.createdAt}
              status={report.status}
              address={report.address}
              onView={null}
              onDelete={() => handleDelete(report._id)}
              onEdit={onEdit ? () => onEdit(report) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportList;
