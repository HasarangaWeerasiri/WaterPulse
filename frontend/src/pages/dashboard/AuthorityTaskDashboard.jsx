import React, { useState } from "react";
import taskApi from "../../services/taskApi";
import { TaskList } from "./TaskList";
import { TaskDetailModal } from "./TaskDetailModal";

// AuthorityTaskDashboard: authority view for assigned tasks
// Allows authorities to view and update their assigned tasks
export const AuthorityTaskDashboard = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [statusError, setStatusError] = useState("");
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");

  const filters = statusFilter !== "all" ? { status: statusFilter } : {};

  const handleTaskEdit = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
    setStatusError("");
  };

  const handleStatusChange = async (newStatus, additionalData = {}) => {
    if (!selectedTask) return;

    setIsStatusUpdating(true);
    setStatusError("");
    try {
      await taskApi.updateTaskStatus(selectedTask._id, newStatus, additionalData);
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus, ...additionalData } : null));
      setRefreshToken((prev) => prev + 1);
    } catch (err) {
      setStatusError(
        err?.response?.data?.message || "Failed to update task status",
      );
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskDelete = () => {
    setRefreshToken((prev) => prev + 1);
    setIsDetailModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">My Tasks</h2>
        <p className="text-gray-600 text-sm mt-1">
          View and update your assigned investigation tasks
        </p>
      </div>

      {/* Error Message */}
      {statusError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700">{statusError}</p>
        </div>
      )}

      {/* Filters */}
      <div className="p-6 bg-white shadow rounded-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00569c]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button
            onClick={() => setStatusFilter("all")}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <TaskList
        isAdmin={false}
        filters={filters}
        refreshToken={refreshToken}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onStatusChange={handleStatusChange}
        isStatusUpdating={isStatusUpdating}
        userRole="authority"
      />
    </div>
  );
};

export default AuthorityTaskDashboard;
