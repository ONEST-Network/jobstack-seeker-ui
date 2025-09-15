
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface JobApplicationHeaderProps {
  jobTitle: string;
}

const JobApplicationHeader: React.FC<JobApplicationHeaderProps> = ({ jobTitle }) => {
  return (
    <DialogHeader className="flex-shrink-0 border-b pb-4">
      <DialogTitle className="text-xl">
        Apply for {jobTitle}
      </DialogTitle>
    </DialogHeader>
  );
};

export default JobApplicationHeader;
