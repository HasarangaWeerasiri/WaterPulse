import React from 'react';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';

// TaskCard: presentational component to display a single task
// SRP: formatting a task; no data-fetching or routing
export const TaskCard = ({
  id,
  title,
  description,
  status,
  priority,
  assignedTo,
  dueDate,
  createdAt,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'completed' && status !== 'cancelled';

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col justify-between gap-4 p-4 transition bg-white border border-gray-200 rounded-lg shadow-sm md:flex-row md:items-center hover:bg-gray-50 animate-report-fade-in">
      <div className="space-y-2 flex-1">
        <h3 className="font-bold text-[#00569c] truncate max-w-md font-helvetica">{title}</h3>
        {description && (
          <p className="max-w-xl text-sm text-gray-600 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-gray-500">
          <span>Created {new Date(createdAt).toLocaleDateString()}</span>
          {dueDate && (
            <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
              Due {formatDate(dueDate)}
              {isOverdue && ' (Overdue)'}
            </span>
          )}
          {assignedTo && (
            <span>Assigned to {assignedTo.firstName} {assignedTo.lastName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <TaskStatusBadge status={status} />
          <TaskPriorityBadge priority={priority} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 flex-shrink-0">
        {onView && (
          <button
            type="button"
            onClick={onView}
            className="px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            View
          </button>
        )}
        {onEdit && status === 'pending' && (
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-white transition bg-[#164871] rounded-lg hover:bg-[#608A9A]"
          >
            Edit
          </button>
        )}
        {onStatusChange && status !== 'completed' && status !== 'cancelled' && (
          <select
            value=""
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 appearance-none bg-white cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>Update Status</option>
            {status === 'pending' && <option value="in_progress">Start</option>}
            {status === 'in_progress' && <option value="completed">Complete</option>}
            <option value="cancelled">Cancel</option>
          </select>
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

export default TaskCard;
