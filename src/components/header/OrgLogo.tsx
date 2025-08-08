import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrgDetails } from '@/hooks/useOrgDetails';

interface OrgLogoProps {
  orgSlug: string | null;
}

const OrgLogo: React.FC<OrgLogoProps> = ({ orgSlug }) => {
  const navigate = useNavigate();
  const { data: orgDetails, isLoading, error } = useOrgDetails(orgSlug);

  const handleLogoClick = () => {
    if (orgSlug && orgSlug !== '0') {
      navigate(`/${orgSlug}/seeker?tab=discover`);
    } else {
      navigate('/0/seeker?tab=discover');
    }
  };

  // If no org slug or org slug is '0', show default logo
  if (!orgSlug || orgSlug === '0') {
    return (
      <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
        <img
          src={import.meta.env.VITE_BASE_URL ? import.meta.env.VITE_BASE_URL + '/Onest_logo_mobile (1).png' : '/Onest_logo_mobile (1).png'}
          alt="ONEST Logo"
          className="h-12 w-auto object-contain"
        />
      </div>
    );
  }

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-12 w-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  // If error, show default logo
  if (error) {
    return (
      <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
        <img
          src={import.meta.env.VITE_BASE_URL ? import.meta.env.VITE_BASE_URL + '/Onest_logo_mobile (1).png' : '/Onest_logo_mobile (1).png'}
          alt="ONEST Logo"
          className="h-12 w-auto object-contain"
        />
      </div>
    );
  }

  // If org details are available, show org logo and name
  if (orgDetails?.data) {
    const { name, logo } = orgDetails.data;
    
    return (
      <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
        {logo ? (
          <img
            src={logo}
            alt={`${name} Logo`}
            className="h-12 w-auto object-contain"
            onError={(e) => {
              // Fallback to default logo if org logo fails to load
              const target = e.target as HTMLImageElement;
              target.src = import.meta.env.VITE_BASE_URL ? import.meta.env.VITE_BASE_URL + '/Onest_logo_mobile (1).png' : '/Onest_logo_mobile (1).png';
            }}
          />
        ) : (
          <img
            src={import.meta.env.VITE_BASE_URL ? import.meta.env.VITE_BASE_URL + '/Onest_logo_mobile (1).png' : '/Onest_logo_mobile (1).png'}
            alt="ONEST Logo"
            className="h-12 w-auto object-contain"
          />
        )}
        {name && (
          <span className="text-lg font-semibold text-gray-900 hidden sm:block">
            {name}
          </span>
        )}
      </div>
    );
  }

  // Fallback to default logo
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
      <img
        src={import.meta.env.VITE_BASE_URL ? import.meta.env.VITE_BASE_URL + '/Onest_logo_mobile (1).png' : '/Onest_logo_mobile (1).png'}
        alt="ONEST Logo"
        className="h-12 w-auto object-contain"
      />
    </div>
  );
};

export default OrgLogo;
