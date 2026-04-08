import React, { useState } from "react";

export const TaskCancelReasonModal = ({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  loading,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError("Please provide a reason for cancelling this task");
      return;
    }

    if (reason.trim().length < 10) {
      setError("Reason must be at least 10 characters long");
      return;
    }

    await onConfirm(reason.trim());
    setReason("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cancel Task</h1>
            <p className="text-red-100 text-sm">
              This action requires a detailed reason
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
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

        {/* Content */}
        <div className="p-8">
          {/* Task Info */}
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-sm text-red-700">
              <span className="font-bold">Task:</span> {taskTitle}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500 flex gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                ✍️ Cancellation Reason
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Provide a detailed reason for cancelling this task. This will be
                visible to the admin.
              </p>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                placeholder="Explain why you are cancelling this task (minimum 10 characters)..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition text-gray-700 font-medium resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {reason.length} / 10+ characters required
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-bold">ℹ️ Note:</span> The admin will be
                notified about this cancellation and can reassign the task to
                another authority if needed.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6 flex gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Keep Task
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !reason.trim() || reason.trim().length < 10}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span>⏳</span> Cancelling...
              </>
            ) : (
              <>
                <span>❌</span> Confirm Cancellation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCancelReasonModal;
