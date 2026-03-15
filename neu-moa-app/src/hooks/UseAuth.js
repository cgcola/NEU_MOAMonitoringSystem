import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { formatName } from '../utils/helpers'; 

export function useAuth() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(true);

  const getUserData = async () => {
    setLoadingAuth(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUserEmail(user.email);
      const metadata = user.user_metadata;
      
      if (metadata) {
        setUserAvatar(metadata.avatar_url || metadata.picture || '');
        const rawName = metadata.full_name || metadata.name || '';
        // Uses your helper function to format "LastName, FirstName" correctly
        setUserName(formatName(rawName)); 
      }
    }
    setLoadingAuth(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  useEffect(() => {
    getUserData();
  }, []);

  return { userEmail, userName, userAvatar, loadingAuth, handleSignOut };
}