
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Users, CheckCircle } from 'lucide-react';

const QuickStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
      <Card>
        <CardContent className="flex items-center p-4 sm:p-6">
          <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-3 sm:mr-4" />
          <div>
            <p className="text-xl sm:text-2xl font-bold">12</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Active Jobs</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center p-4 sm:p-6">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mr-3 sm:mr-4" />
          <div>
            <p className="text-xl sm:text-2xl font-bold">48</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Applications</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center p-4 sm:p-6">
          <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mr-3 sm:mr-4" />
          <div>
            <p className="text-xl sm:text-2xl font-bold">5</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Candidates Hired</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStats;
