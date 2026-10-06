import { FiAlertCircle, FiFileText, FiInbox, FiLoader } from 'react-icons/fi';

export function StatCard({ label, value, detail, icon: Icon = FiFileText, tone = 'violet' }) {
  return <div className={`stat-card tone-${tone}`}><div className="stat-top"><span className="stat-icon"><Icon aria-hidden="true" /></span><span className="stat-label">{label}</span></div><p className="stat-value">{value}</p><p className="stat-detail">{detail}</p></div>;
}

export function LoadingScreen() {
  return <div className="loading-screen" role="status"><span className="loading-symbol"><FiLoader aria-hidden="true" /></span><h1>Getting things ready</h1><p>Opening your Phidim workspace…</p></div>;
}

function StatusBadge({ status }) {
  const value = String(status).toLowerCase();
  const tone = ['paid', 'completed', 'settled'].includes(value) ? 'green' : ['pending', 'unpaid', 'due'].includes(value) ? 'amber' : ['overdue', 'cancelled', 'canceled'].includes(value) ? 'rose' : 'violet';
  return <span className={`status-badge tone-${tone}`}><i aria-hidden="true" />{status}</span>;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function BillsTable({ bills, loading, error, filtered = false, descriptions = false }) {
  if (loading || error || !bills.length) {
    const Icon = loading ? FiLoader : error ? FiAlertCircle : FiInbox;
    return <div className={`table-empty ${error ? 'table-error' : ''}`} role={error ? 'alert' : 'status'}><span className="empty-icon"><Icon aria-hidden="true" /></span><h3>{loading ? 'Gathering your bills' : error ? 'We couldn’t load your bills' : filtered ? 'No matching bills' : 'A fresh start for your bills'}</h3><p>{loading ? 'Your workspace will be ready in a moment.' : error || (filtered ? 'Try another customer, bill number, or status.' : 'Your service bills will appear here when they’re available.')}</p></div>;
  }
  return <div className="table-scroll"><table className="bills-table"><caption className="sr-only">Service bills with customer, date, status, and amount</caption><thead><tr><th>Bill number</th><th>Customer</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead><tbody>{bills.map((bill) => <tr key={bill.id}><td><span className="bill-reference"><FiFileText aria-hidden="true" />{bill.billNo}</span></td><td><span className="customer-name">{bill.customer}</span>{descriptions && bill.description && <small className="bill-description">{bill.description}</small>}</td><td>{formatDate(bill.date)}</td><td><StatusBadge status={bill.status} /></td><td className="bill-amount">Rs {bill.amount.toLocaleString()}</td></tr>)}</tbody></table></div>;
}
