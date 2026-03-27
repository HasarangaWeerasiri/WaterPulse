import React from "react";

// Pure presentational component for task priority labels
// Displays task priority with appropriate color coding
const getPriorityStyles = (priority = "") => {
  const normalized = priority.toLowerCase();

  if (normalized === "low") {
    return "bg-green-100 text-green-800";
  }
  if (normalized === "medium") {
    return "bg-amber-100 text-amber-800";
  }
  if (normalized === "high") {
    return "bg-red-100 text-red-800";
  }

  // default / unknown
  return "bg-gray-100 text-gray-800";
};

// Format priority for display
const formatPriority = (priority = "") => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export const TaskPriorityBadge = ({ priority }) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPriorityStyles(priority)}`}
    >
      {formatPriority(priority) || "Unknown"}
    </span>
  );
};

export default TaskPriorityBadge;
