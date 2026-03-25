import React from 'react';
import { ReportsMap } from './ReportsMap';
import { useReportsForMap } from './useReportsForMap';
import reportApi from '../../services/reportApi';

const STATUS_COLORS = {
  Confirmed: '#16a34a',
};

export function CitizenReportsMap({ heightClass }) {
  // Use dedicated confirmed-only endpoint so citizens don't depend on admin /all.
  const { reports, loading, error } = useReportsForMap({ loader: reportApi.getConfirmedReports });

  const colorForStatus = (status) => STATUS_COLORS[status] || '#16a34a';

  return (
    <ReportsMap
      title="Confirmed Reports Map"
      reports={reports}
      loading={loading}
      error={error}
      legendItems={[{ label: 'Confirmed', color: STATUS_COLORS.Confirmed }]}
      colorForStatus={colorForStatus}
      heightClass={heightClass}
      popupRenderer={(report) => (
        <div className="space-y-1 text-xs text-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Confirmed Report</p>
          <p className="text-sm font-semibold text-slate-900">{report.title}</p>
          <p className="text-[11px] text-slate-500">{report.address || 'No address available'}</p>
        </div>
      )}
    />
  );
}

export default CitizenReportsMap;
