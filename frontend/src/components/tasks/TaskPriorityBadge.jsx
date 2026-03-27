import React from 'react';

export const TaskPriorityBadge = ({ priority }) => {
  const priorityStyles = {
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-red-100 text-red-800',
  };

  const style = priorityStyles[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {priority || 'Unknown'}
    </span>
  );
};

export default TaskPriorityBadge;
