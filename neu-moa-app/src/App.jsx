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

  const fetchUserProfile = async (user) => {
    // Try to find the user in the database
    const { data, error } = await supabase
      .from('profiles')
      .select('role, can_maintain')
      .eq('id', user.id)
      .single()

    // If they DON'T exist (PGRST116 means "No rows found"), create them!
    if (error && error.code === 'PGRST116') {
      console.log("No profile found. Creating a new one...")
      const newProfile = {
        id: user.id,
        email: user.email,
        role: 'student', // Default role
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        can_maintain: false,
        is_blocked: false
      }

      const { error: insertError } = await supabase.from('profiles').insert([newProfile])
      
      if (insertError) {
        console.error("Failed to create profile:", insertError.message)
      } else {
        setUserRole('student')
        setCanMaintain(false)
      }
    } 
    // If they DO exist, set their role
    else if (!error && data) {
      setUserRole(data.role.toLowerCase())
      setCanMaintain(data.can_maintain || false)
    }

    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>
  if (!session) return <Login />

  if (userRole === 'admin') return <AdminDashboard />
  if (userRole === 'faculty') return <FacultyDashboard canMaintain={canMaintain} />
  
  return <StudentDashboard />
}