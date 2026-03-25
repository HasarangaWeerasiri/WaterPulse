import React from 'react';

// Pure presentational component for status labels.
// LSP-friendly: any status that maps to one of the known types will render correctly.
const getStatusStyles = (status = '') => {
  const normalized = status.toLowerCase();

  if (normalized === 'unverified') {
    return 'bg-yellow-100 text-yellow-800';
  }
  if (normalized === 'in progress' || normalized === 'in-progress') {
    return 'bg-blue-100 text-blue-800';
  }
  if (normalized === 'confirmed') {
    // Confirmed = unsafe to use => red
    return 'bg-red-100 text-red-800';
  }

  if (normalized === 'resolved') {
    return 'bg-emerald-100 text-emerald-800';
  }

  if (normalized === 'spam') {
    return 'bg-red-100 text-red-800';
  }

  // default / unknown
  return 'bg-gray-100 text-gray-800';
};

export const StatusBadge = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(status)}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;
