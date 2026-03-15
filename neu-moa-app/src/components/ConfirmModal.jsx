import { IconTrash, IconRestore } from './Icons';

export default function ConfirmModal({ dialog, onCancel }) {
  if (!dialog) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', animation: 'modalBackdrop 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', animation: 'modalPop 0.2s ease' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: dialog.actionColor === '#dc3545' ? '#fce8e6' : '#e6f4ea', color: dialog.actionColor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
          {dialog.actionColor === '#dc3545' ? <IconTrash /> : <IconRestore />}
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#00204a', marginBottom: '12px' }}>{dialog.title}</h3>
        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '32px', lineHeight: '1.5' }}>{dialog.message}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', background: '#f8f9fa', color: '#555', border: '1px solid #eee', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
          <button onClick={dialog.onConfirm} style={{ flex: 1, padding: '12px', background: dialog.actionColor, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{dialog.actionText}</button>
        </div>
      </div>
    </div>
  );
}