
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const Navigation = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleFindJobs = () => {
    // Always navigate to the Discover tab so that the "Jobs for You" list is rendered
    navigate('/seeker?tab=discover');
  };



  return (
    <nav className="flex items-center gap-2 sm:gap-6">
      <Button 
        variant="ghost" 
        className="text-foreground hover:text-primary text-sm sm:text-base px-2 sm:px-4" 
        onClick={handleFindJobs}
      >
        {isMobile ? 'Jobs' : 'Find Jobs'}
      </Button>

    </nav>
  );
};

export default Navigation;
