import { FiLayers } from 'react-icons/fi';

export default function Brand({ light = false }) {
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark"><FiLayers aria-hidden="true" /></span>
      <span><strong>Phidim<span className="brand-dot">.</span></strong><small>SERVICE BILL</small></span>
    </span>
  );
}
