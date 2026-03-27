import React, { useEffect, useState } from "react";
import taskApi from "../../services/taskApi";
import { TaskCard } from "./TaskCard";

// TaskList: fetches and renders tasks for the current user
// SRP: managing the list of tasks
export const TaskList = ({
  isAdmin = false,
  filters = {},
  refreshToken,
  onTaskDelete,
  onTaskEdit,
}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (isAdmin) {
        data = await taskApi.getAllTasks(filters);
      } else {
        data = await taskApi.getMyTasks();
      }
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load tasks.";
      setError(message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [refreshToken, isAdmin, JSON.stringify(filters)]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await taskApi.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      if (onTaskDelete) onTaskDelete(id);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete task.";
      setError(message);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setStatusUpdating(taskId);
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)),
      );
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update task status.";
      setError(message);
    } finally {
      setStatusUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-600 bg-white shadow-lg rounded-2xl animate-report-fade-in">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-2xl shadow-lg border border-[#608A9A]/20 animate-report-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#164871] font-universo tracking-wide">
          {isAdmin ? "All Tasks" : "Your Tasks"}
        </h2>
        <button
          type="button"
          onClick={loadTasks}
          className="px-4 py-2 text-sm font-medium text-white bg-[#16863f] rounded-lg hover:bg-[#608A9A] transition shadow-sm"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 border border-red-100 rounded-md bg-red-50">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-600">
          {isAdmin
            ? "No tasks created yet."
            : "You have no assigned tasks yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              id={task._id}
              title={task.title}
              description={task.description}
              status={task.status}
              priority={task.priority}
              assignedTo={task.assignedTo}
              dueDate={task.dueDate}
              createdAt={task.createdAt}
              onView={() => onTaskEdit && onTaskEdit(task)}
              onEdit={() => onTaskEdit && onTaskEdit(task)}
              onDelete={() => handleDelete(task._id)}
              onStatusChange={(status) => handleStatusChange(task._id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
