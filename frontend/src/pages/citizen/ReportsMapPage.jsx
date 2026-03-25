import React from 'react';
import CitizenReportsMap from '../../components/reports/CitizenReportsMap';

export function ReportsMapPage() {
  return (
    <div className="max-w-6xl px-4 py-6 mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-[#164871]">Area Water Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          This map shows only <span className="font-semibold ">confirmed</span> contamination reports in your area.
        </p>
      </div>
      <CitizenReportsMap />
    </div>
  );
}

export default ReportsMapPage;
