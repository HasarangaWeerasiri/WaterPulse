import React, { useState, useEffect } from "react";
import taskApi from "../../services/taskApi";
import reportApi from "../../services/reportApi";

export const TaskDetailModal = ({ task, isOpen, onClose }) => {
  if (!isOpen || !task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
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
        return "from-green-500 to-emerald-600";
      case "in-progress":
        return "from-blue-500 to-cyan-600";
      case "cancelled":
        return "from-red-500 to-pink-600";
      default:
        return "from-[#00569c] to-[#003f73]";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✅";
      case "in-progress":
        return "⚙️";
      case "cancelled":
        return "❌";
      default:
        return "⏳";
    }
  };

  const getPriorityLevel = (priority) => {
    switch (priority) {
      case "low":
        return { icon: "🟢", color: "bg-green-100 text-green-700" };
      case "medium":
        return { icon: "🟡", color: "bg-yellow-100 text-yellow-700" };
      case "high":
        return { icon: "🔴", color: "bg-red-100 text-red-700" };
      default:
        return { icon: "⭕", color: "bg-gray-100 text-gray-700" };
    }
  };

  const priority = getPriorityLevel(task.priority);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${getStatusColor(
            task.status
          )} text-white px-8 py-10 relative`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{getStatusIcon(task.status)}</span>
                <h1 className="text-4xl font-bold">{task.title}</h1>
              </div>
              <div className="flex gap-3 flex-wrap items-center">
                <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-bold capitalize">
                  {task.status.replace("_", " ")}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${priority.color}`}>
                  {priority.icon} {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                {isOverdue && (
                  <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-bold">
                    ⏰ Overdue
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-3 rounded-full transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Description */}
          {task.description && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">📝</span> Description
              </h3>
              <p className="text-gray-700 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Assigned To */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">👤</span> Assigned To
              </h3>
              <p className="text-2xl font-bold text-[#00569c] mb-2">
                {task.assignedTo?.firstName} {task.assignedTo?.lastName}
              </p>
              {task.assignedTo?.location?.district && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  📍 {task.assignedTo.location.district}
                </p>
              )}
              {task.assignedTo?.email && (
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                  📧 {task.assignedTo.email}
                </p>
              )}
            </div>

            {/* Assigned By */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🔐</span> Assigned By
              </h3>
              <p className="text-2xl font-bold text-[#00569c] mb-2">
                {task.assignedBy?.firstName} {task.assignedBy?.lastName}
              </p>
              <span className="inline-block px-3 py-1 bg-[#00569c]/20 text-[#00569c] text-xs font-bold rounded-full">
                Administrator
              </span>
            </div>
          </div>

          {/* Report & Timeline Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Related Report */}
            {task.reportId && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔗</span> Related Report
                </h3>
                <p className="text-2xl font-bold text-green-700 mb-2">
                  {task.reportId.title || "Report"}
                </p>
                {task.reportId.address && (
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    📍 {task.reportId.address}
                  </p>
                )}
                {task.reportId.contaminationType && (
                  <p className="text-sm text-gray-700 flex items-center gap-2 mt-2">
                    ⚗️ {task.reportId.contaminationType}
                  </p>
                )}
              </div>
            )}

            {/* Timeline Info */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span> Timeline
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Created</p>
                  <p className="text-gray-700 font-medium">{formatDate(task.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Last Updated</p>
                  <p className="text-gray-700 font-medium">{formatDate(task.updatedAt)}</p>
                </div>
                {task.dueDate && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Due Date</p>
                    <p className={`font-medium ${isOverdue ? "text-red-600 font-bold" : "text-gray-700"}`}>
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Specific Sections */}
          {task.status === "completed" && task.resolutionNotes && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-300">
              <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🎉</span> Resolution Notes
              </h3>
              <p className="text-green-800">{task.resolutionNotes}</p>
            </div>
          )}

          {task.status === "cancelled" && (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-300">
              <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">❌</span> Cancellation Details
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-red-800">
                  <span className="font-bold">Cancelled by:</span>{" "}
                  {task.cancelledByRole === "admin" ? "Administrator" : "Authority"}
                </p>
                {task.cancellationReason ? (
                  <p className="text-red-800">
                    <span className="font-bold">Reason:</span> {task.cancellationReason}
                  </p>
                ) : (
                  <p className="text-red-800 text-sm">
                    This task was cancelled by admin and can be reassigned.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Task Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-bold uppercase">Task ID</p>
                <p className="text-gray-700 font-mono text-xs mt-1">{task._id}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase">Status</p>
                <p className="text-gray-700 capitalize">{task.status}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase">Priority Level</p>
                <p className="text-gray-700 capitalize">{task.priority}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase">Created By</p>
                <p className="text-gray-700">{task.assignedBy?.firstName} {task.assignedBy?.lastName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#00569c] to-[#003f73] text-white rounded-lg hover:shadow-lg transition font-bold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;