import React from "react";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskPriorityBadge from "./TaskPriorityBadge";

export const TaskDetailModal = ({ task, isOpen, onClose }) => {
  if (!isOpen || !task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "completed";

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "from-green-400 to-emerald-500";
      case "in-progress":
        return "from-blue-400 to-cyan-500";
      case "cancelled":
        return "from-red-400 to-pink-500";
      default:
        return "from-[#00569c] to-[#003f73]";
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-gray-100 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${getStatusColor(task.status)} text-white px-8 py-8 shadow-lg`}
      >
        <div className="flex justify-between items-start max-w-7xl mx-auto w-full">
          <div className="flex-1 pr-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-8 bg-white rounded-full opacity-80"></div>
              <h2 className="text-4xl font-bold">{task.title}</h2>
            </div>
            <div className="flex gap-3 flex-wrap">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
              {isOverdue && (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  ⚠️ Overdue
                </span>
              )}
            </div>
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
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-6 h-full flex flex-col">
          {/* Top Section - Description */}
          {task.description && (
            <div className="mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-[#00569c] rounded-lg flex items-center justify-center text-white text-lg">
                    📝
                  </div>
                  <h3 className="text-base font-bold text-gray-800">
                    Description
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm line-clamp-2">
                  {task.description}
                </p>
              </div>
            </div>
          )}

          {/* Main Grid - 2x2 Layout */}
          <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
            {/* Card 1: Assigned To */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-white text-lg">
                  👤
                </div>
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Assigned To
                </h3>
              </div>
              <p className="font-bold text-[#00569c] text-base mb-2">
                {task.assignedTo?.firstName} {task.assignedTo?.lastName}
              </p>
              {task.assignedTo?.location?.district && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <span>📍</span>
                  <span>{task.assignedTo.location.district}</span>
                </div>
              )}
            </div>

            {/* Card 2: Assigned By */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-lg">
                  🔐
                </div>
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Assigned By
                </h3>
              </div>
              <p className="font-bold text-[#00569c] text-base mb-2">
                {task.assignedBy?.firstName} {task.assignedBy?.lastName}
              </p>
              <span className="inline-block px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg w-fit">
                Administrator
              </span>
            </div>

            {/* Card 3: Related Report */}
            {task.reportId && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg">
                    🔗
                  </div>
                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    Related Report
                  </h3>
                </div>
                <p className="font-bold text-[#00569c] text-base mb-2">
                  {task.reportId.title || "Report"}
                </p>
                {task.reportId.address && (
                  <p className="text-sm text-gray-600">
                    📍 {task.reportId.address}
                  </p>
                )}
              </div>
            )}

            {/* Card 4: Timeline */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white text-lg">
                  📅
                </div>
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Timeline
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">
                    Created
                  </p>
                  <p className="text-sm text-gray-800 font-medium">
                    {formatDate(task.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">
                    Updated
                  </p>
                  <p className="text-sm text-gray-800 font-medium">
                    {formatDate(task.updatedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">
                    Due
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      isOverdue ? "text-red-600 font-bold" : "text-gray-800"
                    }`}
                  >
                    {task.dueDate ? formatDate(task.dueDate) : "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Completion/Cancellation Info Section */}
          {(task.status === "completed" || task.status === "cancelled") && (
            <div className="mt-6">
              {task.status === "completed" && task.resolutionNotes && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 shadow-sm border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-white text-lg">
                      ✅
                    </div>
                    <h3 className="text-base font-bold text-green-900">
                      Resolution Notes
                    </h3>
                  </div>
                  <p className="text-green-800 leading-relaxed text-sm line-clamp-2">
                    {task.resolutionNotes}
                  </p>
                </div>
              )}

              {task.status === "cancelled" && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-5 shadow-sm border border-red-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg flex items-center justify-center text-white text-lg">
                      ❌
                    </div>
                    <h3 className="text-base font-bold text-red-900">
                      Task Cancelled
                      <span className="text-sm font-medium">
                        {" "}
                        {task.cancelledByRole &&
                        task.cancelledByRole !== "admin"
                          ? "(by Authority)"
                          : "(by Admin)"}
                      </span>
                    </h3>
                  </div>
                  {task.cancellationReason ? (
                    <p className="text-red-800 font-medium text-sm">
                      <span className="font-bold">Reason:</span>{" "}
                      {task.cancellationReason}
                    </p>
                  ) : (
                    <p className="text-red-800 text-sm">
                      Cancelled by admin. Can be reassigned.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#00569c] to-[#003f73] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center gap-2 group"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
