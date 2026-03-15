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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchUserProfile(session.user.id)
      else { setUserRole(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase.from('profiles').select('role, can_maintain').eq('id', userId).single()
    if (!error && data) {
      setUserRole(data.role.toLowerCase())
      setCanMaintain(data.can_maintain || false)
    }
    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>
  if (!session) return <Login />

  // Route to the correct dashboard based on role
  if (userRole === 'admin') return <AdminDashboard />
  if (userRole === 'faculty') return <FacultyDashboard canMaintain={canMaintain} />
  
  // Default fallback for students or unassigned roles
  return <StudentDashboard />
}