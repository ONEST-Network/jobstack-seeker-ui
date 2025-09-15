import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, X, Play } from 'lucide-react';
import { JobData } from '@/types/jobPost';
import { useTranslation } from 'react-i18next';

interface JobDescriptionCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const JobDescriptionCard: React.FC<JobDescriptionCardProps> = ({ jobData, setJobData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const { t } = useTranslation('jobDescriptioncard'); 

  const handleVoiceInput = (field: string) => {
    if (isRecording) {
      setIsRecording(false);
      const mockVoiceText =
        "We are looking for a skilled professional to join our growing team. This is an excellent opportunity for career growth.";
      if (field === 'description') {
        setJobData(prev => ({ ...prev, description: mockVoiceText }));
      }
    } else {
      setIsRecording(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="description">{t('description.label')}</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Textarea
                id="description"
                value={jobData.description}
                onChange={(e) => setJobData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('description.placeholder')}
                rows={4}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVoiceInput('description')}
                className={isRecording ? 'bg-red-100 text-red-600' : ''}
              >
                {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            {isRecording && (
              <div className="text-sm text-red-600 flex items-center gap-2">
                <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
                {t('recordingMessage')}
              </div>
            )}
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              {t('generateWithAI')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workTimings">{t('workTimings.label')}</Label>
            <Input
              id="workTimings"
              value={jobData.workTimings}
              onChange={(e) => setJobData(prev => ({ ...prev, workTimings: e.target.value }))}
              placeholder={t('workTimings.placeholder')}
            />
          </div>
          <div>
            <Label htmlFor="workDays">{t('workDays.label')}</Label>
            <Input
              id="workDays"
              value={jobData.workDays}
              onChange={(e) => setJobData(prev => ({ ...prev, workDays: e.target.value }))}
              placeholder={t('workDays.placeholder')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobDescriptionCard;
