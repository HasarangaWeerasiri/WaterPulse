import React, { useState, useEffect } from 'react';
import waterLogApi from '../../services/waterLogApi';
import { useAuth } from '../../context/AuthContext';

export const WaterLogsAnalytics = ({ region = null }) => {
  const { user } = useAuth();
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [selectedRegion, setSelectedRegion] = useState(region || '');

  const fetchTrends = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await waterLogApi.getAnalyticsTrends(
        selectedRegion || null,
        selectedMonths
      );
      setTrends(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [selectedMonths, selectedRegion]);

  const getTrendColor = (safetyRating) => {
    if (safetyRating === 'Safe') return 'text-green-600';
    if (safetyRating === 'Warning') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBarColor = (safetyRating) => {
    if (safetyRating === 'Safe') return 'bg-green-500';
    if (safetyRating === 'Warning') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Water Quality Analytics</h2>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Time Period (Months)
          </label>
          <select
            value={selectedMonths}
            onChange={(e) => setSelectedMonths(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
        </div>
        {!region && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Region (Optional)
            </label>
            <input
              type="text"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              placeholder="Enter region name (e.g., Downtown District)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">
          Loading analytics data...
        </div>
      ) : trends.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No analytics data available for the selected filters.
        </div>
      ) : (
        <div className="space-y-6">
          {trends.map((trend, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {trend._id.region || 'All Regions'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {trend._id.month}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{trend.totalCount}</span> logs
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* pH */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">pH Level</p>
                  <p className="text-lg font-bold text-blue-600">
                    {trend.avgPH?.toFixed(2) || 'N/A'}
                  </p>
                </div>

                {/* Turbidity */}
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Turbidity (NTU)</p>
                  <p className="text-lg font-bold text-purple-600">
                    {trend.avgTurbidity?.toFixed(2) || 'N/A'}
                  </p>
                </div>

                {/* Safe Count */}
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Safe</p>
                  <p className="text-lg font-bold text-green-600">
                    {trend.safeCount} ({trend.totalCount > 0 ? ((trend.safeCount / trend.totalCount) * 100).toFixed(1) : 0}%)
                  </p>
                </div>

                {/* Unsafe Count */}
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Unsafe</p>
                  <p className="text-lg font-bold text-red-600">
                    {trend.unsafeCount} ({trend.totalCount > 0 ? ((trend.unsafeCount / trend.totalCount) * 100).toFixed(1) : 0}%)
                  </p>
                </div>
              </div>

              {/* Safety Distribution Bar */}
              {trend.totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full overflow-hidden h-6">
                    <div className="flex h-full">
                      {/* Safe Bar */}
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${(trend.safeCount / trend.totalCount) * 100}%` }}
                        title={`Safe: ${trend.safeCount}`}
                      />
                      {/* Warning Bar */}
                      <div
                        className="bg-yellow-500 h-full"
                        style={{ width: `${(trend.warningCount / trend.totalCount) * 100}%` }}
                        title={`Warning: ${trend.warningCount}`}
                      />
                      {/* Unsafe Bar */}
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${(trend.unsafeCount / trend.totalCount) * 100}%` }}
                        title={`Unsafe: ${trend.unsafeCount}`}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {trend.warningCount > 0 && `W:${trend.warningCount}`}
                  </span>
                </div>
              )}

              {/* Details */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div>pH Range: {trend.minPH?.toFixed(2)} - {trend.maxPH?.toFixed(2)}</div>
                  <div>Turbidity Range: {trend.minTurbidity?.toFixed(2)} - {trend.maxTurbidity?.toFixed(2)} NTU</div>
                  <div>Total Logs: {trend.totalCount}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchTrends}
        disabled={loading}
        className="mt-6 w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Refreshing...' : 'Refresh Analytics'}
      </button>
    </div>
  );
};

export default WaterLogsAnalytics;
