import Link from 'next/link';
import { FiArrowUpRight, FiCheck, FiFileText, FiGrid, FiZap } from 'react-icons/fi';
import Brand from './Brand';

export default function AuthShell({ children, register = false }) {
  return (
    <main className="auth-layout">
      <aside className="auth-story">
        <Link href="/" aria-label="Phidim Service Bill home"><Brand light /></Link>
        <div className="auth-story-content">
          <span className="story-eyebrow"><FiZap aria-hidden="true" /> A little simpler. A lot more organized.</span>
          <h2>Your bills.<br />Your business.<br /><span>All together.</span></h2>
          <p>A brighter way to keep track of your service bills. Less searching, more time for what matters.</p>
          <div className="bill-illustration" aria-hidden="true">
            <div className="illustration-top"><span className="illustration-icon"><FiFileText /></span><span>Everything in one place<small>YOUR BILLING WORKSPACE</small></span><FiArrowUpRight /></div>
            <div className="illustration-lines"><i /><i /><i /></div>
            <div className="illustration-bottom"><span><span className="mini-dot" /> Clear. Simple. Organized.</span><span className="illustration-check"><FiCheck /></span></div>
            <span className="floating-note"><FiGrid /> Made for your everyday</span>
          </div>
          <div className="story-features"><span><FiCheck /> Easy to use</span><span><FiCheck /> One workspace</span></div>
        </div>
        <p className="auth-copyright">© {new Date().getFullYear()} Phidim Service Bill</p>
      </aside>
      <section className="auth-main">
        <div className="auth-topline"><Link href="/" className="mobile-brand"><Brand /></Link><span>{register ? 'Already part of Phidim?' : 'New around here?'} <Link href={register ? '/' : '/register'}>{register ? 'Sign in' : 'Create an account'} <FiArrowUpRight aria-hidden="true" /></Link></span></div>
        <div className="auth-card">{children}</div>
        <p className="auth-footnote">A little order for your everyday business.</p>
      </section>
    </main>
  );
}
