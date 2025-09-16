
import React from 'react';
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

const JobCategory: React.FC<JobCategoryProps> = ({ category, onApply, onViewDetails }) => (
  <div className="space-y-4">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-foreground mb-2">{category.title}</h2>
      <p className="text-muted-foreground">{category.subtitle}</p>
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
          View More in {category.title} →
        </Button>
      </div>
    )}
  </div>
);

export default JobCategory;
