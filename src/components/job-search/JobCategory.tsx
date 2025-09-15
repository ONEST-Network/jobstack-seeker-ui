import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import JobCard from './JobCard';

interface JobCategoryProps {
  category: {
    title: string;
    subtitle: string;
    jobs: any[];
  };
  onApply: (job: any) => void;
  onViewDetails: (job: any) => void;
}

const JobCategory: React.FC<JobCategoryProps> = ({ category, onApply, onViewDetails }) => {
  const { t } = useTranslation("jobcategory");

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t(`jobCategory.${category.title}.title`, category.title)}
        </h2>
        <p className="text-muted-foreground">
          {t(`jobCategory.${category.title}.subtitle`, category.subtitle)}
        </p>
      </div>
      
      <div className="space-y-4">
        {category.jobs.map((job) => (
          <JobCard 
            key={job.id} 
            job={job} 
            onApply={onApply}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
      
      {category.jobs.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline" className="px-8 h-12 text-base">
            {t('jobCategory.viewMore', { category: category.title })}
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobCategory;
