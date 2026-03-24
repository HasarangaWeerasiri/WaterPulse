import React from 'react';
import { StatusBadge } from './StatusBadge';

// ReportCard: presentational component to display a single report.
// SRP: formatting a report; no data-fetching or routing.
export const ReportCard = ({
  id,
  title,
  description,
  createdAt,
  status,
  address,
  onView,
  onDelete,
   onEdit,
}) => {
  return (
    <div className="flex flex-col justify-between gap-4 p-4 transition bg-white border border-gray-200 rounded-lg shadow-sm md:flex-row md:items-center hover:bg-gray-50 animate-report-fade-in">
      <div className="space-y-1">
        <h3 className="font-bold text-[#00569c] truncate max-w-md font-helvetica">{title}</h3>
        {address && (
          <p className="text-xs text-gray-500">{address}</p>
        )}
        <p className="max-w-xl text-sm text-gray-600 line-clamp-2">{description}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {createdAt && (
            <span>
              Reported on {new Date(createdAt).toLocaleString()}
            </span>
          )}
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onEdit && status === 'Unverified' && (
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-white transition bg-[#164871] rounded-lg hover:bg-[#608A9A]"
          >
            Update
          </button>
        )}
        {onView && (
          <button
            type="button"
            onClick={onView}
            className="px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            View Details
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 text-sm font-medium text-white transition bg-red-600 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
