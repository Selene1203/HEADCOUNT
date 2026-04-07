import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type ActivityLog, type LogCategory } from '../contexts/LogContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { RefreshCw, ShieldAlert, Info, AlertTriangle, Users, ClipboardList, UserCheck, Download } from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? '${import.meta.env.VITE_API_URL}';

const CATEGORY_LABELS: Record<LogCategory, string> = {
  auth:            'Authentication',
  user_management: 'User Management',
  attendance:      'Attendance',
  student_status:  'Student Status',
  data_export:     'Data Export',
};

const CATEGORY_ICONS: Record<LogCategory, React.ReactNode> = {
  auth:            <ShieldAlert className="w-4 h-4" />,
  user_management: <Users className="w-4 h-4" />,
  attendance:      <ClipboardList className="w-4 h-4" />,
  student_status:  <UserCheck className="w-4 h-4" />,
  data_export:     <Download className="w-4 h-4" />,
};

const SEVERITY_STYLES = {
  info:    'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  error:   'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const SEVERITY_ICONS = {
  info:    <Info className="w-3.5 h-3.5" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
  error:   <ShieldAlert className="w-3.5 h-3.5" />,
};

export function LogsPage() {
  const { token } = useAuth();

  const [logs,     setLogs]     = useState<ActivityLog[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [severity, setSeverity] = useState<string>('all');
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 25;

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: ActivityLog[] = await res.json();
      // Sort newest first
      setLogs(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [token]);

  const filtered = logs.filter(l => {
    if (category !== 'all' && l.category !== category) return false;
    if (severity !== 'all' && l.severity !== severity) return false;
    return true;
  });

  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const fmt = (ts: string) =>
    new Date(ts).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1 dark:text-white">Activity Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            System audit trail — {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2 dark:border-gray-700 dark:text-gray-300"
          onClick={fetchLogs}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Category</span>
              <Select value={category} onValueChange={v => { setCategory(v); setPage(1); }}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(Object.keys(CATEGORY_LABELS) as LogCategory[]).map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Severity</span>
              <Select value={severity} onValueChange={v => { setSeverity(v); setPage(1); }}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log table */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading logs…</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm">No logs found for the selected filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.map(entry => (
                <div
                  key={entry.id}
                  className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Severity badge */}
                  <span className={`shrink-0 mt-0.5 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_STYLES[entry.severity]}`}>
                    {SEVERITY_ICONS[entry.severity]}
                    {entry.severity}
                  </span>

                  {/* Category icon */}
                  <span className="shrink-0 mt-0.5 text-gray-400 dark:text-gray-500">
                    {CATEGORY_ICONS[entry.category]}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {entry.action}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        by {entry.performedByName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {entry.detail}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                    {fmt(entry.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="dark:border-gray-700 dark:text-gray-300"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="dark:border-gray-700 dark:text-gray-300"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
