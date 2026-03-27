import React from 'react';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';

// TaskDetailModal: displays detailed information about a task
// SRP: showing task details in a modal view
export const TaskDetailModal = ({ task, isOpen, onClose, onStatusChange, isStatusUpdating }) => {
  if (!isOpen || !task) return null;

  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#00569c]">{task.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Task ID: {task._id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
            <TaskStatusBadge status={task.status} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Priority</label>
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Task Details Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-1">Created</h4>
            <p className="text-sm text-gray-600">{formatDate(task.createdAt)}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-1">Last Updated</h4>
            <p className="text-sm text-gray-600">{formatDate(task.updatedAt)}</p>
          </div>
          {task.dueDate && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase mb-1">Due Date</h4>
              <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                {formatDate(task.dueDate)}
                {isOverdue && ' (Overdue)'}
              </p>
            </div>
          )}
          {task.completedAt && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase mb-1">Completed</h4>
              <p className="text-sm text-gray-600">{formatDate(task.completedAt)}</p>
            </div>
          )}
        </div>

        {/* Report and Assignment Info */}
        {task.reportId && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Related Report</h4>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500">Title:</span>
                <p className="text-sm font-medium text-gray-900">{task.reportId.title}</p>
              </div>
              {task.reportId.address && (
                <div>
                  <span className="text-xs text-gray-500">Address:</span>
                  <p className="text-sm text-gray-700">{task.reportId.address}</p>
                </div>
              )}
              {task.reportId.description && (
                <div>
                  <span className="text-xs text-gray-500">Description:</span>
                  <p className="text-sm text-gray-700">{task.reportId.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assigned To Info */}
        {task.assignedTo && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Assigned To</h4>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {task.assignedTo.firstName} {task.assignedTo.lastName}
              </p>
              <p className="text-xs text-gray-500">{task.assignedTo.email}</p>
              {task.assignedTo.phoneNumber && (
                <p className="text-xs text-gray-500">{task.assignedTo.phoneNumber}</p>
              )}
              {task.assignedTo.location?.district && (
                <p className="text-xs text-gray-500">District: {task.assignedTo.location.district}</p>
              )}
            </div>
          </div>
        )}

        {/* Resolution Notes (if completed) */}
        {task.resolutionNotes && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-semibold text-green-900 mb-2">Resolution Notes</h4>
            <p className="text-sm text-green-800">{task.resolutionNotes}</p>
          </div>
        )}

        {/* Cancellation Reason (if cancelled) */}
        {task.cancellationReason && (
          <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Cancellation Reason</h4>
            <p className="text-sm text-gray-700">{task.cancellationReason}</p>
          </div>
        )}

        {/* Status Update Section */}
        {task.status !== 'completed' && task.status !== 'cancelled' && (
          <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h4>
            <div className="flex items-center gap-2">
              {task.status === 'pending' && (
                <button
                  onClick={() => onStatusChange('in_progress')}
                  disabled={isStatusUpdating}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStatusUpdating ? 'Updating...' : 'Start Task'}
                </button>
              )}
              {task.status === 'in_progress' && (
                <button
                  onClick={() => onStatusChange('completed')}
                  disabled={isStatusUpdating}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStatusUpdating ? 'Updating...' : 'Mark Complete'}
                </button>
              )}
              <button
                onClick={() => onStatusChange('cancelled')}
                disabled={isStatusUpdating}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStatusUpdating ? 'Updating...' : 'Cancel Task'}
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
