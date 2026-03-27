import React, { useEffect, useState } from 'react';
import taskApi from '../../services/taskApi';
import reportApi from '../../services/reportApi';

// TaskForm: form for creating or editing tasks
// SRP: handling task form creation/editing logic
export const TaskForm = ({ task, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    reportId: '',
    assignedTo: '',
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  const [errors, setErrors] = useState({});
  const [reports, setReports] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [authoritiesLoading, setAuthoritiesLoading] = useState(false);

  // Load pending reports and authorities on mount
  useEffect(() => {
    const loadData = async () => {
      setReportsLoading(true);
      setAuthoritiesLoading(true);
      try {
        const [reportsData, authoritiesData] = await Promise.all([
          reportApi.getPendingReports(),
          taskApi.getAuthorities(),
        ]);
        setReports(Array.isArray(reportsData) ? reportsData : []);
        setAuthorities(Array.isArray(authoritiesData?.authorities) ? authoritiesData.authorities : []);
      } catch (err) {
        console.error('Failed to load form data:', err);
      } finally {
        setReportsLoading(false);
        setAuthoritiesLoading(false);
      }
    };

    loadData();
  }, []);

  // Populate form if editing an existing task
  useEffect(() => {
    if (task) {
      setFormData({
        reportId: task.reportId?._id || '',
        assignedTo: task.assignedTo?._id || '',
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectReport = (reportId) => {
    const report = reports.find((r) => r._id === reportId);
    setFormData((prev) => ({
      ...prev,
      reportId,
      title: report ? `Investigate: ${report.title}` : '',
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reportId) newErrors.reportId = 'Report is required';
    if (!formData.assignedTo) newErrors.assignedTo = 'Authority is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      reportId: formData.reportId,
      assignedTo: formData.assignedTo,
      priority: formData.priority,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      dueDate: formData.dueDate || undefined,
    };

    if (onSubmit) {
      onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">Report *</label>
        <select
          name="reportId"
          value={formData.reportId}
          onChange={(e) => handleSelectReport(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00569c] ${
            errors.reportId ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={reportsLoading || isLoading}
        >
          <option value="">
            {reportsLoading ? 'Loading reports...' : 'Select a pending report'}
          </option>
          {reports.map((r) => (
            <option key={r._id} value={r._id}>
              {r.title} {r.address ? `(${r.address})` : ''}
            </option>
          ))}
        </select>
        {errors.reportId && <p className="text-xs text-red-600 mt-1">{errors.reportId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">Assign To *</label>
          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00569c] ${
              errors.assignedTo ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={authoritiesLoading || isLoading}
          >
            <option value="">
              {authoritiesLoading ? 'Loading authorities...' : 'Select authority'}
            </option>
            {authorities.map((a) => (
              <option key={a._id} value={a._id}>
                {a.firstName} {a.lastName} ({a.location?.district || 'Unknown'})
              </option>
            ))}
          </select>
          {errors.assignedTo && <p className="text-xs text-red-600 mt-1">{errors.assignedTo}</p>}
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00569c]"
            disabled={isLoading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Investigate contamination report"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00569c] ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
          required
        />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">Description (optional)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add any notes for the authority team..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00569c]"
          style={{ height: 110 }}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">Due Date (optional)</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00569c]"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-[#00569c] text-white rounded-lg hover:bg-[#003f73] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
