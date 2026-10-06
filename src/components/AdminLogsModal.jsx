'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiX,
  FiShield,
  FiRefreshCw,
  FiAlertTriangle,
  FiActivity,
  FiFileText,
  FiUserCheck,
} from 'react-icons/fi';

export default function AdminLogsModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/admin/logs', { withCredentials: true });
      if (res.data?.success) {
        setLogs(res.data.data || []);
      } else {
        setError(res.data?.message || 'Failed to load audit logs.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Access denied or error fetching logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action) => {
    if (action.includes('UNAUTHORIZED') || action.includes('IDOR')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">
          <FiAlertTriangle className="h-3 w-3" /> Security Alert
        </span>
      );
    }
    if (action.includes('EXPORT')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
          <FiFileText className="h-3 w-3" /> Excel Export
        </span>
      );
    }
    if (action.includes('DELETE')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
          Delete Action
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
        <FiActivity className="h-3 w-3" /> {action}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-7 shadow-2xl border border-[#CFE0F5] my-8 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E1EAF6] pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FiShield className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-[#072A44]">
                Administrative Audit & Activity Logs
              </h3>
              <p className="text-xs text-slate-500">
                Isolated security log for administrative actions, exports, and access attempts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              title="Refresh logs"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <div className="h-8 w-8 border-3 border-[#0B5ED7] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading audit records...
            </div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 p-4 border border-rose-200 text-xs text-rose-700 font-semibold text-center">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No administrative logs recorded yet.
            </div>
          ) : (
            <div className="rounded-2xl border border-[#CFE0F5] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EEF4FC] text-[#072A44] font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Timestamp</th>
                    <th className="py-3 px-3.5">User / Admin</th>
                    <th className="py-3 px-3.5">Action</th>
                    <th className="py-3 px-3.5">Details</th>
                    <th className="py-3 px-3.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1EAF6]">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-[#072A44] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <FiUserCheck className="h-3 w-3 text-[#0B5ED7]" />
                          {log.adminEmail || 'system'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate">
                        {typeof log.details === 'object'
                          ? JSON.stringify(log.details)
                          : log.details || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {log.ip || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
