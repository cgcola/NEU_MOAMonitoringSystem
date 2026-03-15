import { IconCheckCircle, IconAlertCircle } from './Icons';

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)', background: '#fff', borderLeft: `4px solid ${toast.type === 'success' ? '#198754' : '#dc3545'}`, borderRadius: '8px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 9999, animation: 'slideDown 0.3s ease' }}>
      <div style={{ color: toast.type === 'success' ? '#198754' : '#dc3545' }}>
        {toast.type === 'success' ? <IconCheckCircle /> : <IconAlertCircle />}
      </div>
      <span style={{ fontWeight: '600', color: '#333', fontSize: '0.95rem' }}>{toast.message}</span>
    </div>
  );
}