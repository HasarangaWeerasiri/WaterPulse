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
  const [step, setStep] = useState(1);
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
      setStep(1);
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
    setError("");
  };

  const validateStep = () => {
    if (step === 1 && !editingTask) {
      if (!formData.reportId) {
        setError("Please select a report to continue");
        return false;
      }
    } else if (step === 2) {
      if (!formData.title.trim()) {
        setError("Task title is required");
        return false;
      }
    } else if (step === 3) {
      if (!formData.assignedTo) {
        setError("Please select an authority to assign");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setError("");
      setStep(step + 1);
    }
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
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save task");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalSteps = editingTask ? 3 : 4;
  const stepTitles = editingTask 
    ? ["Task Details", "Assignment", "Final Review"]
    : ["Select Report", "Task Details", "Assignment", "Final Review"];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        if (editingTask) {
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  📋 Task Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a clear, concise task title"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  📝 Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add detailed instructions or notes..."
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium resize-none"
                />
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                🔗 Select Report
              </label>
              <select
                name="reportId"
                value={formData.reportId}
                onChange={handleInputChange}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
              >
                <option value="">Choose a pending report to address...</option>
                {pendingReports.map((report) => (
                  <option key={report._id} value={report._id}>
                    {report.title} {report.address ? `— ${report.address}` : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">Select the contamination report that this task addresses.</p>
            </div>
          );
        }

      case 2:
        if (editingTask) {
          return (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  👤 Assign To
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                >
                  <option value="">Select authority...</option>
                  {authorities?.map((auth) => (
                    <option key={auth._id} value={auth._id}>
                      {auth.firstName} {auth.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  ⚡ Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                </select>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  📋 Task Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a clear, concise task title"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  📝 Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add detailed instructions or notes..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium resize-none"
                />
              </div>
            </div>
          );
        }

      case 3:
        if (editingTask) {
          return (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                📅 Due Date (Optional)
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
              />
            </div>
          );
        } else {
          return (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  👤 Assign To
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                >
                  <option value="">Select authority...</option>
                  {authorities?.map((auth) => (
                    <option key={auth._id} value={auth._id}>
                      {auth.firstName} {auth.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  ⚡ Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                </select>
              </div>
            </div>
          );
        }

      case 4:
        return (
          <div className="space-y-6">
            {!editingTask && formData.reportId && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="text-sm text-green-700 font-medium">
                  ✓ Report selected: <span className="font-bold">{pendingReports.find(r => r._id === formData.reportId)?.title}</span>
                </p>
              </div>
            )}
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-blue-700 font-medium">
                ✓ Title: <span className="font-bold">{formData.title}</span>
              </p>
            </div>
            <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
              <p className="text-sm text-purple-700 font-medium">
                ✓ Assigned to: <span className="font-bold">{authorities?.find(a => a._id === formData.assignedTo)?.firstName} {authorities?.find(a => a._id === formData.assignedTo)?.lastName}</span>
              </p>
            </div>
            <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
              <p className="text-sm text-orange-700 font-medium">
                ✓ Priority: <span className="font-bold">{formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}</span>
              </p>
            </div>
            {formData.dueDate && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-700 font-medium">
                  ✓ Due: <span className="font-bold">{new Date(formData.dueDate).toLocaleDateString()}</span>
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                📅 Due Date (Optional)
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00569c] focus:ring-4 focus:ring-[#00569c]/20 transition text-gray-700 font-medium"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#00569c] to-[#003f73] text-white px-8 py-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h1>
            <p className="text-blue-100 text-sm">
              Step {step} of {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-[#00569c] to-[#003f73] transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>

        {/* Step Indicator */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${
                    index + 1 === step
                      ? "bg-[#00569c] text-white scale-110"
                      : index + 1 < step
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {index + 1 < step ? "✓" : index + 1}
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500 flex gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border-l-4 border-green-500 flex gap-3">
              <span className="text-xl">✅</span>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6 flex gap-4">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            ← Back
          </button>
          {step < totalSteps && (
            <button
              onClick={handleNextStep}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00569c] to-[#003f73] text-white rounded-lg hover:shadow-lg transition font-medium"
            >
              Next →
            </button>
          )}
          {step === totalSteps && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {loading ? "⏳ Saving..." : `✓ ${editingTask ? "Update" : "Create"} Task`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;