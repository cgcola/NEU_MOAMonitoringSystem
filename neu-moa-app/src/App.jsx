import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import FacultyDashboard from './pages/FacultyDashboard'
import StudentDashboard from './pages/StudentDashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [canMaintain, setCanMaintain] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [isBlockedUI, setIsBlockedUI] = useState(false)
  const [blockMessage, setBlockMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session && !isBlockedUI) fetchUserProfile(session.user)
      else if (!session && !isBlockedUI) { setUserRole(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [isBlockedUI])

  // THE GLOBAL MASTER BOUNCER
  useEffect(() => {
    if (session?.user?.id) {
      const blockListener = supabase.channel('global-block-watch')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${session.user.id}` 
          }, async (payload) => {
          if (payload.new && payload.new.is_blocked === true) {
            setBlockMessage("Your account has been suspended by an Administrator while you were active.");
            setIsBlockedUI(true);
            await supabase.auth.signOut(); 
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(blockListener); }
    }
  }, [session])

  const fetchUserProfile = async (user) => {
    // Try to fetch the user's profile
    const { data, error } = await supabase
      .from('profiles')
      .select('role, can_maintain, is_blocked') 
      .eq('id', user.id)
      .single()

    // If it EXISTS, load them in!
    if (data) {
      if (data.is_blocked) {
        setBlockMessage("Your access to the NEU MOA Monitoring System has been revoked. Please contact an Administrator if you believe this is a mistake.");
        setIsBlockedUI(true);
        setLoading(false);
        await supabase.auth.signOut(); 
        return; 
      }
      setUserRole(data.role.toLowerCase())
      setCanMaintain(data.can_maintain || false)
      setLoading(false)
      return;
    }

    // If it DOES NOT EXIST (406 PGRST116 Error), Create it securely from the frontend!
    if (error && error.code === 'PGRST116') {
      console.log("No profile found. Creating a smart profile now...")
      
      // Check if Admin pre-approved them in pending_roles
      const { data: pendingData } = await supabase
        .from('pending_roles')
        .select('role, college')
        .eq('email', user.email)
        .single()

      let finalRole = 'student';
      let finalCollege = '';
      let finalMaintain = false;

      // Map the pending roles properly
      if (pendingData) {
        const pr = pendingData.role.toLowerCase();
        finalCollege = pendingData.college || '';
        
        if (pr === 'admin') { 
          finalRole = 'admin'; 
          finalMaintain = true; 
        } else if (pr.includes('faculty')) {
          finalRole = 'faculty';
          finalMaintain = pr.includes('maintainer');
        }
      }

      const newProfile = {
        id: user.id,
        email: user.email,
        role: finalRole,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        college: finalCollege,
        can_maintain: finalMaintain,
        is_blocked: false
      }

      // Insert the profile to the database
      const { error: insertError } = await supabase.from('profiles').insert([newProfile])
      
      if (insertError) {
        console.error("Error creating profile:", insertError)
      }

      // Set the UI state so they can enter the app immediately
      setUserRole(finalRole)
      setCanMaintain(finalMaintain)
      setLoading(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px', color: '#666', fontFamily: 'system-ui, sans-serif' }}>Loading Workspace...</div>
  
  if (isBlockedUI) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <div style={{ background: '#fff', padding: '48px 40px', borderRadius: '16px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', borderTop: '6px solid #dc3545', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ width: '80px', height: '80px', background: '#fce8e6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              <line x1="12" y1="15" x2="12" y2="18"></line>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>Access Denied</h1>
          <p style={{ color: '#555', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 32px 0' }}>{blockMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ width: '100%', padding: '14px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#e4e4e4'}
            onMouseOut={e => e.currentTarget.style.background = '#f0f0f0'}
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  if (!session) return <Login />

  if (userRole === 'admin') return <AdminDashboard />
  if (userRole === 'faculty') return <FacultyDashboard canMaintain={canMaintain} />
  
  return <StudentDashboard />
}