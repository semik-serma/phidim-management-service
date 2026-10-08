'use client';

import React, { useState, useEffect } from 'react';
import { FiClock, FiPrinter, FiX } from 'react-icons/fi';
import PrintableBill, { extractBillTime } from './PrintableBill';

export default function PrintBillModal({ bill, isOpen, onClose }) {
  const [customTime, setCustomTime] = useState('');

  useEffect(() => {
    if (bill) {
      setCustomTime(extractBillTime(bill));
    }
    // Preload logo and signature images to ensure instant, glitch-free print rendering
    if (typeof window !== 'undefined') {
      const img1 = new Image();
      img1.src = '/logo.png?v=4';
      const img2 = new Image();
      img2.src = '/signature_original.png?v=4';
    }
  }, [bill, isOpen]);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('bill-print-active');
    }
    // Allow DOM reflow and image layout calculations to complete before opening the print dialog
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          if (typeof document !== 'undefined') {
            document.body.classList.remove('bill-print-active');
          }
        }, 800);
      }, 150);
    });
  };

  const handleSetCurrentTime = () => {
    const now = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    setCustomTime(now);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto bill-modal-backdrop">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col bill-modal-card">
        {/* Modal Toolbar (hidden during print) */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50 print:hidden shrink-0 gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#072A44]">
              Print Preview — {bill.bill_no || 'Bill'}
            </h3>
            <p className="text-xs text-slate-500">
              Official Phidim Service format with PAN, stamp, and authorized signature.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Editable Bill Time Box */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
              <FiClock className="h-3.5 w-3.5 text-[#0B5ED7]" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time:</span>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-28 text-xs font-black text-[#072A44] bg-transparent focus:outline-none focus:bg-slate-50 px-1 py-0.5 rounded border-b border-dashed border-slate-300"
                title="Editable Bill Time - changes reflect directly on the printed bill"
              />
              <button
                type="button"
                onClick={handleSetCurrentTime}
                className="rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-[#0B5ED7] hover:bg-blue-100 transition cursor-pointer"
                title="Set to Current Time"
              >
                Now
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B5ED7] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#0B5ED7]/25 hover:bg-[#0A4FB3] transition cursor-pointer"
            >
              <FiPrinter className="h-4 w-4" />
              Print / Save as PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area (Screen View) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible">
          <PrintableBill bill={{ ...bill, print_time: customTime }} />
        </div>
      </div>
    </div>
  );
}
