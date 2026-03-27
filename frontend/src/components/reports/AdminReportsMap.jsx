import React from 'react';
import { ReportsMap } from './ReportsMap';
import { useReportsForMap } from './useReportsForMap';

const STATUS_COLORS = {
  Confirmed: '#dc2626', // red (unsafe to use)
  Unverified: '#eab308', // yellow
  Resolved: '#22c55e',
  Spam: '#9ca3af',
};

export function AdminReportsMap() {
  // SRP: Delegate data loading to hook, rendering to ReportsMap.
  const { reports, loading, error } = useReportsForMap();

  const colorForStatus = (status) => STATUS_COLORS[status] || '#3b82f6';

  const legendItems = [
    { label: 'Confirmed', color: STATUS_COLORS.Confirmed },
    { label: 'Unverified', color: STATUS_COLORS.Unverified },
  ];

  return (
    <ReportsMap
      title="Contamination Reports Map"
      reports={reports}
      loading={loading}
      error={error}
      legendItems={legendItems}
      colorForStatus={colorForStatus}
      popupRenderer={(report) => {
        const status = report.status || 'Unverified';
        return (
          <div className="space-y-1 text-xs text-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Report</p>
            <p className="text-sm font-semibold text-slate-900">{report.title}</p>
            <p className="text-[11px] text-slate-500">{report.address || 'No address available'}</p>
            <p className="mt-1 text-[11px]">
              <span className="font-semibold">Status:</span>{' '}
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: (STATUS_COLORS[status] || '#e5e7eb') + '33',
                  color: STATUS_COLORS[status] || '#374151',
                }}
              >
                {status}
              </span>
            </p>
            {report.reportedBy && (
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold">Citizen:</span>{' '}
                {report.reportedBy.firstName || report.reportedBy.email}
              </p>
            )}
            <p className="mt-1 max-w-xs text-[11px] text-slate-600 line-clamp-3">
              {report.description}
            </p>
          </div>
        );
      }}
    />
  );
}

export default AdminReportsMap;
