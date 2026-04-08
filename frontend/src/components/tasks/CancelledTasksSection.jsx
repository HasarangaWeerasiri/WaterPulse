import React, { useState, useEffect, useMemo } from "react";
import taskApi from "../../services/taskApi";
import TaskPriorityBadge from "./TaskPriorityBadge";

export const CancelledTasksSection = () => {
  const [tasks, setTasks] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");

  // Reassignment
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
      const cancelledTasks = Array.isArray(data?.tasks)
        ? data.tasks.filter((t) => t.status === "cancelled")
        : [];
      setTasks(cancelledTasks);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to load cancelled tasks",
      );
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
    return tasks.filter((task) => {
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          task.title?.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search) ||
          task.assignedTo?.firstName?.toLowerCase().includes(search) ||
          task.assignedTo?.lastName?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [tasks, searchTerm]);

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
      // Update task status back to pending and reassign to new authority
      await taskApi.updateTask(reassigningTaskId, {
        assignedTo: reassignSelectedAuthority,
        resolutionNotes: reassignNote || "Reassigned from cancelled task",
      });

      // Reset task status to pending
      await taskApi.updateTaskStatus(reassigningTaskId, "pending");

      // Refresh tasks
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800">Cancelled Tasks</h3>
        <button
          onClick={loadTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title, description, or authority name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-600">
          Loading cancelled tasks...
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTasks.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          {searchTerm
            ? "No cancelled tasks match your search."
            : "No cancelled tasks to display."}
        </div>
      )}

      {/* Tasks List */}
      {!loading && filteredTasks.length > 0 && (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
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
                <div className="flex-shrink-0">
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
                  <p className="text-gray-600 font-semibold">Cancelled By</p>
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
                  <p className="text-gray-600 font-semibold">Cancelled Date</p>
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

              {/* Reassign Button / Form */}
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
  );
};

export default CancelledTasksSection;
