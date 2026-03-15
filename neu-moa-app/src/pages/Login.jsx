import { useState } from 'react';
import { supabase } from '../supabaseClient';
import AnimatedBackground from '../components/AnimatedBackground';
import neuLogo from '../assets/neu-logo.png';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: { prompt: 'select_account' }
        }
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      
      {/* We use the single, reusable background component here! 
        This is the exact same one used in all the dashboards.
      */}
      <AnimatedBackground />

      {/* Main Login Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        padding: '56px 48px',
        borderRadius: '28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
        border: '1px solid rgba(255,255,255,0.4)',
        width: '100%',
        maxWidth: '440px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        animation: 'fadeIn 0.6s ease-out'
      }}>
        
        {/* Logo & Header Section */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ 
            width: '88px', 
            height: '88px', 
            margin: '0 auto 28px auto', 
            background: '#ffffff', 
            borderRadius: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 10px 25px -5px rgba(0, 32, 74, 0.1), inset 0 2px 4px rgba(255,255,255,1)',
            border: '1px solid #f1f5f9'
          }}>
            <img src={neuLogo} alt="NEU Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
          </div>
          
          <h1 style={{ 
            fontSize: '1.85rem', 
            color: '#0f172a', 
            fontWeight: '800', 
            margin: '0 0 10px 0',
            letterSpacing: '-0.03em'
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '0.95rem', 
            margin: 0,
            lineHeight: '1.6'
          }}>
            Sign in to access the NEU Memorandum of Agreement Monitoring System.
          </p>
        </div>

        {/* Error Message Display */}
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            color: '#dc2626', 
            padding: '14px', 
            borderRadius: '12px', 
            fontSize: '0.85rem', 
            marginBottom: '28px',
            border: '1px solid #fecaca',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        {/* Custom Google Sign-In Button */}
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            fontSize: '1.05rem',
            fontWeight: '600',
            color: '#1e293b',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            opacity: loading ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(15, 23, 42, 0.08)';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.04)';
            }
          }}
          onMouseDown={(e) => {
             if (!loading) e.currentTarget.style.transform = 'translateY(1px)';
          }}
          onMouseUp={(e) => {
             if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
        >
          {loading ? (
            <span style={{ color: '#64748b' }}>Connecting securely...</span>
          ) : (
            <>
              {/* Official Google 'G' Logo SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {/* Security / Help Note */}
        <p style={{ 
          marginTop: '36px', 
          fontSize: '0.8rem', 
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontWeight: '500'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Secure login via Institutional Account
        </p>

      </div>
    </div>
  );
}