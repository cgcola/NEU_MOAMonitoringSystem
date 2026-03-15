import { useState } from 'react';
import neuLogo from '../assets/neu-logo.png';
// Ensure you have an IconSignOut or similar imported, or use a raw SVG below
import { IconSignOut } from './Icons'; 

export default function Header({ role, userName, userEmail, userAvatar, handleSignOut }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const roleStyles = {
    Admin: { bg: '#f3e8ff', text: '#9333ea' },
    Faculty: { bg: '#e6f0fa', text: '#1976d2' },
    Student: { bg: '#e6f4ea', text: '#1e8e3e' }
  };
  const theme = roleStyles[role] || roleStyles.Student;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderBottom: '1px solid #eee', marginBottom: '32px', position: 'relative', zIndex: 50 }}>
      
      {/* Left Side: Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img src={neuLogo} alt="NEU Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
        <div className="desktop-only">
          <h2 style={{ fontSize: '1.15rem', color: '#003366', margin: 0, fontWeight: '700' }}>NEU Memorandum of Agreement</h2>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0, fontWeight: '500' }}>Tracking System</p>
        </div>
      </div>
      
      {/* Right Side: Profile & Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="desktop-only-flex" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ padding: '4px 12px', background: theme.bg, color: theme.text, borderRadius: '16px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
            {role}
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#333' }}>{userName || userEmail.split('@')[0]}</div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>{userEmail}</div>
          </div>
        </div>

        {/* FIXED: Avatar moved outside desktop-only container so it shows on mobile */}
        {userAvatar ? (
          <img src={userAvatar} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} referrerPolicy="no-referrer" />
        ) : (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0d6efd', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
            {(userName || userEmail || 'U').charAt(0).toUpperCase()}
          </div>
        )}

        {/* Mobile Dropdown Toggle */}
        <button className="mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: '#f8f9fa', border: '1px solid #eee', borderRadius: '8px', padding: '10px', cursor: 'pointer', display: 'flex' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div style={{ position: 'absolute', top: '70px', right: '0', background: '#fff', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '220px', padding: '16px', zIndex: 100 }}>
            <div className="mobile-only">
              <p style={{ fontWeight: '700', fontSize: '1.05rem', color: '#333', marginBottom: '4px' }}>{userName || userEmail.split('@')[0]}</p>
              <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '12px', wordBreak: 'break-all' }}>{userEmail}</p>
              <span style={{ display: 'inline-block', padding: '4px 12px', background: theme.bg, color: theme.text, borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '12px' }}>{role}</span>
              <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '12px' }} />
            </div>
            <button onClick={handleSignOut} style={{ background: 'transparent', border: 'none', color: '#dc3545', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', width: '100%' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> 
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}