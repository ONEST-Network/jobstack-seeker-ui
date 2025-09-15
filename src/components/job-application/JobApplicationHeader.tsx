import React from 'react';
import { useTranslation } from 'react-i18next';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface JobApplicationHeaderProps {
  jobTitle: string;
}

const JobApplicationHeader: React.FC<JobApplicationHeaderProps> = ({ jobTitle }) => {
  const { t } = useTranslation("jobapplicationheader");

  return (
    <DialogHeader className="flex-shrink-0 border-b pb-4">
      <DialogTitle className="text-xl">
        {t('jobApplicationHeader.applyFor', { jobTitle })}
      </DialogTitle>
    </DialogHeader>
  );
};

export default JobApplicationHeader;
