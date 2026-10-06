'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import {
  FiFileText,
  FiDownload,
  FiPrinter,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiUser,
  FiMapPin,
  FiPhone,
  FiCalendar,
} from 'react-icons/fi';

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
        const res = await axios.get(`/api/bills/shared/${token}`);
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
      const res = await axios.get(`/api/bills/shared/${token}/export`, {
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

  const billDateStr = bill.bill_date
    ? new Date(bill.bill_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

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

        {/* Official Bill Paper */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#CFE0F5] p-8 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E1EAF6] pb-6 gap-4">
            <div>
              <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#0B5ED7]">
                Official Service Invoice
              </span>
              <h1 className="text-2xl font-black text-[#072A44] tracking-tight">
                PHIDIM SERVICE
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Electrical & Maintenance Solutions
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#0B5ED7] border border-blue-200">
                {bill.bill_no || 'BILL'}
              </span>
              <p className="text-xs font-semibold text-slate-600 mt-2 flex items-center sm:justify-end gap-1">
                <FiCalendar className="h-3 w-3 text-slate-400" />
                Date: {billDateStr}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                <FiCheckCircle className="h-3 w-3" />
                Status: {(bill.status || 'issued').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Customer & Project Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-[#F8FAFD] p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Billed To (Customer)
              </p>
              <p className="text-base font-extrabold text-[#072A44] flex items-center gap-1.5">
                <FiUser className="h-4 w-4 text-[#0B5ED7]" />
                {bill.customer_name}
              </p>
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <FiPhone className="h-3.5 w-3.5 text-slate-400" />
                {bill.phone_number}
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <FiMapPin className="h-3.5 w-3.5 text-slate-400" />
                {bill.address}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#F8FAFD] p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Project / Service Purpose
              </p>
              <p className="text-sm font-extrabold text-[#072A44]">
                {bill.project}
              </p>
              {bill.creator_name && (
                <p className="text-xs text-slate-500 pt-2">
                  Issued By: <span className="font-semibold text-slate-700">{bill.creator_name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-2xl border border-[#CFE0F5] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF4FC] text-[#072A44] font-extrabold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4 w-20 text-center">Qty</th>
                  <th className="py-3 px-4 w-28 text-right">Rate (Rs.)</th>
                  <th className="py-3 px-4 w-32 text-right">Total (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1EAF6]">
                {(bill.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#072A44]">
                      {item.particular}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                      {item.qty}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      {Number(item.rate).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-[#072A44]">
                      {Number(item.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Footer Banner */}
            <div className="bg-[#072A44] text-white p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-200 font-bold">
                  Grand Total Amount
                </p>
                <p className="text-[11px] text-slate-300">
                  Total Items: {bill.items?.length || 0}
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#FFD600]">
                Rs. {(bill.grand_total || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-400 pt-4 border-t border-slate-100">
            This document is an electronic service record issued by Phidim Service Electrical Billing System.
          </div>
        </div>
      </div>
    </div>
  );
}
