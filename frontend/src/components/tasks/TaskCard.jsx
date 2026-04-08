import React from "react";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";

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
  const isOverdue =
    dueDate &&
    new Date(dueDate) < new Date() &&
    status !== "completed" &&
    status !== "cancelled";

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col justify-between gap-4 p-4 transition bg-white border border-gray-200 rounded-lg shadow-sm md:flex-row md:items-center hover:bg-gray-50 animate-report-fade-in">
      <div className="space-y-2 flex-1">
        <h3 className="font-bold text-[#00569c] truncate max-w-md font-helvetica">
          {title}
        </h3>
        {description && (
          <p className="max-w-xl text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-gray-500">
          <span>Created {new Date(createdAt).toLocaleDateString()}</span>
          {dueDate && (
            <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
              Due {formatDate(dueDate)}
              {isOverdue && " (Overdue)"}
            </span>
          )}
          {assignedTo && (
            <span>
              Assigned to {assignedTo.firstName} {assignedTo.lastName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <TaskStatusBadge status={status} />
          <TaskPriorityBadge priority={priority} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 flex-shrink-0 flex-wrap">
        {onView && (
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:shadow-lg hover:scale-105 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 active:scale-95"
            title="View task details"
          >
            <span>👁️</span>
            <span>View</span>
          </button>
        )}
        {onEdit && status === "pending" && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:shadow-lg hover:scale-105 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 active:scale-95"
            title="Edit task"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        )}
        {onStatusChange && status !== "completed" && status !== "cancelled" && (
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg hover:shadow-lg hover:scale-105 hover:from-amber-600 hover:to-amber-700 transition-all duration-200 active:scale-95"
              title="Change task status"
            >
              <span>⚙️</span>
              <span>Status</span>
            </button>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onStatusChange(e.target.value);
                }
              }}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>
                Update Status
              </option>
              {status === "pending" && (
                <option value="in_progress">Start</option>
              )}
              {status === "in_progress" && (
                <option value="completed">Complete</option>
              )}
              <option value="cancelled">Cancel</option>
            </select>
          </div>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:shadow-lg hover:scale-105 hover:from-red-600 hover:to-red-700 transition-all duration-200 active:scale-95"
            title="Delete task"
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
