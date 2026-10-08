'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  FiX,
  FiShare2,
  FiCopy,
  FiCheck,
  FiDownload,
  FiClock,
  FiLock,
  FiLink,
} from 'react-icons/fi';

export default function ShareBillModal({ bill, onClose }) {
  const [expiryDays, setExpiryDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/bills/bill/${bill._id}/share`, { expiryDays });

      if (res.data?.success) {
        setShareData(res.data.data);
        toast.success('Share link generated!');
      } else {
        toast.error(res.data?.message || 'Failed to generate share link');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const getFullShareUrl = () => {
    if (!shareData?.shareToken) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/bills/share/${shareData.shareToken}`;
  };

  const handleCopy = () => {
    const url = getFullShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const token = shareData?.shareToken;
      const url = token ? `/bills/shared/${token}/export` : `/bills/export/excel?search=${bill.bill_no || ''}`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Bill_${bill.bill_no || 'Export'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Excel bill exported successfully!');
    } catch {
      toast.error('Failed to export Excel file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-[#CFE0F5] my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[#E1EAF6] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0B5ED7]">
              <FiShare2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-[#072A44]">
                Share Bill Document
              </h3>
              <p className="text-xs text-slate-500">
                {bill.bill_no || 'Bill'} &bull; {bill.customer_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Expiry Selector */}
          {!shareData ? (
            <div className="rounded-2xl border border-[#CFE0F5] bg-[#F8FAFD] p-4 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#072A44] flex items-center gap-1.5">
                <FiClock className="h-3.5 w-3.5 text-[#0B5ED7]" />
                Select Link Validity Period:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '24 Hours', days: 1 },
                  { label: '7 Days', days: 7 },
                  { label: '30 Days', days: 30 },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setExpiryDays(item.days)}
                    className={`rounded-xl py-2 px-3 text-xs font-bold transition border cursor-pointer ${
                      expiryDays === item.days
                        ? 'bg-[#0B5ED7] text-white border-[#0B5ED7] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#0B5ED7]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B5ED7] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0B5ED7]/25 hover:bg-[#0A4FB3] transition cursor-pointer disabled:opacity-60"
                >
                  <FiLink className="h-4 w-4" />
                  {loading ? 'Creating Secure Link...' : 'Generate Shareable Link'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <FiLock className="h-3.5 w-3.5 text-emerald-600" /> Secure Link Ready
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700">
                    Expires:{' '}
                    {new Date(shareData.expiresAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={getFullShareUrl()}
                    className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#072A44] px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    {copied ? <FiCheck className="h-3.5 w-3.5 text-emerald-400" /> : <FiCopy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={downloading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#CFE0F5] bg-white py-2.5 text-xs font-bold text-[#072A44] hover:bg-slate-50 transition cursor-pointer"
                >
                  <FiDownload className="h-4 w-4 text-[#0B5ED7]" />
                  {downloading ? 'Downloading...' : 'Download Excel (.xlsx)'}
                </button>
                <button
                  type="button"
                  onClick={() => setShareData(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed border border-slate-200">
            <span className="font-bold text-slate-700">Access Guarantee:</span> The recipient can only view and export this specific bill. They have zero access to administrative logs, internal user records, or other customers&apos; bills.
          </div>
        </div>
      </div>
    </div>
  );
}
