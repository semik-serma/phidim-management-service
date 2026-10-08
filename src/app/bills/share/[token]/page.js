'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api';
import {
  FiFileText,
  FiDownload,
  FiPrinter,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import PrintableBill from '@/components/PrintableBill';

export default function SharedBillPage() {
  const params = useParams();
  const token = params?.token;

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchSharedBill = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE_URL}/bills/shared/${token}`);
        if (res.data?.success) {
          setBill(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load shared bill.');
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            'This shared bill link is invalid or has expired.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSharedBill();
  }, [token]);

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const res = await axios.get(`${API_BASE_URL}/bills/shared/${token}/export`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bill_${bill?.bill_no || 'Shared'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download Excel file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F8FD] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-[#CFE0F5] max-w-sm w-full">
          <div className="h-10 w-10 border-4 border-[#0B5ED7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-base font-extrabold text-[#072A44]">Loading Shared Bill</h3>
          <p className="text-xs text-slate-500 mt-1">Verifying secure token and permissions...</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen bg-[#F4F8FD] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-rose-200 max-w-md w-full">
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-extrabold text-[#072A44]">Access Unavailable</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {error || 'The requested bill link is invalid, expired, or access is restricted.'}
          </p>
          <p className="text-[11px] text-slate-400 mt-3">
            If you are a customer or client, please contact the bill issuer for an updated link.
          </p>
        </div>
      </div>
    );
  }

  const expiresStr = bill.share_expires_at
    ? new Date(bill.share_expires_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No Expiry';

  return (
    <div className="min-h-screen bg-[#F4F8FD] py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Action Bar (Top) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-[#CFE0F5] print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B5ED7] text-white font-bold">
              <FiFileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-[#072A44]">Shared Bill Document</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <FiClock className="h-3 w-3 text-amber-500" />
                Valid until: {expiresStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <FiPrinter className="h-3.5 w-3.5" /> Print / PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B5ED7] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0A4FB3] transition cursor-pointer disabled:opacity-50"
            >
              <FiDownload className="h-3.5 w-3.5" />
              {downloading ? 'Exporting...' : 'Download Excel (.xlsx)'}
            </button>
          </div>
        </div>

        {/* Authentic Printable Bill Document (Exact Reference Match) */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#CFE0F5] p-2 sm:p-6 print:border-none print:shadow-none print:p-0">
          <PrintableBill bill={bill} />
        </div>
      </div>
    </div>
  );
}
