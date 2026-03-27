import { useState, useEffect } from 'react'
import AnimatedBackground from '../components/AnimatedBackground'
import { supabase } from '../supabaseClient'
import { NEU_COLLEGES, NEU_INDUSTRIES } from '../constants'
import { formatName } from '../utils/helpers'
import Header from '../components/Header'
import Toast from '../components/Toast'
import { IconLocation, IconUserGrey, IconMail, IconEye, IconBuildingBlue } from '../components/Icons'

export default function StudentDashboard() {
  const [moas, setMoas] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('') //Track the user's ID
  const [userName, setUserName] = useState('')
  const [userAvatar, setUserAvatar] = useState('')

  const [selectedMoa, setSelectedMoa] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCollege, setFilterCollege] = useState('ALL')
  const [filterIndustry, setFilterIndustry] = useState('ALL')

  const [toast, setToast] = useState(null)
  
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState('')
  
  const [currentPage, setCurrentPage] = useState(1)
  
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth <= 768 ? 4 : 8)

  useEffect(() => {
    const handleResize = () => {
      const newLimit = window.innerWidth <= 768 ? 4 : 8;
      if (newLimit !== itemsPerPage) {
        setItemsPerPage(newLimit);
        setCurrentPage(1); // Reset page on layout shift
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage]);

  useEffect(() => { 
    fetchApprovedMOAs(); 
    getUserData(); 

    const moaSubscription = supabase
      .channel('student-moas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moas' }, () => {
        fetchApprovedMOAs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(moaSubscription);
    };
  }, [])
  
  // REAL-TIME USER PROTECTION & ONBOARDING
  useEffect(() => {
    if (userEmail && userId) {
      checkMyProfile(); 

      // Listen for updates across the whole table, but only react if the ID matches THIS user
      const profileSub = supabase.channel('student-profile')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
          if (payload.new && payload.new.id === userId) {
            checkMyProfile();
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(profileSub); };
    }
  }, [userEmail, userId]) // <--- Added userId as a dependency

  // Added 'retries' so it patiently waits for the database trigger to finish!
  const checkMyProfile = async (retries = 5) => {
    const { data: myProfile } = await supabase.from('profiles').select('*').eq('email', userEmail).single();
    
    if (myProfile) {
      // TRUE BLOCKING: Eject user instantly
      if (myProfile.is_blocked) {
        await supabase.auth.signOut();
        window.location.reload(); // Throws them back to login page
        return;
      }
      // ONBOARDING: Show modal if college is missing
      if (!myProfile.college || myProfile.college.trim() === '') {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } else if (retries > 0) {
      // If the profile isn't there yet, wait half a second and check again!
      setTimeout(() => checkMyProfile(retries - 1), 500);
    }
  }

  const handleSaveCollege = async () => {
    if (!selectedCollege) return;
    const { error } = await supabase.from('profiles').update({ college: selectedCollege }).eq('email', userEmail);
    if (error) {
      showToast(error.message, 'error');
    } else {
      setShowOnboarding(false);
      showToast('Welcome aboard! College saved successfully.', 'success');
    }
  }

  useEffect(() => { setCurrentPage(1) }, [searchQuery, filterCollege, filterIndustry])

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000) }

  const getUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email)
      setUserId(user.id) // <--- NEW: Save the ID so the Real-Time listener can use it
      if (user.user_metadata) {
        setUserAvatar(user.user_metadata.avatar_url || user.user_metadata.picture || '')
        setUserName(formatName(user.user_metadata.full_name || user.user_metadata.name || ''))
      }
    }
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.reload(); }

  const fetchApprovedMOAs = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('moas').select('*').ilike('status', 'APPROVED%').is('deleted_at', null).order('created_at', { ascending: false })
    if (error) showToast("Failed to load MOAs.", "error")
    else setMoas(data || [])
    setLoading(false)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterCollege('ALL')
    setFilterIndustry('ALL')
  }

  const renderStudentBadge = () => (
    <span style={{ display: 'inline-block', background: '#e6f4ea', color: '#1e8e3e', border: '1px solid #cce8d6', padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap', maxWidth: '100%' }}>
      Approved
    </span>
  )

  const activeFilterCount = (searchQuery ? 1 : 0) + (filterCollege !== 'ALL' ? 1 : 0) + (filterIndustry !== 'ALL' ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0

  // FILTER MOAS
  const filteredMoas = moas.filter(m => {
    const searchLower = searchQuery.toLowerCase()
    return (filterCollege === 'ALL' || m.endorsed_by_college === filterCollege) &&
           (filterIndustry === 'ALL' || m.industry_type === filterIndustry) &&
           ((m.company_name?.toLowerCase().includes(searchLower)) || (m.contact_person?.toLowerCase().includes(searchLower)) || (m.address?.toLowerCase().includes(searchLower)))
  })

  // SLICE MOAS
  const currentMoas = filteredMoas.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(filteredMoas.length / itemsPerPage))

  const FormLabel = ({ text, required }) => <label style={{ fontSize: '0.85rem', color: '#333', fontWeight: '600', marginBottom: '8px', display: 'block' }}>{text} {required && <span style={{ color: '#dc3545' }}>*</span>}</label>
  const inputStyle = { padding: '14px', borderRadius: '8px', border: '1px solid #eaeaea', width: '100%', outline: 'none', backgroundColor: '#fff', fontSize: '0.95rem' }

  if (loading) return <p style={{ textAlign: 'center', padding: '50px' }}>Loading Student Workspace...</p>

  return (
    <div className="dashboard-container">
      <AnimatedBackground />
      <Header role="Student" userName={userName} userEmail={userEmail} userAvatar={userAvatar} handleSignOut={handleSignOut} />

      {/* --- ONBOARDING MODAL OVERLAY --- */}
      {showOnboarding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', maxWidth: '450px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease' }}>
            <h2 style={{ margin: '0 0 12px 0', color: '#00204a', fontSize: '1.5rem', fontWeight: '700' }}>Welcome to NEU MOA! 👋</h2>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>To complete your profile, please select your college from the list below.</p>
            
            <div style={{ marginBottom: '32px' }}>
              <FormLabel text="My College" required />
              {/* Added id and name below to fix the React warning */}
              <select id="college" name="college" value={selectedCollege} onChange={e => setSelectedCollege(e.target.value)} style={inputStyle}>
                <option value="" disabled hidden>Please choose a college...</option>
                {NEU_COLLEGES.filter(c => !c.includes('N/A')).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <button onClick={handleSaveCollege} disabled={!selectedCollege} style={{ width: '100%', padding: '14px', background: selectedCollege ? '#0d6efd' : '#ccc', color: '#fff', border: 'none', borderRadius: '8px', cursor: selectedCollege ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '1rem', transition: 'background 0.2s ease' }}>
              Save & Continue
            </button>
          </div>
        </div>
      )}

      {selectedMoa ? (
        <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#00204a', margin: '0 0 4px 0' }}>MOA Details</h1>
              <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>Memorandum of Agreement Information</p>
            </div>
            {renderStudentBadge()}
          </div>
          
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', borderBottom: '1px solid #f0f0f0', paddingBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', background: '#f0f7ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBuildingBlue />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: '0 0 4px 0', color: '#00204a', fontWeight: '700' }}>{selectedMoa.company_name}</h2>
                <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>HTE ID: {selectedMoa.hte_id}</p>
              </div>
            </div>

            <h4 style={{ color: '#999', letterSpacing: '1px', fontSize: '0.8rem', marginBottom: '24px', textTransform: 'uppercase', fontWeight: '700' }}>Contact Information</h4>
            <div className="form-grid">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconLocation /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Company Address</span></div>
                <p style={{ color: '#333', fontSize: '0.95rem', margin: '0 0 24px 24px' }}>{selectedMoa.address}</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconMail /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Contact Email</span></div>
                <p style={{ color: '#0d6efd', fontSize: '0.95rem', margin: '0 0 0 24px' }}>{selectedMoa.email_address}</p>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconUserGrey /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Contact Person</span></div>
                <p style={{ color: '#333', fontSize: '0.95rem', margin: '0 0 0 24px' }}>{selectedMoa.contact_person}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button onClick={() => setSelectedMoa(null)} style={{ padding: '12px 32px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Close</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#00204a', margin: '0 0 4px 0' }}>Student Dashboard</h1>
          <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: '0.95rem' }}>Browse approved MOA partnerships</p>

          <div style={{ background: '#f0f7ff', border: '1px solid #cce5ff', borderRadius: '8px', padding: '16px 20px', marginBottom: '32px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ color: '#0056b3', fontWeight: '700' }}>Note:</span>
            <span style={{ color: '#0056b3', fontSize: '0.95rem', lineHeight: '1.4' }}>You can view approved MOAs and company contact information. For internship inquiries, please reach out to the contact person listed.</span>
          </div>

          <div className="dashboard-card" style={{ padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: showFilters ? '20px' : '0' }}>
              
              {/* Search Bar */}
              <div style={{ flex: '1 1 250px', minWidth: '250px', position: 'relative' }}>
                <input type="text" className="search-bar" style={{ width: '100%', padding: '12px 12px 12px 44px', background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} placeholder="Search by company name, contact person, or address..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <svg style={{ position: 'absolute', left: '16px', top: '14px', color: '#999' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              
              {/* Filter Button - Uses CSS class for responsive stretching */}
              <button className="filter-btn-responsive" onClick={() => setShowFilters(!showFilters)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', background: '#f8f9fa', border: '1px solid #eaeaea', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#555' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> 
                <span className="desktop-only" style={{ marginLeft: '8px' }}>Filters</span>
                
                {hasActiveFilters && <span style={{ position: 'absolute', top: '-6px', right: '-4px', background: '#0d6efd', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #fff' }}>{activeFilterCount}</span>}
              </button>

            </div>
            
            {showFilters && (
              <div style={{ marginTop: '20px' }}>
                <div className="filter-grid" style={{ marginTop: 0 }}>
                  <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #eee', outline: 'none' }}>
                    <option value="ALL">All Colleges</option>
                    {NEU_COLLEGES.filter(c => !c.includes('N/A')).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #eee', outline: 'none' }}>
                    <option value="ALL">All Industries</option>
                    {NEU_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                {hasActiveFilters && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>✕ Clear Filters</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="student-moa-grid">
            {currentMoas.map((moa) => (
              <div key={moa.id} className="student-moa-card">
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', textAlign: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#e6f0fa', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconBuildingBlue />
                  </div>
                  <div style={{ width: '100%' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#111', margin: '0 0 12px 0', lineHeight: '1.3', fontWeight: '700' }}>{moa.company_name}</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      {renderStudentBadge()}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ marginTop: '2px', color: '#888' }}><IconLocation /></div>
                    <span style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>{moa.address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: '#888' }}><IconUserGrey /></div>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>{moa.contact_person}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: '#888' }}><IconMail /></div>
                    <span style={{ fontSize: '0.85rem', color: '#0d6efd' }}>{moa.email_address}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#999' }}>Industry</span>
                    <span style={{ color: '#333', fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{moa.industry_type?.split('/')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#999' }}>College</span>
                    <span style={{ color: '#333', fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{moa.endorsed_by_college?.replace('College of ', '')}</span>
                  </div>
                </div>

                <button onClick={() => setSelectedMoa(moa)} style={{ width: '100%', padding: '12px', background: '#fff', color: '#0d6efd', border: '1px solid #e6f0fa', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background 0.2s ease' }} onMouseOver={e => e.currentTarget.style.background = '#f0f7ff'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                  <IconEye /> View Details
                </button>
              </div>
            ))}
            {currentMoas.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#999' }}>No approved MOAs found.</div>}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', marginTop: '32px' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid', borderColor: currentPage === 1 ? '#e0e0e0' : 'var(--neu-blue)', background: currentPage === 1 ? '#f5f5f5' : 'transparent', color: currentPage === 1 ? '#999' : 'var(--neu-blue)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600' }}>Previous</button>
              <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: '500' }}>Page <strong style={{ color: '#0d6efd' }}>{currentPage}</strong> of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid', borderColor: currentPage === totalPages ? '#e0e0e0' : 'var(--neu-blue)', background: currentPage === totalPages ? '#f5f5f5' : 'transparent', color: currentPage === totalPages ? '#999' : 'var(--neu-blue)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '600' }}>Next</button>
            </div>
          )}
        </div>
      )}
      <Toast toast={toast} />
    </div>
  )
}