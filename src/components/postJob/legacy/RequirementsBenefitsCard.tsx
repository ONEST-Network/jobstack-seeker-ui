import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { JobData } from '@/types/jobPost';
import { useTranslation } from 'react-i18next';

interface RequirementsBenefitsCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const RequirementsBenefitsCard: React.FC<RequirementsBenefitsCardProps> = ({ jobData, setJobData }) => {
  const { t } = useTranslation('requirementsBenefitsCard');

  const addField = (field: 'requirements' | 'benefits') => {
    setJobData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeField = (field: 'requirements' | 'benefits', index: number) => {
    setJobData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateField = (field: 'requirements' | 'benefits', index: number, value: string) => {
    setJobData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item))
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {t('requirementsBenefits.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Requirements */}
        <div>
          <Label>{t('requirementsBenefits.requirementsLabel')}</Label>
          {jobData.requirements.map((req, index) => (
            <div key={index} className="flex gap-2 mt-2">
              <Input
                value={req}
                onChange={(e) => updateField('requirements', index, e.target.value)}
                placeholder={t('requirementsBenefits.requirementPlaceholder')}
              />
              {jobData.requirements.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeField('requirements', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addField('requirements')}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('requirementsBenefits.addRequirement')}
          </Button>
        </div>

        {/* Benefits */}
        <div>
          <Label>{t('requirementsBenefits.benefitsLabel')}</Label>
          {jobData.benefits.map((benefit, index) => (
            <div key={index} className="flex gap-2 mt-2">
              <Input
                value={benefit}
                onChange={(e) => updateField('benefits', index, e.target.value)}
                placeholder={t('requirementsBenefits.benefitPlaceholder')}
              />
              {jobData.benefits.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeField('benefits', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addField('benefits')}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('requirementsBenefits.addBenefit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequirementsBenefitsCard;
