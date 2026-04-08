import React, { useState, useEffect, useMemo } from "react";
import taskApi from "../../services/taskApi";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskPriorityBadge from "./TaskPriorityBadge";
import TaskFormModal from "./TaskFormModal";
import TaskDetailModal from "./TaskDetailModal";

export const TaskListSection = () => {
  const [tasks, setTasks] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Detail Modal
  const [detailTask, setDetailTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Status Dropdown
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("active");

  // Reassignment (for cancelled tasks)
  const [reassigningTaskId, setReassigningTaskId] = useState(null);
  const [reassignSelectedAuthority, setReassignSelectedAuthority] =
    useState("");
  const [reassignNote, setReassignNote] = useState("");
  const [reassignError, setReassignError] = useState("");

  useEffect(() => {
    loadTasks();
    loadAuthorities();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await taskApi.getTasks();
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAuthorities = async () => {
    try {
      const data = await taskApi.getAuthorities();
      setAuthorities(Array.isArray(data?.authorities) ? data.authorities : []);
    } catch (err) {
      console.error("Failed to load authorities:", err);
      setAuthorities([]);
    }
  };

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      // Exclude cancelled tasks from default view (they appear in a separate section)
      if (statusFilter === "All Statuses" && task.status === "cancelled") {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          task.title?.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search) ||
          task.assignedTo?.firstName?.toLowerCase().includes(search) ||
          task.assignedTo?.lastName?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter - convert display names to backend format
      if (statusFilter !== "All Statuses") {
        const statusMap = {
          Pending: "pending",
          "In Progress": "in_progress",
          Completed: "completed",
          Cancelled: "cancelled",
        };
        const backendStatus = statusMap[statusFilter];
        if (task.status !== backendStatus) {
          return false;
        }
      }

      // Priority filter - backend uses lowercase
      if (priorityFilter !== "All Priorities") {
        if (task.priority !== priorityFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    // Sort tasks by createdAt in descending order (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleViewTask = (task) => {
    setDetailTask(task);
    setIsDetailOpen(true);
  };

  const handleRefresh = () => {
    loadTasks();
  };

  const handleStatusChange = async (taskId, newStatusDisplay) => {
    // Convert display status to backend format
    const statusMap = {
      Pending: "pending",
      "In Progress": "in_progress",
      Completed: "completed",
      Cancelled: "cancelled",
    };
    const newStatus = statusMap[newStatusDisplay];

    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      await loadTasks();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskApi.deleteTask(taskId);
      await loadTasks();
      setDeleteConfirm(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete task");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleReassignClick = (task) => {
    setReassigningTaskId(task._id);
    setReassignSelectedAuthority(task.assignedTo?._id || "");
    setReassignNote("");
    setReassignError("");
  };

  const handleCancelReassign = () => {
    setReassigningTaskId(null);
    setReassignSelectedAuthority("");
    setReassignNote("");
    setReassignError("");
  };

  const handleReassignSubmit = async () => {
    if (!reassignSelectedAuthority) {
      setReassignError("Please select an authority to reassign to");
      return;
    }

    try {
      setReassignError("");
      await taskApi.updateTask(reassigningTaskId, {
        assignedTo: reassignSelectedAuthority,
        resolutionNotes: reassignNote || "Reassigned from cancelled task",
      });
      await taskApi.updateTaskStatus(reassigningTaskId, "pending");
      await loadTasks();
      setReassigningTaskId(null);
      setReassignSelectedAuthority("");
      setReassignNote("");
    } catch (err) {
      setReassignError(
        err?.response?.data?.message || "Failed to reassign task",
      );
    }
  };

  // Get tasks for each tab
  const activeTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status !== "cancelled");
  }, [filteredTasks]);

  const cancelledTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status === "cancelled" &&
        (!searchTerm.trim() ||
          t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.assignedTo?.firstName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          t.assignedTo?.lastName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())),
    );
  }, [tasks, searchTerm]);

  return (
    <div className="p-6 bg-white shadow rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#00569c]">Task Management</h2>
        <button
          onClick={handleCreateTask}
          className="px-6 py-2 bg-[#00569c] text-white rounded-lg hover:bg-[#003f73] transition font-semibold"
        >
          + Create Task
        </button>
      </div>

      {/* Task Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "active"
              ? "bg-[#00569c] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Active Tasks
        </button>
        <button
          onClick={() => setActiveTab("cancelled")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "cancelled"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Cancelled Tasks ({cancelledTasks.length})
        </button>
      </div>

      {/* Active Tasks Tab */}
      {activeTab === "active" && (
        <>
          {/* Filters Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Search Tasks
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Title, description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00569c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00569c]"
                >
                  <option>All Statuses</option>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00569c]"
                >
                  <option>All Priorities</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All Statuses");
                    setPriorityFilter("All Priorities");
                  }}
                  className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition text-sm font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Tasks List Section */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">All Tasks</h3>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-60 text-sm font-semibold"
            >
              Refresh
            </button>
          </div>

          {/* Loading State */}
          {loading && <div className="p-4 text-gray-600">Loading tasks...</div>}

          {/* No Tasks State */}
          {!loading && filteredTasks.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>
                No tasks found.{" "}
                {tasks.length === 0
                  ? "Create one to get started!"
                  : "Try adjusting your filters."}
              </p>
            </div>
          )}

          {/* Tasks List */}
          {!loading && filteredTasks.length > 0 && (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                >
                  {/* Title and Info */}
                  <div className="mb-3">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {task.title}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Created {formatDate(task.createdAt)} • Assigned to{" "}
                        <span className="font-semibold">
                          {task.assignedTo?.firstName}{" "}
                          {task.assignedTo?.lastName}
                        </span>
                      </p>
                      {task.dueDate && <p>Due: {formatDate(task.dueDate)}</p>}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="mb-4 flex gap-2">
                    <TaskStatusBadge status={task.status} />
                    <TaskPriorityBadge priority={task.priority} />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleViewTask(task)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditTask(task)}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm font-semibold"
                    >
                      Edit
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenStatusDropdown(
                            openStatusDropdown === task._id ? null : task._id,
                          )
                        }
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-semibold"
                      >
                        Update Status
                      </button>
                      {openStatusDropdown === task._id && (
                        <div className="absolute left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-max">
                          {[
                            "Pending",
                            "In Progress",
                            "Completed",
                            "Cancelled",
                          ].map((status) => {
                            const statusMap = {
                              Pending: "pending",
                              "In Progress": "in_progress",
                              Completed: "completed",
                              Cancelled: "cancelled",
                            };
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  handleStatusChange(task._id, status);
                                  setOpenStatusDropdown(null);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition ${
                                  task.status === statusMap[status]
                                    ? "bg-gray-200 font-semibold"
                                    : ""
                                }`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(task._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Delete Task?
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this task? This action cannot
                  be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeleteTask(deleteConfirm)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Cancelled Tasks Tab */}
      {activeTab === "cancelled" && (
        <div>
          {/* Search for cancelled tasks */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search cancelled tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {loading && (
            <div className="text-center py-8 text-gray-600">
              Loading cancelled tasks...
            </div>
          )}

          {!loading && cancelledTasks.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              {searchTerm
                ? "No cancelled tasks match your search."
                : "No cancelled tasks to display."}
            </div>
          )}

          {!loading && cancelledTasks.length > 0 && (
            <div className="space-y-4">
              {cancelledTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-6 rounded-lg border border-red-200 bg-red-50 hover:border-red-300 transition"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {task.description}
                      </p>
                    </div>
                    <div>
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                  </div>

                  {/* Task Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-semibold">Assigned To</p>
                      <p className="text-gray-900">
                        {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">
                        Cancelled By
                      </p>
                      <p className="text-gray-900 capitalize">
                        {task.cancelledByRole === "authority"
                          ? "Authority"
                          : "Admin"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Report</p>
                      <p className="text-gray-900 truncate">
                        {task.reportId?.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">
                        Cancelled Date
                      </p>
                      <p className="text-gray-900">
                        {task.updatedAt
                          ? new Date(task.updatedAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Cancellation Reason */}
                  {task.cancellationReason && (
                    <div className="mb-4 p-3 rounded-lg bg-white border border-red-100">
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        Cancellation Reason
                      </p>
                      <p className="text-sm text-gray-600 italic">
                        {task.cancellationReason}
                      </p>
                    </div>
                  )}

                  {/* Reassign Form */}
                  {reassigningTaskId === task._id ? (
                    <div className="p-4 rounded-lg bg-white border border-blue-200">
                      <h5 className="font-semibold text-gray-900 mb-3">
                        Reassign Task
                      </h5>

                      {reassignError && (
                        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                          {reassignError}
                        </div>
                      )}

                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Authority
                          </label>
                          <select
                            value={reassignSelectedAuthority}
                            onChange={(e) =>
                              setReassignSelectedAuthority(e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Choose an authority...</option>
                            {authorities.map((auth) => (
                              <option key={auth._id} value={auth._id}>
                                {auth.firstName} {auth.lastName} (
                                {auth.location?.district})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Notes (optional)
                          </label>
                          <textarea
                            value={reassignNote}
                            onChange={(e) => setReassignNote(e.target.value)}
                            placeholder="Add any notes about the reassignment..."
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleReassignSubmit}
                          className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                        >
                          Confirm Reassignment
                        </button>
                        <button
                          onClick={handleCancelReassign}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleReassignClick(task)}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                      🔄 Reassign Task
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadTasks}
        editingTask={editingTask}
        authorities={authorities}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={detailTask}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};

export default TaskListSection;
