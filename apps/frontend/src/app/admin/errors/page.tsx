'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

interface ErrorLog {
  _id: string;
  errorId: string;
  severity: string;
  source: string;
  category: string;
  message: string;
  errorName: string;
  userEmail?: string;
  timestamp: string;
  occurrenceCount: number;
  resolved: boolean;
  url?: string;
  method?: string;
  statusCode?: number;
}

interface ErrorStats {
  total: number;
  totalOccurrences: number;
  breakdown: Array<{
    _id: {
      severity: string;
      category: string;
      source: string;
    };
    count: number;
    uniqueErrors: number;
  }>;
}

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [filters, setFilters] = useState({
    severity: '',
    source: '',
    category: '',
    resolved: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchErrors();
    fetchStats();
  }, [filters, page]);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      });

      const response = await axios.get(`/errors?${params}`);
      setErrors(response.data.errors);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/errors/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch error stats:', error);
    }
  };

  const resolveError = async (errorId: string) => {
    try {
      await axios.patch(`/errors/${errorId}/resolve`, {
        resolutionNotes: 'Marked as resolved from admin panel',
      });
      fetchErrors();
      fetchStats();
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  };

  const deleteError = async (errorId: string) => {
    if (!confirm('Are you sure you want to delete this error log?')) return;

    try {
      await axios.delete(`/errors/${errorId}`);
      fetchErrors();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete error:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-orange-100 text-orange-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold">Error Logs Dashboard</h1>

        {/* Stats Section */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Errors</h3>
              <p className="mt-2 text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Occurrences</h3>
              <p className="mt-2 text-3xl font-bold">{stats.totalOccurrences}</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-sm font-medium text-gray-500">Unique Error Types</h3>
              <p className="mt-2 text-3xl font-bold">{stats.breakdown.length}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Filters</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">All Sources</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="api">API</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">All Categories</option>
              <option value="authentication">Authentication</option>
              <option value="authorization">Authorization</option>
              <option value="validation">Validation</option>
              <option value="database">Database</option>
              <option value="network">Network</option>
              <option value="figma_api">Figma API</option>
              <option value="ui_render">UI Render</option>
              <option value="unknown">Unknown</option>
            </select>

            <select
              value={filters.resolved}
              onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>
        </div>

        {/* Error List */}
        <div className="rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : errors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No errors found
                    </td>
                  </tr>
                ) : (
                  errors.map((error) => (
                    <tr key={error._id} className={error.resolved ? 'bg-gray-50' : ''}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getSeverityColor(
                            error.severity
                          )}`}
                        >
                          {error.severity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {error.source}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {error.category}
                      </td>
                      <td className="max-w-md px-6 py-4 text-sm text-gray-900">
                        <div className="truncate" title={error.message}>
                          {error.message}
                        </div>
                        {error.userEmail && (
                          <div className="text-xs text-gray-500">User: {error.userEmail}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {error.occurrenceCount}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(error.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => setSelectedError(error)}
                          className="mr-3 text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {!error.resolved && (
                          <button
                            onClick={() => resolveError(error.errorId)}
                            className="mr-3 text-green-600 hover:text-green-900"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => deleteError(error.errorId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Detail Modal */}
        {selectedError && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedError(null)} />

              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Error Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Error ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedError.errorId}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Severity</label>
                        <span className={`mt-1 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getSeverityColor(selectedError.severity)}`}>
                          {selectedError.severity}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Source</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedError.source}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedError.category}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Occurrences</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedError.occurrenceCount}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Message</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedError.message}</p>
                    </div>

                    {selectedError.url && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">URL</label>
                        <p className="mt-1 text-sm text-gray-900 break-all">{selectedError.url}</p>
                      </div>
                    )}

                    {selectedError.method && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Method</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedError.method} {selectedError.statusCode && `(${selectedError.statusCode})`}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedError.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setSelectedError(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
