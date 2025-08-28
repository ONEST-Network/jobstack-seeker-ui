
import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface JobPaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages?: number;
}

const JobPagination: React.FC<JobPaginationProps> = ({ 
  currentPage, 
  setCurrentPage, 
  totalPages = 5 
}) => {
  const isMobile = useIsMobile();
  
  // Smart pagination for mobile and desktop
  const getVisiblePages = () => {
    const maxVisible = isMobile ? 3 : 5;
    const pages: number[] = [];
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 2) {
      return Array.from({ length: Math.min(maxVisible, totalPages) }, (_, i) => i + 1);
    }
    
    if (currentPage >= totalPages - 1) {
      return Array.from({ length: Math.min(maxVisible, totalPages) }, (_, i) => totalPages - maxVisible + 1 + i);
    }
    
    // Show current page in the middle
    const start = currentPage - Math.floor(maxVisible / 2);
    return Array.from({ length: maxVisible }, (_, i) => start + i);
  };

  return (
    <div className="flex justify-center items-center gap-2 sm:gap-3 pt-8">
      <Button 
        variant="outline" 
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
        className={`${isMobile ? 'h-10 px-3' : 'h-12 px-6'} text-base touch-manipulation`}
      >
        {isMobile ? <ChevronLeft className="h-4 w-4" /> : 'Previous'}
      </Button>
      
      {getVisiblePages().map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-base touch-manipulation`}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Button>
      ))}
      
      <Button 
        variant="outline"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
        className={`${isMobile ? 'h-10 px-3' : 'h-12 px-6'} text-base touch-manipulation`}
      >
        {isMobile ? <ChevronRight className="h-4 w-4" /> : 'Next'}
      </Button>
    </div>
  );
};

export default JobPagination;
