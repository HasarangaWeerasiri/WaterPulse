import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronDown,
  X,
} from 'lucide-react';
import reportApi from '../../services/reportApi';
import { StatusBadge } from './StatusBadge';

const STATUS_OPTIONS = ['Unverified', 'In Progress', 'Confirmed', 'Resolved', 'Spam'];

const STATUS_META = {
  Unverified: {
    icon: <AlertCircle size={15} />,
    countColor: 'text-amber-700',
    bg: 'from-amber-400 to-orange-500',
    light: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  'In Progress': {
    icon: <Clock size={15} />,
    countColor: 'text-blue-700',
    bg: 'from-blue-500 to-indigo-600',
    light: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  Confirmed: {
    icon: <CheckCircle2 size={15} />,
    countColor: 'text-red-700',
    bg: 'from-red-500 to-rose-600',
    light: 'bg-red-50 border-red-200 text-red-700',
  },
  Resolved: {
    icon: <CheckCircle2 size={15} />,
    countColor: 'text-emerald-700',
    bg: 'from-emerald-500 to-green-600',
    light: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  Spam: {
    icon: <AlertCircle size={15} />,
    countColor: 'text-gray-700',
    bg: 'from-gray-500 to-gray-700',
    light: 'bg-gray-50 border-gray-200 text-gray-700',
  },
};

// Gradient: dark #164871 → mid #608A9A → light #9BBEC9
const HEADER_GRADIENT = 'linear-gradient(to right, #164871, #608A9A, #9BBEC9)';
const THEAD_GRADIENT  = 'linear-gradient(to right, #164871, #608A9A, #9BBEC9)';
const ACCENT_COLOR    = '#608A9A';

const InlineStatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META['Unverified'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.light}`}
    >
      {React.cloneElement(meta.icon, { size: 11 })}
      {status}
    </span>
  );
};

export const AdminReportList = () => {
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.getAllReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const notify = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 2500);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await reportApi.updateReportStatus(id, newStatus);
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
      notify('Status updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this report?')) return;
    try {
      await reportApi.deleteReport(id);
      setReports(prev => prev.filter(r => r._id !== id));
      notify('Report deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete report.');
    }
  };

  const triggerPdfDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    if (!reports.length) return;
    try {
      const blob = await reportApi.downloadAllReportsPdf();
      triggerPdfDownload(blob, 'all-reports.pdf');
      notify('All reports PDF downloaded.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download PDF.');
    }
  };

  const handleDownloadSingle = async (r) => {
    try {
      const blob = await reportApi.downloadReportPdf(r._id);
      const safeTitle = (r.title || 'report').replace(/[^a-z0-9\-]+/gi, '_');
      triggerPdfDownload(blob, `${safeTitle}-${r._id}.pdf`);
      notify('Report PDF downloaded.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download PDF.');
    }
  };

  const filteredReports = useMemo(() => {
    const sorted = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const term   = search.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter(r =>
      r.title?.toLowerCase().includes(term)            ||
      r.description?.toLowerCase().includes(term)      ||
      r.address?.toLowerCase().includes(term)          ||
      r.reportedBy?.email?.toLowerCase().includes(term)||
      r.reportedBy?.firstName?.toLowerCase().includes(term)
    );
  }, [reports, search]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-sm text-gray-400">
      <RefreshCw size={16} className="animate-spin" />
      Loading reports…
    </div>
  );

  return (
    <div className="p-6 space-y-5 font-sans">

      {/* ── HEADER ── */}
      <div
        className="relative p-6 overflow-hidden shadow-lg rounded-2xl"
        style={{ background: HEADER_GRADIENT }}
      >
        {/* decorative bubbles */}
        <div className="absolute rounded-full w-36 h-36 -top-8 -right-8 bg-white/10" />
        <div className="absolute w-20 h-20 rounded-full -bottom-5 right-24 bg-white/5"  />

        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">All Reports</h1>
            <p className="mt-0.5 text-xs text-white/80">Manage and track contamination reports</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadReports}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-white/20 border border-white/30 rounded-xl hover:bg-white/30 active:scale-95 transition"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={!reports.length}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white rounded-xl shadow hover:bg-gray-50 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: '#164871' }}
            >
              <Download size={13} />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-3 gap-4">
        {STATUS_OPTIONS.map(s => {
          const count = reports.filter(r => (r.status || 'Unverified') === s).length;
          const meta  = STATUS_META[s];
          return (
            <div key={s} className="relative overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${meta.bg} opacity-10`} />
              <div className="relative flex items-center gap-3 px-5 py-4">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${meta.bg} shadow-md`}>
                  {React.cloneElement(meta.icon, { size: 18, color: 'white' })}
                </div>
                <div>
                  <div className={`text-2xl font-bold ${meta.countColor}`}>{count}</div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">{s}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── SEARCH ── */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none left-3.5 top-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, reporter, address…"
          className="w-full py-2 text-sm placeholder-gray-400 transition bg-white border border-gray-200 shadow-sm pl-9 pr-9 rounded-xl focus:outline-none"
          style={{ '--tw-ring-color': '#608A9A44' }}
          onFocus={e  => { e.target.style.borderColor = ACCENT_COLOR; e.target.style.boxShadow = `0 0 0 3px ${ACCENT_COLOR}22`; }}
          onBlur={e   => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── ALERTS ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
          <AlertCircle size={14} className="shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={13} /></button>
        </div>
      )}
      {actionMessage && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-sm border rounded-xl text-emerald-700 bg-emerald-50 border-emerald-200">
          <CheckCircle2 size={14} className="shrink-0" />
          {actionMessage}
        </div>
      )}

      {/* ── TABLE ── */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-md rounded-2xl">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <FileText size={30} strokeWidth={1.5} />
            <p className="text-sm">No reports found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead>
                <tr
                  className="text-xs font-bold tracking-wider text-white uppercase"
                  style={{ background: THEAD_GRADIENT }}
                >
                  <th className="px-5 py-3.5 text-left">#</th>
                  <th className="px-5 py-3.5 text-left">Report</th>
                  <th className="px-5 py-3.5 text-left">Reporter</th>
                  <th className="px-5 py-3.5 text-left">Address</th>
                  <th className="px-5 py-3.5 text-left">Date</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-left">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((report, index) => (
                  <tr
                    key={report._id}
                    className="transition-colors"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#608A9A0d'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-400">{index + 1}</td>

                    <td className="px-5 py-3.5 max-w-[220px]">
                      <div className="text-sm font-semibold text-gray-900 truncate">{report.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{report.description}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-gray-800">{report.reportedBy?.firstName || '—'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{report.reportedBy?.email}</div>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[160px] truncate">
                      {report.address || '—'}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-1.5">
                        <InlineStatusBadge status={report.status || 'Unverified'} />
                        <div className="relative inline-block">
                          <select
                            value={report.status || 'Unverified'}
                            onChange={e => handleStatusChange(report._id, e.target.value)}
                            className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none cursor-pointer transition"
                            onFocus={e  => { e.target.style.borderColor = ACCENT_COLOR; e.target.style.boxShadow = `0 0 0 2px ${ACCENT_COLOR}33`; }}
                            onBlur={e   => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <ChevronDown size={11} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-2 top-1/2" />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {/* Download — #164871 → #608A9A */}
                        <button
                          onClick={() => handleDownloadSingle(report)}
                          title="Download report"
                          className="p-2 text-white transition rounded-lg shadow-sm active:scale-95"
                          style={{ background: 'linear-gradient(to bottom right, #164871, #608A9A)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(to bottom right, #0f3452, #4a7080)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(to bottom right, #164871, #608A9A)'}
                        >
                          <Download size={13} />
                        </button>

                        {/* Delete — red */}
                        <button
                          onClick={() => handleDelete(report._id)}
                          title="Delete report"
                          className="p-2 text-white transition rounded-lg shadow-sm bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-95"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredReports.length > 0 && (
          <div className="px-5 py-2.5 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
            Showing{' '}
            <span className="font-semibold" style={{ color: '#164871' }}>{filteredReports.length}</span>{' '}
            of <span className="font-semibold">{reports.length}</span> report{reports.length !== 1 ? 's' : ''} — newest first
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminReportList;