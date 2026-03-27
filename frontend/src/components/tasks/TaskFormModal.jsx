import React, { useState, useEffect } from "react";
import taskApi from "../../services/taskApi";
import reportApi from "../../services/reportApi";

export const TaskFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  editingTask,
  authorities,
}) => {
  const [formData, setFormData] = useState({
    reportId: "",
    assignedTo: "",
    priority: "medium",
    title: "",
    description: "",
    dueDate: "",
  });

  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadPendingReports();
      if (editingTask) {
        setFormData({
          reportId: editingTask.reportId?._id || "",
          assignedTo: editingTask.assignedTo?._id || "",
          priority: editingTask.priority || "medium",
          title: editingTask.title || "",
          description: editingTask.description || "",
          dueDate: editingTask.dueDate ? editingTask.dueDate.split("T")[0] : "",
        });
      } else {
        setFormData({
          reportId: "",
          assignedTo: "",
          priority: "medium",
          title: "",
          description: "",
          dueDate: "",
        });
      }
    }
  }, [isOpen, editingTask]);

  const loadPendingReports = async () => {
    try {
      const data = await reportApi.getPendingReports();
      setPendingReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load pending reports:", err);
      setPendingReports([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editingTask?.reportId && !formData.reportId) {
      setError("Please select a report");
      return;
    }
    if (!formData.assignedTo) {
      setError("Please select an authority");
      return;
    }
    if (!formData.title.trim()) {
      setError("Task title is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        reportId: formData.reportId || editingTask.reportId._id,
        assignedTo: formData.assignedTo,
        priority: formData.priority,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        dueDate: formData.dueDate || undefined,
      };

      if (editingTask) {
        delete payload.reportId;
        await taskApi.updateTask(editingTask._id, payload);
        setSuccess("Task updated successfully!");
      } else {
        await taskApi.createTask(payload);
        setSuccess("Task created successfully!");
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-gray-100 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00569c] to-[#003f73] text-white px-8 py-8 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-white rounded-full opacity-80"></div>
              <h2 className="text-4xl font-bold">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h2>
            </div>
            <p className="text-blue-100 text-sm">
              {editingTask
                ? "Update task details and assignment"
                : "Create a new task and assign to an authority"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-3 rounded-full transition-all duration-200 hover:scale-110"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Report Section */}
            {!editingTask && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-white text-lg">
                    🔗
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Select Report
                  </h3>
                </div>
                <select
                  name="reportId"
                  value={formData.reportId}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00569c] focus:ring-2 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                  required
                >
                  <option value="">Select a pending report</option>
                  {pendingReports.map((report) => (
                    <option key={report._id} value={report._id}>
                      {report.title}{" "}
                      {report.address ? `(${report.address})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-[#00569c] rounded-lg flex items-center justify-center text-white text-lg">
                  📋
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Task Details
                </h3>
              </div>

              {/* Title */}
              <div className="mb-6">
                <label className="block mb-3 text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Task Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00569c] focus:ring-2 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                  placeholder="e.g., Investigate contamination report"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00569c] focus:ring-2 focus:ring-[#00569c]/20 transition text-gray-700 font-medium resize-none"
                  placeholder="Add any notes for the assigned authority..."
                  rows={5}
                />
              </div>
            </div>

            {/* Assignment Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white text-lg">
                  👤
                </div>
                <h3 className="text-xl font-bold text-gray-800">Assignment</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Assign To */}
                <div>
                  <label className="block mb-3 text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Assign To
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00569c] focus:ring-2 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                    required
                  >
                    <option value="">Select authority</option>
                    {authorities?.map((auth) => (
                      <option key={auth._id} value={auth._id}>
                        {auth.firstName} {auth.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block mb-3 text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00569c] focus:ring-2 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Due Date Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white text-lg">
                  📅
                </div>
                <h3 className="text-xl font-bold text-gray-800">Due Date</h3>
              </div>

              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00569c] focus:ring-2 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pb-8">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-[#00569c] to-[#003f73] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </>
                ) : editingTask ? (
                  <>
                    <span>✏️</span>
                    Update Task
                  </>
                ) : (
                  <>
                    <span>➕</span>
                    Create Task
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-all duration-200 font-bold text-lg flex items-center justify-center gap-2"
              >
                <span>❌</span>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;
