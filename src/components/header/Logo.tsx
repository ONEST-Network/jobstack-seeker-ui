
import React from 'react';
import { Briefcase } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const Logo = () => {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug?: string }>();

  return (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/${orgSlug || '0'}/seeker?tab=discover`)}> 
      {/* <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden"> */}
        <img
          src={import.meta.env.VITE_BASE_URL ? import.meta.env.VITE_BASE_URL + '/Onest_logo_mobile (1).png' : '/Onest_logo_mobile (1).png'}
          alt="ONEST Logo"
          className="h-12 w-auto object-contain"
        />
      {/* </div> */}
    </div>
  );
};

export default Logo;
