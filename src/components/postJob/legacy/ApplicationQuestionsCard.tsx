import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { JobData } from '@/types/jobPost';
import { useTranslation } from 'react-i18next';

interface ApplicationQuestionsCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const ApplicationQuestionsCard: React.FC<ApplicationQuestionsCardProps> = ({ jobData, setJobData }) => {
  const { t } = useTranslation('applicationquestionscard'); 

  const addField = (field: 'questions') => {
    setJobData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeField = (field: 'questions', index: number) => {
    setJobData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateField = (field: 'questions', index: number, value: string) => {
    setJobData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{t('customQuestionsLabel')}</Label>
          {jobData.questions.map((question, index) => (
            <div key={index} className="flex gap-2 mt-2">
              <Input
                value={question}
                onChange={(e) => updateField('questions', index, e.target.value)}
                placeholder={t('questionPlaceholder')}
              />
              {jobData.questions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeField('questions', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addField('questions')}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addQuestion')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationQuestionsCard;
