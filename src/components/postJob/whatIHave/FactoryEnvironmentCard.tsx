
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Video } from 'lucide-react';
import { JobData } from '@/types/jobPost';
import { FileUploadField } from '@/components/ui/file-upload-field';

interface FactoryEnvironmentCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const FactoryEnvironmentCard: React.FC<FactoryEnvironmentCardProps> = ({ jobData, setJobData }) => {
  const handleVideoUpload = (type: 'walkthrough' | 'testimonial', file: string | File | null) => {
    if (file && typeof file === 'string') {
      setJobData(prev => ({
        ...prev,
        factoryWalkthroughVideo: type === 'walkthrough' ? file : prev.factoryWalkthroughVideo,
        workerTestimonialVideo: type === 'testimonial' ? file : prev.workerTestimonialVideo
      }));
    }
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
          <FileUploadField
            label=""
            description="Show the factory floor, working conditions, and facilities"
            accept="video/*"
            fileType="video"
            value={jobData.factoryWalkthroughVideo}
            onChange={(file) => handleVideoUpload('walkthrough', file)}
            usePresignedUrl={true}
            objectKeyPrefix="factory"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Worker Testimonial Video</Label>
          <FileUploadField
            label=""
            description="Current employee sharing their experience"
            accept="video/*"
            fileType="video"
            value={jobData.workerTestimonialVideo}
            onChange={(file) => handleVideoUpload('testimonial', file)}
            usePresignedUrl={true}
            objectKeyPrefix="factory"
          />
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
