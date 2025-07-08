
import React from 'react';
import { Button } from '@/components/ui/button';

interface JobPaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const JobPagination: React.FC<JobPaginationProps> = ({ currentPage, setCurrentPage }) => {
  return (
    <div className="flex justify-center items-center gap-3 pt-8">
      <Button 
        variant="outline" 
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
        className="h-12 px-6 text-base"
      >
        Previous
      </Button>
      {[1, 2, 3, 4, 5].map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          className="w-12 h-12 text-base"
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Button>
      ))}
      <Button 
        variant="outline"
        onClick={() => setCurrentPage(currentPage + 1)}
        className="h-12 px-6 text-base"
      >
        Next
      </Button>
    </div>
  );
};

export default JobPagination;
