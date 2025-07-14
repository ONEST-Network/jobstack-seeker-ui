
import React from 'react';
import { Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Logo = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <Briefcase className="h-5 w-5 text-primary-foreground" />
      </div>
    </div>
  );
};

export default Logo;
