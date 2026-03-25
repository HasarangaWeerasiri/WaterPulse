import { useEffect, useState } from 'react';
import reportApi from '../../services/reportApi';

// SRP: Encapsulates fetching + basic filtering logic for map reports.
// DIP: Accepts an optional loader so callers can customize the source (e.g., confirmed-only).
export function useReportsForMap({ allowedStatuses, loader } = {}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchReports() {
      try {
        setLoading(true);
        setError('');
        const loadFn = loader || reportApi.getAllReports;
        const data = await loadFn();
        if (!isMounted) return;
        const all = Array.isArray(data) ? data : [];
        const filtered = allowedStatuses && allowedStatuses.length
          ? all.filter(r => allowedStatuses.includes(r.status))
          : all;
        setReports(filtered);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.response?.data?.message || 'Failed to load reports for map');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReports();
    return () => {
      isMounted = false;
    };
  }, [allowedStatuses?.join(','), loader]);

  return { reports, loading, error };
}

export default useReportsForMap;
