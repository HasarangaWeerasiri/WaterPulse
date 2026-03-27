import React from 'react';

export const TaskStatusBadge = ({ status }) => {
  // Map backend status values to display format
  const statusMap = {
    'pending': { display: 'Pending', style: 'bg-yellow-100 text-yellow-800' },
    'in_progress': { display: 'In Progress', style: 'bg-blue-100 text-blue-800' },
    'completed': { display: 'Completed', style: 'bg-green-100 text-green-800' },
    'cancelled': { display: 'Cancelled', style: 'bg-gray-100 text-gray-800' },
  };

  const statusKey = (status || 'pending').toLowerCase();
  const statusInfo = statusMap[statusKey] || { display: status || 'Unknown', style: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.style}`}>
      {statusInfo.display}
    </span>
  );
};

export default TaskStatusBadge;
