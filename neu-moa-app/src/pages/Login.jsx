import { supabase } from '../supabaseClient'
import neuLogo from '../assets/neu-logo.png'

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) console.error('Error logging in:', error.message)
  }

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
      <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
      <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03296C-0.371021 20.0112 -0.371021 28.0009 3.03296 34.7825L11.0051 28.6006Z" fill="#FBBC05"/>
      <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24515C36.2058 2.18688 30.4214 -0.0689238 24.48 0.00161733C15.4056 0.00161733 7.10718 5.11644 3.03296 13.2296L11.0051 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
    </svg>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', padding: '48px 40px', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
        <img src={neuLogo} alt="NEU Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '24px' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00204a', marginBottom: '8px', letterSpacing: '-0.5px' }}>NEU Memorandum of Agreement</h1>
        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '40px', fontWeight: '500' }}>Tracking System</p>
        <button onClick={handleGoogleLogin} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '14px', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', color: '#333', transition: 'background 0.2s ease' }} onMouseOver={e => e.currentTarget.style.background = '#f8f9fa'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <GoogleIcon /> Sign in with Google
        </button>
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #eee', color: '#888', fontSize: '0.8rem', lineHeight: '1.5' }}>
          Please ensure you log in using your authorized institutional email account.
        </div>
      </div>
    </div>
  )
}