import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const JobCardSkeleton: React.FC = () => (
  <Card className="hover:shadow-lg transition-shadow duration-300 border border-border">
    <CardContent className="p-4 space-y-4">
      {/* Job Name with Openings and Location */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Logo, Company Name and Verified */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Skeleton className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg" />
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-6" />
        </div>
      </div>

      {/* Job Details Video & Photos Carousel */}
      <div className="w-full">
        <Skeleton className="w-full h-32 rounded-lg" />
      </div>

      {/* Two Column Layout: Total Salary & Working Hours */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div>
          <Skeleton className="h-5 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Two Column Layout: Monthly In-hand & Stay Provided */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div>
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Two Column Layout: Monthly Overtime & Cost per Sharing Bed */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>


      {/* Trust Score & Match Score */}
      <div className="flex gap-2 sm:gap-4">
        <div className="bg-blue-50 rounded-lg p-2 sm:p-3 flex-1 text-center">
          <Skeleton className="h-3 w-16 mx-auto mb-1" />
          <Skeleton className="h-4 w-8 mx-auto" />
        </div>
        <div className="bg-green-50 rounded-lg p-2 sm:p-3 flex-1 text-center">
          <Skeleton className="h-3 w-16 mx-auto mb-1" />
          <Skeleton className="h-4 w-8 mx-auto" />
        </div>
      </div>

      {/* Apply Now Button */}
      <Skeleton className="w-full h-10 sm:h-12 rounded-md" />
    </CardContent>
  </Card>
);

export default JobCardSkeleton; 