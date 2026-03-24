import React, { useEffect, useState } from 'react';
import reportApi from '../../services/reportApi';
import { MapPicker } from './MapPicker';

// ReportForm: handles creating or updating a contamination report.
// SRP: manage form state & submit; no list or layout responsibilities.
export const ReportForm = ({ onCreated, editingReport, onEditCompleted }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    imageUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

   // When an editing report is provided, prefill the form with its values
  useEffect(() => {
    if (editingReport) {
      setForm({
        title: editingReport.title || '',
        description: editingReport.description || '',
        latitude: editingReport.location?.coordinates?.[1]?.toString() || '',
        longitude: editingReport.location?.coordinates?.[0]?.toString() || '',
        address: editingReport.address || '',
        imageUrl: editingReport.imageUrl || '',
      });
      setSuccess(null);
      setError(null);
    } else {
      setForm({
        title: '',
        description: '',
        latitude: '',
        longitude: '',
        address: '',
        imageUrl: '',
      });
      setSuccess(null);
      setError(null);
    }
  }, [editingReport]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!form.latitude || !form.longitude) {
        setError('Please select a location on the map.');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: form.title,
        description: form.description,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        address: form.address || undefined,
        imageUrl: form.imageUrl || undefined,
      };
      let result;

      if (editingReport && editingReport._id) {
        result = await reportApi.updateReport(editingReport._id, payload);
        setSuccess('Report updated successfully.');
        if (onEditCompleted) {
          onEditCompleted(result.report);
        }
      } else {
        result = await reportApi.createReport(payload);
        setSuccess('Report submitted successfully.');
        setForm({ title: '', description: '', latitude: '', longitude: '', address: '', imageUrl: '' });

        if (onCreated) {
          onCreated(result.report);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit report.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocationChange = ({ latitude, longitude, address }) => {
    setForm((prev) => ({
      ...prev,
      latitude: latitude?.toString() || '',
      longitude: longitude?.toString() || '',
      address: address || '',
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#608A9A]/20 animate-report-fade-in">
      <h2 className="text-2xl font-bold text-[#164871] mb-6 font-universo tracking-wide">
        {editingReport ? 'Update Water Issue' : 'Report a Water Issue'}
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700 border border-green-100">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-universo">Issue Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Short summary (e.g., Water leak near main road)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-universo">Description</label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the water issue in detail..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-universo">
            Location on Map
          </label>
          <MapPicker
            value={
              form.latitude && form.longitude
                ? { latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) }
                : null
            }
            onChange={handleLocationChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-universo">Address</label>
          <textarea
            name="address"
            rows={2}
            value={form.address}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 resize-none"
            placeholder="Address will appear here after you select a point on the map, and you can adjust it if needed."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-universo">Image URL (optional)</label>
          <input
            type="url"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
          <p className="mt-1 text-xs text-gray-500">
            If provided, URL must start with http:// or https://
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-[#164871] text-white font-semibold rounded-lg hover:bg-[#608A9A] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;
