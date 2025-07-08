
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Video } from 'lucide-react';
import { JobData } from '@/types/jobPost';

interface FactoryEnvironmentCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const FactoryEnvironmentCard: React.FC<FactoryEnvironmentCardProps> = ({ jobData, setJobData }) => {
  const handleVideoUpload = (type: 'walkthrough' | 'testimonial') => {
    // Placeholder for video upload functionality
    alert(`Video upload for ${type} - Feature to be implemented`);
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Video className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          Factory Environment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Factory Walkthrough Video</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
            <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
            <Button onClick={() => handleVideoUpload('walkthrough')} variant="outline" className="h-touch">
              Upload Factory Walkthrough
            </Button>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Show the factory floor, working conditions, and facilities
            </p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Worker Testimonial Video</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
            <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
            <Button onClick={() => handleVideoUpload('testimonial')} variant="outline" className="h-touch">
              Upload Worker Testimonial
            </Button>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Current employee sharing their experience
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="factoryTrustScore" className="text-sm font-medium">Factory Trust Score</Label>
          <Input
            id="factoryTrustScore"
            type="number"
            value={jobData.factoryTrustScore || ''}
            onChange={(e) => setJobData(prev => ({ ...prev, factoryTrustScore: parseInt(e.target.value) || 0 }))}
            placeholder="8.5"
            min="0"
            max="10"
            step="0.1"
            readOnly
            className="bg-gray-50 h-touch text-base"
          />
          <p className="text-xs text-muted-foreground mt-1">Auto-computed based on uploaded videos and reviews</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FactoryEnvironmentCard;
