import { useState } from 'react';
import neuLogo from '../assets/neu-logo.png';

export default function Header({ role, userName, userEmail, userAvatar, handleSignOut }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false); // FIXED: Added state for custom modal

  const roleStyles = {
    Admin: { bg: '#f3e8ff', text: '#9333ea' },
    Faculty: { bg: '#e6f0fa', text: '#1976d2' },
    Student: { bg: '#e6f4ea', text: '#1e8e3e' }
  };
  const theme = roleStyles[role] || roleStyles.Student;

  const renderAvatar = (size) => {
    if (userAvatar) {
      return <img src={userAvatar} alt="Profile" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} referrerPolicy="no-referrer" />;
    }
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#0d6efd', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size === '40px' ? '1.2rem' : '1.4rem', flexShrink: 0 }}>
        {(userName || userEmail || 'U').charAt(0).toUpperCase()}
      </div>
    );
  };

  const triggerSignOut = () => {
    setIsMenuOpen(false); // Close the dropdown menu
    setShowSignOutConfirm(true); // Open the custom modal
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderBottom: '1px solid #eee', marginBottom: '32px', position: 'relative', zIndex: 50 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={neuLogo} alt="NEU Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <div className="desktop-only">
            <h2 style={{ fontSize: '1.15rem', color: '#003366', margin: 0, fontWeight: '700' }}>NEU Memorandum of Agreement</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0, fontWeight: '500' }}>Monitoring System</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="desktop-only-flex" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ padding: '4px 12px', background: theme.bg, color: theme.text, borderRadius: '16px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
              {role}
            </span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#333' }}>{userName || userEmail.split('@')[0]}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>{userEmail}</div>
            </div>
            {renderAvatar('40px')}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: '#f8f9fa', border: '1px solid #eee', borderRadius: '8px', padding: '10px', cursor: 'pointer', display: 'flex', marginLeft: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          {isMenuOpen && (
            <div style={{ position: 'absolute', top: '75px', right: '0', background: '#fff', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '260px', padding: '16px', zIndex: 100 }}>
              
              <div className="mobile-only">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {renderAvatar('48px')}
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontWeight: '700', fontSize: '1rem', color: '#333', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName || userEmail.split('@')[0]}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</p>
                  </div>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', background: theme.bg, color: theme.text, borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '12px' }}>{role}</span>
                <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '12px' }} />
              </div>
              
              <button onClick={triggerSignOut} style={{ background: 'transparent', border: 'none', color: '#dc3545', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', width: '100%', padding: '8px 8px', borderRadius: '6px', transition: 'background 0.2s ease' }} onMouseOver={e => e.currentTarget.style.background = '#fdf5f5'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> 
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FIXED: Custom Sign Out Confirmation Modal to match the Delete UI perfectly */}
      {showSignOutConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '32px 24px', borderRadius: '16px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            
            {/* Soft Red Circular Icon Container */}
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fce8e6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>

            <h3 style={{ marginTop: 0, color: '#00204a', fontSize: '1.4rem', fontWeight: '700', marginBottom: '12px' }}>Sign Out</h3>
            
            <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '32px', lineHeight: '1.5' }}>
              Are you sure you want to sign out? You will need to sign in again to access the dashboard.
            </p>
            
            {/* Equal Width Side-by-Side Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowSignOutConfirm(false)} style={{ flex: 1, padding: '12px 0', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#444', fontSize: '0.95rem' }}>
                Cancel
              </button>
              <button onClick={handleSignOut} style={{ flex: 1, padding: '12px 0', background: '#dc3545', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>
                Sign Out
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}