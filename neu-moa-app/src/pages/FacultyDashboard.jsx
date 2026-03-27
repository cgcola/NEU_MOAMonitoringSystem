import { useState, useEffect } from 'react'
import AnimatedBackground from '../components/AnimatedBackground'
import { supabase } from '../supabaseClient'
import { NEU_COLLEGES, NEU_INDUSTRIES } from '../constants'
import { formatName, renderBadge } from '../utils/helpers'
import Header from '../components/Header'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import { IconCheckCircle, IconClock, IconXCircle, IconAlertCircle, IconEye, IconEdit, IconTrash, IconCalendar, IconBuildingBlue, IconLocation, IconUserGrey, IconMail, IconDocGrey, IconBuildingGrey } from '../components/Icons'

export default function FacultyDashboard({ canMaintain }) {
  const [moas, setMoas] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userAvatar, setUserAvatar] = useState('')

  // ONBOARDING Modal States
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState('')

  const [currentView, setCurrentView] = useState('list')
  const [selectedMoa, setSelectedMoa] = useState(null)
  
  const [toast, setToast] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCollege, setFilterCollege] = useState('ALL')
  const [filterIndustry, setFilterIndustry] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  const [moaSortConfig, setMoaSortConfig] = useState({ key: 'hte_id', direction: 'desc' })

  const [currentPage, setCurrentPage] = useState(1)
  
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth <= 768 ? 4 : 8)

  useEffect(() => {
    const handleResize = () => {
      const newLimit = window.innerWidth <= 768 ? 4 : 8;
      if (newLimit !== itemsPerPage) {
        setItemsPerPage(newLimit);
        setCurrentPage(1);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage]);

  const [formData, setFormData] = useState({ hte_id: '', company_name: '', address: '', contact_person: '', email_address: '', industry_type: '', status: '', endorsed_by_college: '', effective_date: '', expiration_date: '' })

  useEffect(() => { 
    fetchMOAs(); 
    getUserData(); 

    const facultyChannel = supabase
      .channel('faculty-moas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moas' }, () => {
        fetchMOAs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(facultyChannel);
    };
  }, [])

  useEffect(() => { setCurrentPage(1) }, [searchQuery, filterCollege, filterIndustry, filterStatus, dateFrom, dateTo])

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000) }

  const getUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email)
      if (user.user_metadata) {
        setUserAvatar(user.user_metadata.avatar_url || user.user_metadata.picture || '')
        setUserName(formatName(user.user_metadata.full_name || user.user_metadata.name || ''))
      }
      
      // Check if they are missing a college ---
      const { data: myProfile } = await supabase.from('profiles').select('college').eq('id', user.id).single();
      if (myProfile && (!myProfile.college || myProfile.college.trim() === '')) {
        setShowOnboarding(true);
      }
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

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.reload(); }

  const fetchMOAs = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('moas').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (!error && data) {
      const today = new Date(); today.setHours(0, 0, 0, 0); 
      const twoMonthsFromNow = new Date(today); twoMonthsFromNow.setMonth(today.getMonth() + 2);

      const processedMoas = data.map(moa => {
        let updatedMoa = { ...moa }; let dbNeedsUpdate = false;
        if (updatedMoa.status.includes('Processing') && (updatedMoa.effective_date || updatedMoa.expiration_date)) {
          updatedMoa.effective_date = null; updatedMoa.expiration_date = null; dbNeedsUpdate = true;
        }
        if (!updatedMoa.status.includes('Processing') && updatedMoa.expiration_date) {
          const expDate = new Date(updatedMoa.expiration_date); expDate.setHours(0, 0, 0, 0);
          let newStatusDB = updatedMoa.status;
          if (expDate < today && !updatedMoa.status.includes('Expired')) newStatusDB = 'Expired - No renewal done';
          else if (expDate >= today && expDate <= twoMonthsFromNow && !updatedMoa.status.includes('Expiring') && !updatedMoa.status.includes('Expired')) newStatusDB = 'Expiring - Two months before';
          if (newStatusDB !== updatedMoa.status) { updatedMoa.status = newStatusDB; dbNeedsUpdate = true; }
        }
        if (dbNeedsUpdate && canMaintain) {
          supabase.from('moas').update({ status: updatedMoa.status, effective_date: updatedMoa.effective_date, expiration_date: updatedMoa.expiration_date }).eq('id', updatedMoa.id).then();
        }
        return updatedMoa;
      });
      setMoas(processedMoas)
    } else setMoas([])
    setLoading(false)
  }

  const clearFilters = () => { setSearchQuery(''); setFilterCollege('ALL'); setFilterIndustry('ALL'); setFilterStatus('ALL'); setDateFrom(''); setDateTo(''); }
  const handleSortMoas = (key) => setMoaSortConfig({ key, direction: moaSortConfig.key === key && moaSortConfig.direction === 'asc' ? 'desc' : 'asc' });

  const activeFilterCount = (searchQuery ? 1 : 0) + (filterCollege !== 'ALL' ? 1 : 0) + (filterIndustry !== 'ALL' ? 1 : 0) + (filterStatus !== 'ALL' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0

  // FILTER MOAS
  const filteredMoas = moas.filter(m => {
    let matchesDateRange = true;
    if (dateFrom && m.effective_date) matchesDateRange = matchesDateRange && new Date(m.effective_date) >= new Date(dateFrom)
    if (dateTo && m.effective_date) matchesDateRange = matchesDateRange && new Date(m.effective_date) <= new Date(dateTo)
    const searchLower = searchQuery.toLowerCase()
    return (filterCollege === 'ALL' || m.endorsed_by_college === filterCollege) &&
           (filterIndustry === 'ALL' || m.industry_type === filterIndustry) &&
           (filterStatus === 'ALL' || m.status.toUpperCase().startsWith(filterStatus.toUpperCase())) &&
           matchesDateRange && 
           ((m.company_name?.toLowerCase().includes(searchLower)) || (m.hte_id?.toLowerCase().includes(searchLower)) || (m.contact_person?.toLowerCase().includes(searchLower)) || (m.address?.toLowerCase().includes(searchLower)))
  })

  // SORT MOAS
  const sortedMoas = [...filteredMoas].sort((a, b) => {
    let aVal = a[moaSortConfig.key]; let bVal = b[moaSortConfig.key];
    if (moaSortConfig.key === 'expiration_date') { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0; } 
    else { aVal = aVal ? aVal.toString().toLowerCase() : ''; bVal = bVal ? bVal.toString().toLowerCase() : ''; }
    if (aVal < bVal) return moaSortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return moaSortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // SLICE
  const currentMoas = sortedMoas.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(sortedMoas.length / itemsPerPage))

  const stats = {
    approved: moas.filter(m => m.status?.toUpperCase().includes('APPROVED')).length,
    processing: moas.filter(m => m.status?.toUpperCase().includes('PROCESSING')).length,
    expired: moas.filter(m => m.status?.toUpperCase().includes('EXPIRED') && !m.status?.toUpperCase().includes('EXPIRING')).length,
    expiring: moas.filter(m => m.status?.toUpperCase().includes('EXPIRING')).length,
  }

  const handleAddNew = async () => {
    const currentYear = new Date().getFullYear()
    const { data } = await supabase.from('moas').select('hte_id').ilike('hte_id', `HTE-${currentYear}-%`).order('hte_id', { ascending: false }).limit(1)
    let nextNumber = 1; if (data && data.length > 0 && data[0].hte_id) nextNumber = parseInt(data[0].hte_id.split('-')[2], 10) + 1;
    setFormData({ hte_id: `HTE-${currentYear}-${nextNumber.toString().padStart(3, '0')}`, company_name: '', address: '', contact_person: '', email_address: '', industry_type: '', status: '', endorsed_by_college: '', effective_date: '', expiration_date: '' })
    setSelectedMoa(null); setCurrentView('form');
  }

  const handleEdit = (moa) => { 
    let formStatus = moa.status || '';

    if (formStatus.includes('Awaiting')) formStatus = 'Processing - Awaiting signature by HTE partner';
    else if (formStatus.includes('Legal')) formStatus = 'Processing - Sent to Legal Office';
    else if (formStatus.includes('VPAA')) formStatus = 'Processing - Sent to VPAA/OP for approval';
    else if (formStatus.includes('Signed')) formStatus = 'Approved - Signed by President';
    else if (formStatus.includes('On-going')) formStatus = 'Approved - On-going notarization';
    else if (formStatus.includes('No notarization')) formStatus = 'Approved - No notarization needed';
    else if (formStatus.includes('Expired')) formStatus = 'Expired - No renewal done';
    else if (formStatus.includes('Expiring')) formStatus = 'Expiring - Two months before';

    const formattedEffective = moa.effective_date ? moa.effective_date.split('T')[0] : '';
    const formattedExpiration = moa.expiration_date ? moa.expiration_date.split('T')[0] : '';

    setFormData({ 
      ...moa, 
      status: formStatus,
      effective_date: formattedEffective,
      expiration_date: formattedExpiration
    }); 
    setSelectedMoa(moa); 
    setCurrentView('form') 
  }

  const handleView = (moa) => { setSelectedMoa(moa); setCurrentView('details') }

  const handleSubmit = async (e) => {
    e.preventDefault(); if (!canMaintain) return showToast("You do not have permission to do this.", "error")
    let dbStatus = formData.status.replace(' - ', ': '); 
    const submitData = { ...formData, status: dbStatus }
    
    if (dbStatus.includes('Processing')) { submitData.effective_date = null; submitData.expiration_date = null; }
    
    if (selectedMoa) {
      const { error } = await supabase.from('moas').update(submitData).eq('id', selectedMoa.id)
      if (!error) { showToast('MOA Updated Successfully!', 'success'); fetchMOAs(); setCurrentView('list') } else { showToast(error.message, 'error') }
    } else {
      const { error } = await supabase.from('moas').insert([submitData])
      if (!error) { showToast('MOA Created Successfully!', 'success'); fetchMOAs(); setCurrentView('list') } else { showToast(error.message, 'error') }
    }
  }

  const handleDelete = (id) => {
    if (!canMaintain) return
    setConfirmDialog({
      title: 'Delete Record', message: 'Are you sure you want to move this record to the trash?', actionText: 'Delete', actionColor: '#dc3545',
      onConfirm: async () => {
        setConfirmDialog(null); const { error } = await supabase.from('moas').update({ deleted_at: new Date().toISOString() }).eq('id', id)
        if (!error) { showToast('Record deleted successfully.', 'success'); fetchMOAs(); } else { showToast(error.message, 'error'); }
      }
    })
  }

  const SortableHeader = ({ label, sortKey, currentSort, onSort, style }) => {
    const isSorted = currentSort.key === sortKey;
    return <th onClick={() => onSort(sortKey)} style={{ cursor: 'pointer', userSelect: 'none', ...style }}>{label} <span style={{ opacity: isSorted ? 1 : 0.2 }}>{isSorted ? (currentSort.direction === 'asc' ? '↑' : '↓') : '↕'}</span></th>
  }

  const FormLabel = ({ text, required }) => <label style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#333', display: 'block' }}>{text} {required && <span style={{ color: '#dc3545' }}>*</span>}</label>
  const inputStyle = { padding: '14px', borderRadius: '8px', border: '1px solid #eaeaea', width: '100%', outline: 'none', fontSize: '0.95rem' }

  if (loading) return <p style={{ textAlign: 'center', padding: '50px' }}>Loading Faculty Workspace...</p>

  return (
    <div className="dashboard-container">
      <AnimatedBackground />
      <Header role="Faculty" userName={userName} userEmail={userEmail} userAvatar={userAvatar} handleSignOut={handleSignOut} />

      {/* --- ONBOARDING MODAL OVERLAY --- */}
      {showOnboarding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', maxWidth: '450px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease' }}>
            <h2 style={{ margin: '0 0 12px 0', color: '#00204a', fontSize: '1.5rem', fontWeight: '700' }}>Welcome to NEU MOA! 👋</h2>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>To complete your profile, please select your college from the list below.</p>
            
            <div style={{ marginBottom: '32px' }}>
              <FormLabel text="My College" required />
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

      {currentView === 'list' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="desktop-only"><h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: '#00204a' }}>Faculty Dashboard</h1><p style={{ color: '#666', marginBottom: '32px' }}>View and manage MOA records</p></div>
          
          {!canMaintain && (
            <div className="info-banner" style={{ background: '#fff3cd', borderColor: '#ffeeba', color: '#856404', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <strong>View-Only Mode:</strong> You currently have read-only access. To add, edit, or delete records, please request Maintainer Rights from a System Administrator.
            </div>
          )}

          <div className="stats-grid">
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><div style={{ background: '#e6f4ea', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}><IconCheckCircle /></div><h2 style={{ fontSize: '2.5rem', color: '#333', margin: '0 0 8px 0', lineHeight: '1', fontWeight: '700' }}>{stats.approved}</h2><p style={{ color: '#888', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Approved MOAs</p></div>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><div style={{ background: '#e6f0fa', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}><IconClock /></div><h2 style={{ fontSize: '2.5rem', color: '#333', margin: '0 0 8px 0', lineHeight: '1', fontWeight: '700' }}>{stats.processing}</h2><p style={{ color: '#888', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Processing</p></div>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><div style={{ background: '#fce8e6', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}><IconXCircle /></div><h2 style={{ fontSize: '2.5rem', color: '#333', margin: '0 0 8px 0', lineHeight: '1', fontWeight: '700' }}>{stats.expired}</h2><p style={{ color: '#888', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Expired</p></div>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><div style={{ background: '#fff3cd', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}><IconAlertCircle /></div><h2 style={{ fontSize: '2.5rem', color: '#333', margin: '0 0 8px 0', lineHeight: '1', fontWeight: '700' }}>{stats.expiring}</h2><p style={{ color: '#888', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Expiring Soon</p></div>
          </div>

          {canMaintain && (
            <div style={{ marginBottom: '24px' }}>
              <button onClick={handleAddNew} style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>+</span> Add New MOA
              </button>
            </div>
          )}

          <div className="dashboard-card" style={{ padding: '20px', overflow: 'visible' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: showFilters ? '20px' : '0' }}>
              
              {/* Search Bar */}
              <div style={{ flex: '1 1 250px', minWidth: '250px', position: 'relative' }}>
                <input type="text" className="search-bar" style={{ width: '100%', padding: '12px 12px 12px 44px', background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} placeholder="Search by company name, contact person, or address..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <svg style={{ position: 'absolute', left: '16px', top: '14px', color: '#999' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              
              {/* Filter Button */}
              <button className="filter-btn-responsive" onClick={() => setShowFilters(!showFilters)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', background: '#f8f9fa', border: '1px solid #eaeaea', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#555' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> 
                <span className="desktop-only" style={{ marginLeft: '8px' }}>Filters</span>
                {hasActiveFilters && <span style={{ position: 'absolute', top: '-6px', right: '-4px', background: '#0d6efd', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #fff' }}>{activeFilterCount}</span>}
              </button>

            </div>

            {showFilters && (
              <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee', animation: 'slideDown 0.2s ease' }}>
                <div className="filter-grid" style={{ marginTop: 0 }}>
                  <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#fff' }}>
                    <option value="ALL">All Colleges</option>
                    {NEU_COLLEGES.filter(c => canMaintain ? true : !c.includes('N/A')).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#fff' }}><option value="ALL">All Industries</option>{NEU_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#fff' }}><option value="ALL">All Status</option><option value="APPROVED">Approved</option><option value="PROCESSING">Processing</option><option value="EXPIRED">Expired</option><option value="EXPIRING">Expiring</option></select>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Effective From</span>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#fff', color: dateFrom ? '#333' : '#aaa', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Effective To</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#fff', color: dateTo ? '#333' : '#aaa', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eaeaea' }}>
                    <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>✕ Clear Filters</button>
                  </div>
                )}
              </div>
            )}

            <div className="table-container desktop-only" style={{ marginTop: '24px' }}>
              <table className="modern-table">
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                    <SortableHeader label="HTE ID" sortKey="hte_id" currentSort={moaSortConfig} onSort={handleSortMoas} style={{ padding: '16px 24px', verticalAlign: 'middle' }} />
                    <SortableHeader label="COMPANY" sortKey="company_name" currentSort={moaSortConfig} onSort={handleSortMoas} style={{ padding: '16px 24px', verticalAlign: 'middle' }} />
                    <th style={{ padding: '16px 24px', verticalAlign: 'middle' }}>INDUSTRY</th>
                    <th style={{ padding: '16px 24px', verticalAlign: 'middle' }}>COLLEGE</th>
                    <th style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'center' }}>STATUS</th>
                    <SortableHeader label="EXPIRATION" sortKey="expiration_date" currentSort={moaSortConfig} onSort={handleSortMoas} style={{ padding: '16px 24px', verticalAlign: 'middle' }} />
                    <th style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMoas.map(moa => (
                    <tr key={moa.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: '700', color: '#333', verticalAlign: 'middle', width: '130px' }}>{moa.hte_id}</td>
                      <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}><div style={{ fontWeight: '600', color: '#00204a', fontSize: '0.9rem', marginBottom: '4px' }}>{moa.company_name}</div><div style={{ fontSize: '0.8rem', color: '#888' }}>{moa.contact_person}</div></td>
                      <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#555', verticalAlign: 'middle' }}>{moa.industry_type?.split('/')[0]}</td>
                      <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#555', verticalAlign: 'middle' }}>{moa.endorsed_by_college?.replace('College of ', '')}</td>
                      <td style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'center' }}>{renderBadge(moa.status)}</td>
                      <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#555', verticalAlign: 'middle' }}>
                        {(!moa.status.includes('Processing') && moa.expiration_date) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconCalendar /> {new Date(moa.expiration_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
                          <button onClick={() => handleView(moa)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d6efd' }} title="View Details"><IconEye /></button>
                          {canMaintain && (
                            <>
                              <button onClick={() => handleEdit(moa)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#198754' }} title="Edit"><IconEdit /></button>
                              <button onClick={() => handleDelete(moa.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }} title="Delete"><IconTrash /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedMoas.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No records found.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              {currentMoas.map(moa => (
                <div key={moa.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', color: '#00204a', fontWeight: '700', lineHeight: '1.3' }}>{moa.company_name}</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      {renderBadge(moa.status)}
                    </div>
                  </div>
                  
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#888' }}>{moa.hte_id}</p>

                  <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#999', minWidth: '65px' }}>Industry:</span> <span style={{ fontWeight: '500', color: '#333' }}>{moa.industry_type?.split('/')[0]}</span></div>
                    <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#999', minWidth: '65px' }}>College:</span> <span style={{ fontWeight: '500', color: '#333' }}>{moa.endorsed_by_college?.replace('College of ', '')}</span></div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <IconCalendar /> <span style={{ color: '#999', marginLeft: '-2px' }}>Expires:</span> 
                      <span style={{ fontWeight: '500', color: '#333' }}>{(!moa.status.includes('Processing') && moa.expiration_date) ? new Date(moa.expiration_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleView(moa)} style={{ flex: 1, padding: '10px', background: '#f0f7ff', color: '#0d6efd', border: '1px solid #cce5ff', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>View Details</button>
                    {canMaintain && (
                      <>
                        <button onClick={() => handleEdit(moa)} style={{ flex: 1, padding: '10px', background: '#e6f4ea', color: '#1e8e3e', border: '1px solid #cce8d6', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(moa.id)} style={{ padding: '10px 14px', background: '#fce8e6', color: '#d93025', border: '1px solid #f9c2c4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><IconTrash /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {sortedMoas.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No records found.</div>}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', marginTop: '24px' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid', borderColor: currentPage === 1 ? '#e0e0e0' : 'var(--neu-blue)', background: currentPage === 1 ? '#f5f5f5' : 'transparent', color: currentPage === 1 ? '#999' : 'var(--neu-blue)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600' }}>Previous</button>
                <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: '500' }}>Page <strong style={{ color: '#0d6efd' }}>{currentPage}</strong> of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid', borderColor: currentPage === totalPages ? '#e0e0e0' : 'var(--neu-blue)', background: currentPage === totalPages ? '#f5f5f5' : 'transparent', color: currentPage === totalPages ? '#999' : 'var(--neu-blue)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '600' }}>Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentView === 'form' && (() => {
        const requiresDates = formData.status && !formData.status.includes('Processing');
        return (
          <div className="form-container" style={{ animation: 'fadeIn 0.3s ease' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: '#00204a' }}>{selectedMoa ? 'Edit MOA' : 'Add New MOA'}</h1>
            <p style={{ color: '#666', marginBottom: '32px' }}>{selectedMoa ? 'Update the MOA information below' : 'Fill in the details to create a new MOA record'}</p>

            <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '32px' }}>
              <div style={{ marginBottom: '24px' }}><FormLabel text="HTE ID" required /><input value={formData.hte_id} readOnly style={{ ...inputStyle, background: '#f8f9fa', color: '#888' }}/></div>
              <div style={{ marginBottom: '24px' }}><FormLabel text="Company Name" required /><input placeholder="Enter company name" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} required style={inputStyle}/></div>
              <div style={{ marginBottom: '32px' }}><FormLabel text="Company Address" required /><input placeholder="Enter complete company address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={inputStyle}/></div>

              <div className="form-grid">
                <div><FormLabel text="Contact Person" required /><input placeholder="Full name" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} required style={inputStyle}/></div>
                <div><FormLabel text="Contact Email" required /><input type="email" placeholder="email@example.com" value={formData.email_address} onChange={e => setFormData({...formData, email_address: e.target.value})} required style={inputStyle}/></div>
              </div>

              <div className="form-grid">
                <div>
                  <FormLabel text="Industry Type" required />
                  <select value={formData.industry_type} onChange={e => setFormData({...formData, industry_type: e.target.value})} required style={{...inputStyle, background: '#fff'}}>
                    <option value="" disabled hidden>Please choose an industry...</option>
                    {NEU_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <FormLabel text="Endorsed by College" required />
                  <select value={formData.endorsed_by_college} onChange={e => setFormData({...formData, endorsed_by_college: e.target.value})} required style={{...inputStyle, background: '#fff'}}>
                    <option value="" disabled hidden>Please choose a college...</option>
                    {NEU_COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <FormLabel text="Effective Date" required={requiresDates} />
                  <input type="date" value={requiresDates ? (formData.effective_date || '') : ''} onChange={e => setFormData({...formData, effective_date: e.target.value})} required={requiresDates} disabled={!requiresDates} style={{ ...inputStyle, background: requiresDates ? '#fff' : '#f8f9fa', color: requiresDates ? '#333' : '#aaa', cursor: requiresDates ? 'text' : 'not-allowed' }} />
                </div>
                <div>
                  <FormLabel text="Expiration Date" required={requiresDates} />
                  <input type="date" value={requiresDates ? (formData.expiration_date || '') : ''} onChange={e => setFormData({...formData, expiration_date: e.target.value})} required={requiresDates} disabled={!requiresDates} style={{ ...inputStyle, background: requiresDates ? '#fff' : '#f8f9fa', color: requiresDates ? '#333' : '#aaa', cursor: requiresDates ? 'text' : 'not-allowed' }} />
                </div>
              </div>

              <div style={{ marginBottom: '40px' }}>
                <FormLabel text="MOA Status" required />
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} required style={{...inputStyle, background: '#fff'}}>
                  <option value="" disabled hidden>Pick the status of the MOA...</option>
                  <optgroup label="APPROVED">
                    <option>Approved - Signed by President</option>
                    <option>Approved - On-going notarization</option>
                    <option>Approved - No notarization needed</option>
                  </optgroup>
                  <optgroup label="PROCESSING">
                    <option>Processing - Awaiting signature by HTE partner</option>
                    <option>Processing - Sent to Legal Office</option>
                    <option>Processing - Sent to VPAA/OP for approval</option>
                  </optgroup>
                  <optgroup label="EXPIRED">
                    <option>Expired - No renewal done</option>
                  </optgroup>
                  <optgroup label="EXPIRING">
                    <option>Expiring - Two months before</option>
                  </optgroup>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button type="button" onClick={() => setCurrentView('list')} style={{ padding: '14px 32px', background: '#f8f9fa', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#555' }}>Cancel</button>
                <button type="submit" style={{ padding: '14px 32px', background: '#0d6efd', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#fff' }}>{selectedMoa ? 'Update MOA' : 'Create MOA'}</button>
              </div>
            </form>
          </div>
        )
      })()}

      {currentView === 'details' && selectedMoa && (
        <div className="form-container" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div><h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: '#00204a' }}>MOA Details</h1><p style={{ color: '#666' }}>Memorandum of Agreement Information</p></div>
            {renderBadge(selectedMoa.status)}
          </div>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '40px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', background: '#f0f7ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconBuildingBlue /></div>
              <div><h2 style={{ fontSize: '1.4rem', margin: '0 0 4px 0', color: '#00204a' }}>{selectedMoa.company_name}</h2><p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>HTE ID: {selectedMoa.hte_id}</p></div>
            </div>

            <h4 style={{ color: '#888', letterSpacing: '1px', fontSize: '0.8rem', marginBottom: '24px', textTransform: 'uppercase', fontWeight: '600' }}>Contact Information</h4>
            <div className="form-grid">
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconLocation /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Company Address</span></div>
                <p style={{ color: '#333', fontSize: '0.95rem', margin: '0 0 24px 24px' }}>{selectedMoa.address}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconMail /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Contact Email</span></div>
                <p style={{ color: '#0d6efd', fontSize: '0.95rem', margin: '0 0 0 24px' }}>{selectedMoa.email_address}</p>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconUserGrey /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Contact Person</span></div>
                <p style={{ color: '#333', fontSize: '0.95rem', margin: '0 0 0 24px' }}>{selectedMoa.contact_person}</p>
              </div>
            </div>

            <h4 style={{ color: '#888', letterSpacing: '1px', fontSize: '0.8rem', marginBottom: '24px', textTransform: 'uppercase', fontWeight: '600', marginTop: '32px' }}>MOA Information</h4>
            <div className="form-grid">
              
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconDocGrey /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Industry Type</span></div>
                <p style={{ color: '#333', fontSize: '0.95rem', margin: '0 0 24px 24px' }}>{selectedMoa.industry_type}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconBuildingGrey /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Endorsed by College</span></div>
                <p style={{ color: '#333', fontSize: '0.95rem', margin: '0 0 0 24px' }}>{selectedMoa.endorsed_by_college}</p>
              </div>
              
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconCalendar /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Effective Date</span></div>
                <p style={{ color: '#333', fontSize: '0.95rem', margin: '0 0 24px 24px' }}>{(!selectedMoa.status.includes('Processing') && selectedMoa.effective_date) ? new Date(selectedMoa.effective_date).toLocaleDateString() : 'N/A'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><IconCalendar /> <span style={{ color: '#888', fontSize: '0.85rem' }}>Expiration Date</span></div>
                <p style={{ color: '#333', fontSize: '0.95rem', margin: '0 0 0 24px' }}>{(!selectedMoa.status.includes('Processing') && selectedMoa.expiration_date) ? new Date(selectedMoa.expiration_date).toLocaleDateString() : 'N/A'}</p>
              </div>

            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '32px' }}>
              <button onClick={() => setCurrentView('list')} style={{ padding: '12px 32px', background: '#f8f9fa', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#555' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
      <ConfirmModal dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} />
    </div>
  )
}