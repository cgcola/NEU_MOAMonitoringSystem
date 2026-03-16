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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchUserProfile(session.user)
      else { setUserRole(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  // --- NEW: THE GLOBAL MASTER BOUNCER (Real-Time Block Listener) ---
  useEffect(() => {
    if (session?.user?.id) {
      // This listener watches the logged-in user's exact row in the database globally
      const blockListener = supabase.channel('global-block-watch')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${session.user.id}` 
          }, async (payload) => {
            
          // If the admin clicks block, kick them out instantly from ANY screen
          if (payload.new && payload.new.is_blocked === true) {
            alert("Your account has been blocked by an Administrator.");
            await supabase.auth.signOut();
            window.location.reload(); 
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(blockListener); }
    }
  }, [session])

  const fetchUserProfile = async (user, retries = 3) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, can_maintain, is_blocked') // <-- We must fetch is_blocked here
      .eq('id', user.id)
      .single()

    if (error && error.code === 'PGRST116' && retries > 0) {
      console.log("Waiting for backend database trigger to finish...")
      setTimeout(() => fetchUserProfile(user, retries - 1), 500)
      return
    }

    if (data) {
      // --- NEW: Block them at the door if they try to log in while already blocked ---
      if (data.is_blocked) {
        alert("Your account is currently blocked. Please contact an Administrator.");
        await supabase.auth.signOut();
        window.location.reload();
        return; // Stop the code here so they never reach a dashboard
      }

      setUserRole(data.role.toLowerCase())
      setCanMaintain(data.can_maintain || false)
    } else {
      setUserRole('student')
      setCanMaintain(false)
    }

    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>
  if (!session) return <Login />

  if (userRole === 'admin') return <AdminDashboard />
  if (userRole === 'faculty') return <FacultyDashboard canMaintain={canMaintain} />
  
  return <StudentDashboard />
}