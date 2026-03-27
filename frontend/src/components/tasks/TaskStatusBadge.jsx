import React from 'react';

// Pure presentational component for task status labels
// Displays task status with appropriate color coding
const getStatusStyles = (status = '') => {
  const normalized = status.toLowerCase();

  if (normalized === 'pending') {
    return 'bg-yellow-100 text-yellow-800';
  }
  if (normalized === 'in_progress' || normalized === 'in-progress') {
    return 'bg-blue-100 text-blue-800';
  }
  if (normalized === 'completed') {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (normalized === 'cancelled') {
    return 'bg-gray-100 text-gray-800';
  }

  // default / unknown
  return 'bg-gray-100 text-gray-800';
};

// Convert status for display (e.g., "in_progress" -> "In Progress")
const formatStatus = (status = '') => {
  return status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const TaskStatusBadge = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(status)}`}>
      {formatStatus(status) || 'Unknown'}
    </span>
  );
};

export default TaskStatusBadge;
