import React, { useMemo, useState } from "react";
import taskApi from "../../services/taskApi";
import { TaskList } from "../../components/tasks/TaskList";
import { TaskDetailModal } from "../../components/tasks/TaskDetailModal";
import { TaskForm } from "../../components/tasks/TaskForm";

// AdminTaskDashboard: admin view for all task management
// Allows admins to create, view, filter, and manage all tasks
export const AdminTaskDashboard = () => {
  const [activeView, setActiveView] = useState("list"); // 'list' | 'create' | 'detail'
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = useMemo(() => {
    const f = {};
    if (statusFilter !== "all") f.status = statusFilter;
    if (priorityFilter !== "all") f.priority = priorityFilter;
    return f;
  }, [statusFilter, priorityFilter]);

  const handleCreateTask = async (payload) => {
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      await taskApi.createTask(payload);
      setSubmitSuccess(
        "✓ Task created successfully. The report is now marked as In Progress.",
      );
      setActiveView("list");
      setRefreshToken((prev) => prev + 1);

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus, additionalData = {}) => {
    try {
      await taskApi.updateTaskStatus(taskId, newStatus, additionalData);
      setSelectedTask((prev) =>
        prev ? { ...prev, status: newStatus, ...additionalData } : null,
      );
      setRefreshToken((prev) => prev + 1);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update task status");
    }
  };

  const handleTaskEdit = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
    setActiveView("detail");
  };

  const handleTaskDelete = () => {
    setRefreshToken((prev) => prev + 1);
    setIsDetailModalOpen(false);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Task Management</h2>
        <button
          onClick={() => {
            setActiveView("create");
            setSubmitError("");
            setSubmitSuccess("");
          }}
          className="px-6 py-2 bg-[#00569c] text-white rounded-lg hover:bg-[#003f73] transition font-medium"
        >
          + Create Task
        </button>
      </div>

      {/* Messages */}
      {submitError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700">{submitError}</p>
        </div>
      )}
      {submitSuccess && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-green-700">{submitSuccess}</p>
        </div>
      )}

      {/* Create Task Form */}
      {activeView === "create" && (
        <div className="p-8 bg-white shadow-lg rounded-xl border border-[#608A9A]/20">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-[#00569c]">
              Create New Task
            </h3>
            <p className="text-gray-600 text-sm mt-2">
              Assign a pending report to an authority for investigation
            </p>
          </div>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setActiveView("list")}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {/* Task List View */}
      {activeView === "list" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="p-6 bg-white shadow rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Tasks
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Title, description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00569c]"
                />
              </div>
              <div>
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00569c]"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <TaskList
            isAdmin={true}
            filters={filters}
            refreshToken={refreshToken}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
          />
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onStatusChange={(status, additionalData) =>
          handleStatusChange(selectedTask?._id, status, additionalData)
        }
        userRole="admin"
      />
    </div>
  );
};

export default AdminTaskDashboard;
