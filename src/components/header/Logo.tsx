
import React from 'react';
import { Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Logo = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/seeker?tab=discover')}> 
      {/* <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden"> */}
        <img
          src={import.meta.env.VITE_BASE_URL ? import.meta.env.VITE_BASE_URL + '/Onest_logo_mobile (1).png' : '/Onest_logo_mobile (1).png'}
          alt="ONEST Logo"
          className="h-20 w-20 object-contain"
        />
      {/* </div> */}
    </div>
  );
};

export default Logo;
