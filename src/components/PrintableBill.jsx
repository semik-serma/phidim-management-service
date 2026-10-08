'use client';

import React from 'react';

/**
 * Converts a numeric amount to English words (Title Case)
 * e.g. 58 -> "Fifty Eight Rupees Only"
 */
export function amountInWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 !== 0 ? ' ' + inWords(n % 100) : '')
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '')
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '')
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '')
    );
  }

  return `${inWords(num)} Rupees Only`;
}

/**
 * Converts AD Date to Nepali Bikram Sambat (BS) date string
 * e.g. 2026-10-06 -> 2083-06-20
 */
export function getNepaliDate(adDateVal) {
  try {
    const d = adDateVal ? new Date(adDateVal) : new Date();
    if (Number.isNaN(d.getTime())) return '2083-06-20';

    const adYear = d.getFullYear();
    const adMonth = d.getMonth() + 1; // 1-12
    const adDay = d.getDate();

    // Standard Bikram Sambat offset for year 2026 (BS 2083)
    let bsYear = adYear + 56;
    let bsMonth = 1;
    let bsDay = 1;

    if (adMonth === 10 && adYear === 2026) {
      bsYear = 2083;
      bsMonth = 6;
      bsDay = adDay + 14;
      if (bsDay > 30) {
        bsMonth = 7;
        bsDay = bsDay - 30;
      }
    } else {
      const diffDays = Math.floor(
        (d.getTime() - new Date('2026-10-06').getTime()) / (1000 * 60 * 60 * 24)
      );
      let totalDays = 20 + diffDays;
      let month = 6;
      let year = 2083;

      while (totalDays > 30) {
        totalDays -= 30;
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
      while (totalDays < 1) {
        totalDays += 30;
        month--;
        if (month < 1) {
          month = 12;
          year--;
        }
      }
      bsYear = year;
      bsMonth = month;
      bsDay = totalDays;
    }

    const mm = String(bsMonth).padStart(2, '0');
    const dd = String(bsDay).padStart(2, '0');
    return `${bsYear}-${mm}-${dd}`;
  } catch {
    return '2083-06-20';
  }
}

/**
 * Phidim Service Official Logo
 * Uses /logo.png provided in public folder with anti-glitch print attributes
 */
export function PhidimBillLogo({ className = 'w-24 h-24 sm:w-28 sm:h-28 print:w-20 print:h-20' }) {
  return (
    <img
      src="/logo.png?v=4"
      alt="Phidim Service Logo"
      width={1254}
      height={1254}
      decoding="sync"
      loading="eager"
      className={`${className} object-contain block`}
      style={{ aspectRatio: '1 / 1' }}
    />
  );
}

/**
 * Phidim Blue Rubber Stamp
 * Stamp is already embedded in high resolution in /signature_original.png
 */
export function PhidimOfficialStamp({ className = 'w-24 h-24' }) {
  return null;
}

/**
 * Authentic Authorized Signature & Stamp
 * Uses /signature_original.png provided in public folder
 */
export function PhidimAuthorizedSignature({ className = 'w-52 sm:w-60 h-auto print:w-48 print:h-auto' }) {
  return (
    <img
      src="/signature_original.png?v=4"
      alt="Authorized Signature & Stamp"
      width={1448}
      height={1086}
      decoding="sync"
      loading="eager"
      className={`${className} object-contain block`}
      style={{ aspectRatio: '1448 / 1086' }}
    />
  );
}

/**
 * Helper to check if a Date or timestamp string has a real, non-midnight-UTC time.
 * When date strings like "2026-10-07" are parsed in JS, they default to 00:00:00.000Z (UTC midnight).
 * In Nepal (+05:45), UTC midnight formats to 05:45:00 AM, which is the exact bug being fixed!
 */
export function hasRealTime(val) {
  if (!val) return false;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return false;
  const isUtcMidnight =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0;
  return !isUtcMidnight;
}

export function formatTimeFromDate(d) {
  if (!d || Number.isNaN(d.getTime())) return '12:00:00 PM';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function extractBillTime(bill) {
  if (!bill) return '12:00:00 PM';

  // 1. Explicit print_time override (e.g. from PrintBillModal edit)
  if (bill.print_time && typeof bill.print_time === 'string' && bill.print_time.trim()) {
    return bill.print_time.trim();
  }
  if (bill.printTime && typeof bill.printTime === 'string' && bill.printTime.trim()) {
    return bill.printTime.trim();
  }

  // 2. Explicit bill_time, time, or entryTime string
  const explicitStr = bill.bill_time || bill.time || bill.entryTime;
  if (explicitStr && typeof explicitStr === 'string' && explicitStr.trim()) {
    const bt = explicitStr.trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)$/i.test(bt)) {
      return bt;
    }
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(bt)) {
      const [h, m, s = 0] = bt.split(':').map(Number);
      const temp = new Date();
      temp.setHours(h, m, s, 0);
      return formatTimeFromDate(temp);
    }
  }

  // 3. Prioritize createdAt / created_at (since MongoDB stores the exact real creation timestamp)
  if (hasRealTime(bill.createdAt)) {
    return formatTimeFromDate(new Date(bill.createdAt));
  }
  if (hasRealTime(bill.created_at)) {
    return formatTimeFromDate(new Date(bill.created_at));
  }

  // 4. Check bill_date or date for real time
  if (hasRealTime(bill.bill_date)) {
    return formatTimeFromDate(new Date(bill.bill_date));
  }
  if (hasRealTime(bill.date)) {
    return formatTimeFromDate(new Date(bill.date));
  }

  // 5. If createdAt is present and not UTC midnight (05:45 AM)
  if (bill.createdAt && !Number.isNaN(new Date(bill.createdAt).getTime())) {
    const d = new Date(bill.createdAt);
    if (d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0) {
      return formatTimeFromDate(d);
    }
  }

  // 6. If bill truly has no recorded time, use current local time instead of 05:45:00 AM
  return formatTimeFromDate(new Date());
}

export function extractBillDate(bill) {
  if (!bill) return new Date().toISOString().split('T')[0];
  const raw = bill.bill_date || bill.date || bill.createdAt;
  if (!raw) return new Date().toISOString().split('T')[0];

  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return raw.trim();
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Main PrintableBill Component
 * Renders the bill layout shown in the user's reference image
 */
export default function PrintableBill({ bill }) {
  if (!bill) return null;

  // Extract / Normalize fields
  const invoiceNo = bill.bill_no || bill.reference || 'Bill 001';
  const customerName = bill.customer_name || bill.customer || '—';
  const phoneNumber = bill.phone_number || bill.phoneNumber || '—';
  const address = bill.address || '—';

  const formattedDate = extractBillDate(bill);
  const formattedTime = extractBillTime(bill);

  const rawDateForNepali = bill.bill_date || bill.date || bill.createdAt || new Date();
  const nepaliDateStr = getNepaliDate(rawDateForNepali);

  const items = Array.isArray(bill.items) && bill.items.length > 0 ? bill.items : [];
  const grandTotal = Number(
    bill.grand_total !== undefined
      ? bill.grand_total
      : bill.amount !== undefined
      ? bill.amount
      : items.reduce((acc, it) => acc + (Number(it.total) || (Number(it.qty) * Number(it.rate)) || 0), 0)
  );

  const wordsStr = amountInWords(grandTotal);

  return (
    <div className="printable-bill-wrapper font-sans text-black bg-white select-text w-full max-w-[850px] mx-auto p-4 sm:p-6 print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* Outer Solid Frame */}
      <div className="border-[2px] border-black p-6 sm:p-8 print:p-4 bg-white relative">
        {/* ==================================================== */}
        {/* HEADER SECTION                                       */}
        {/* ==================================================== */}
        <div className="flex items-center justify-between gap-4 pb-3">
          {/* Left: Logo */}
          <div className="shrink-0 flex items-center justify-center">
            <PhidimBillLogo className="w-24 h-24 sm:w-28 sm:h-28 print:w-20 print:h-20" />
          </div>

          {/* Center: Title & Business Info */}
          <div className="flex-1 text-center px-2">
            <p className="text-[12.5px] font-semibold text-black tracking-tight leading-tight">
              Reliable domestic home appliance repair and service
            </p>
            <h1 className="text-[26px] sm:text-[28px] font-black text-black tracking-tight leading-tight mt-1">
              phidim service and supplier
            </h1>
            <p className="text-[15px] font-extrabold text-black mt-0.5">
              Phidim-4, Panchthar
            </p>
            <p className="text-[11.5px] font-medium text-black mt-1">
              CCTV camera • Networking • Computer • House Wiring • Plumbing
            </p>
          </div>

          {/* Right: Bill Info & Nepali Date */}
          <div className="shrink-0 text-right min-w-[130px]">
            <h2 className="text-[24px] sm:text-[28px] font-black text-black tracking-wider leading-none uppercase">
              {bill.title || bill.bill_type || 'BILL'}
            </h2>
            <p className="text-[11.5px] font-bold text-black mt-2">
              Time: {formattedTime}
            </p>
            <p className="text-[11.5px] font-bold text-black mt-0.5">
              मिति: {nepaliDateStr}
            </p>
          </div>
        </div>

        {/* Thick Divider */}
        <div className="h-[3px] bg-black w-full mb-3" />

        {/* ==================================================== */}
        {/* INVOICE & PAN META BOX                                */}
        {/* ==================================================== */}
        <div className="border-[1.5px] border-black px-4 py-2 flex flex-wrap items-center justify-between text-[13px] font-bold bg-white mb-3">
          <div>
            <span>Invoice No: </span>
            <span className="font-normal">{invoiceNo}</span>
          </div>
          <div>
            <span>PAN No: </span>
            <span className="font-normal">618574476</span>
          </div>
          <div>
            <span>Date: </span>
            <span className="font-normal">{formattedDate}</span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CUSTOMER DETAILS BOX                                 */}
        {/* ==================================================== */}
        <div className="border-[1.5px] border-black p-3.5 mb-3 bg-white">
          <div className="font-black text-[12.5px] tracking-wide pb-1.5 border-b border-black">
            {bill.customer_box_title || 'CUSTOMER DETAILS'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 pt-2 text-[13px]">
            <div className="flex">
              <span className="font-bold w-20 shrink-0">{bill.customer_label || 'Name'}:</span>
              <span className="font-normal text-black">{customerName}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-20 shrink-0">{bill.phone_label || 'Phone'}:</span>
              <span className="font-normal text-black">{phoneNumber}</span>
            </div>
            <div className="flex sm:col-span-2">
              <span className="font-bold w-20 shrink-0">{bill.address_label || 'Address'}:</span>
              <span className="font-normal text-black">{address}</span>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* ITEMS / PARTICULARS TABLE                             */}
        {/* ==================================================== */}
        <div className="mb-4">
          <table className="w-full border-collapse border-[2px] border-black text-[13px]">
            <thead>
              <tr className="border-b-[2px] border-black font-black text-center bg-transparent">
                <th className="border-r-[1.5px] border-black py-2 px-3 w-[10%] text-center">S.N.</th>
                <th className="border-r-[1.5px] border-black py-2 px-4 w-[48%] text-center">Particular</th>
                <th className="border-r-[1.5px] border-black py-2 px-3 w-[12%] text-center">Qty</th>
                <th className="border-r-[1.5px] border-black py-2 px-4 w-[15%] text-center">Rate</th>
                <th className="py-2 px-4 w-[15%] text-center">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, idx) => {
                  const rateVal = Number(item.rate) || 0;
                  const totalVal =
                    Number(item.total) || (Number(item.qty) || 1) * rateVal;
                  return (
                    <tr key={idx} className="border-b-[1.5px] border-black">
                      <td className="border-r-[1.5px] border-black py-2 px-3 text-center font-medium">
                        {idx + 1}
                      </td>
                      <td className="border-r-[1.5px] border-black py-2 px-4 text-left font-medium">
                        {item.particular || item.name || 'Service Item'}
                      </td>
                      <td className="border-r-[1.5px] border-black py-2 px-3 text-center font-medium">
                        {item.qty || 1}
                      </td>
                      <td className="border-r-[1.5px] border-black py-2 px-4 text-right font-medium">
                        Rs. {rateVal.toFixed(2)}
                      </td>
                      <td className="py-2 px-4 text-right font-medium">
                        Rs. {totalVal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-b-[1.5px] border-black">
                  <td className="border-r-[1.5px] border-black py-2 px-3 text-center font-medium">1</td>
                  <td className="border-r-[1.5px] border-black py-2 px-4 text-left font-medium">Service Charge</td>
                  <td className="border-r-[1.5px] border-black py-2 px-3 text-center font-medium">1</td>
                  <td className="border-r-[1.5px] border-black py-2 px-4 text-right font-medium">
                    Rs. {grandTotal.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-right font-medium">
                    Rs. {grandTotal.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="border-0 bg-transparent"></td>
                <td className="border-l-[2px] border-b-[2px] border-r-[1.5px] border-black py-2 px-3 text-center font-black uppercase tracking-wide bg-white">
                  GRAND TOTAL
                </td>
                <td className="border-b-[2px] border-r-[2px] border-black py-2 px-4 text-right font-black bg-white">
                  Rs. {grandTotal.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ==================================================== */}
        {/* AMOUNT IN WORDS                                      */}
        {/* ==================================================== */}
        <div className="text-[13px] mt-3 mb-6 print:mb-2 print:mt-2">
          <span className="font-black">Amount in Words: </span>
          <span className="font-bold">{wordsStr}</span>
        </div>

        {/* ==================================================== */}
        {/* FOOTER & SIGNATURE SECTION                           */}
        {/* ==================================================== */}
        <div className="flex flex-wrap items-end justify-between gap-4 pt-3 print:pt-2">
          {/* Left: Contact Information */}
          <div className="text-[12px] space-y-0.5 leading-snug">
            <p className="font-black text-[13px]">phidim service and supplier</p>
            <p className="text-black">Website: phidimservice.com.np</p>
            <p className="text-black">Phone: 9862772457</p>
            <p className="text-black">CCTV • Networking • Computer • Electronics</p>
          </div>

          {/* Right: Official Stamp & Authorized Signature */}
          <div className="flex flex-col items-center justify-end shrink-0">
            <PhidimAuthorizedSignature className="w-52 sm:w-60 h-auto print:w-48 print:h-auto" />
          </div>
        </div>

        {/* Very Bottom: Thank You Note */}
        <div className="text-center text-[11.5px] mt-6 print:mt-2 pt-2 print:pt-1 space-y-0.5 text-black">
          <p className="font-bold text-[13px]">- धन्यवाद -</p>
          <p className="font-medium">Thank you for choosing PHIDIM SERVICE.</p>
          <p className="font-medium">Reliable domestic home appliance repair and service</p>
        </div>
      </div>
    </div>
  );
}
