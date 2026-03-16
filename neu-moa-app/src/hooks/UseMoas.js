import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Pass the role and rights so the hook knows exactly what to fetch and if it can update the DB
export function useMoas(role = 'admin', canMaintain = false) {
  const [moas, setMoas] = useState([]);
  const [loadingMoas, setLoadingMoas] = useState(true);

  const fetchMoas = useCallback(async () => {
    setLoadingMoas(true);
    
    // Build the dynamic query based on the user's role
    let query = supabase.from('moas').select('*').order('created_at', { ascending: false });
    
    if (role === 'student') {
      // Students only see active, approved MOAs
      query = query.ilike('status', 'APPROVED%').is('deleted_at', null);
    } else if (role === 'faculty') {
      // Faculty see all active MOAs (not deleted)
      query = query.is('deleted_at', null);
    }
    // Admins get everything (no extra filters needed)

    const { data, error } = await query;

    if (error || !data) {
      console.error("Error fetching MOAs:", error);
      setMoas([]);
      setLoadingMoas(false);
      return;
    }

    // Smart DB Auto-Cleanup & Expiration Check
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const twoMonthsFromNow = new Date(today);
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    // Only Admins or authorized Faculty can push background auto-updates
    const canUpdateDB = role === 'admin' || (role === 'faculty' && canMaintain);

    const processedMoas = data.map(moa => {
      let updatedMoa = { ...moa };
      let dbNeedsUpdate = false;

      // Check A: Wipe dates if status is Processing
      if (updatedMoa.status.includes('Processing') && (updatedMoa.effective_date || updatedMoa.expiration_date)) {
        updatedMoa.effective_date = null;
        updatedMoa.expiration_date = null;
        dbNeedsUpdate = true;
      }

      // Check B: Check for Expiring / Expired
      if (!updatedMoa.status.includes('Processing') && updatedMoa.expiration_date) {
        const expDate = new Date(updatedMoa.expiration_date);
        expDate.setHours(0, 0, 0, 0);
        let newStatusDB = updatedMoa.status;

        if (expDate < today && !updatedMoa.status.includes('Expired')) {
          newStatusDB = 'Expired: No renewal done';
        } else if (expDate >= today && expDate <= twoMonthsFromNow && !updatedMoa.status.includes('Expiring') && !updatedMoa.status.includes('Expired')) {
          newStatusDB = 'Expiring: Two months before';
        }

        if (newStatusDB !== updatedMoa.status) {
          updatedMoa.status = newStatusDB;
          dbNeedsUpdate = true;
        }
      }

      // If data was fixed automatically, sync to Supabase silently
      if (dbNeedsUpdate && canUpdateDB) {
        supabase.from('moas').update({ 
          status: updatedMoa.status, 
          effective_date: updatedMoa.effective_date, 
          expiration_date: updatedMoa.expiration_date 
        }).eq('id', updatedMoa.id).then();
      }

      return updatedMoa;
    });

    setMoas(processedMoas);
    setLoadingMoas(false);
  }, [role, canMaintain]);

  // Fetch MOAs on component mount
  useEffect(() => {
    fetchMoas();
  }, [fetchMoas]);

  return { moas, loadingMoas, fetchMoas };
}