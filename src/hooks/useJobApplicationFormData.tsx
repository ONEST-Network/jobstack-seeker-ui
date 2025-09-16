
import { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '@/contexts/AuthContext';

export const useJobApplicationFormData = () => {
  const { user, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || 'john.doe@example.com',
    phone: user?.phone || '+91 9876543210',
    experience: '',
    whyJoin: '',
    previousWork: ''
  });

  useEffect(() => {
    if (user?.profile && user.role === 'individual') {
      const profile = user.profile as UserProfile;
      setFormData(prev => ({
        ...prev,
        name: profile.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    } else if (selectedCandidate) {
      setFormData(prev => ({
        ...prev,
        name: selectedCandidate.name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: 'John Doe'
      }));
    }
  }, [user, selectedCandidate]);

  return { formData, setFormData };
};
