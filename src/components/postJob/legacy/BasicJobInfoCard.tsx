import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JobData } from '@/types/jobPost';
import { useTranslation } from 'react-i18next';

interface BasicJobInfoCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const BasicJobInfoCard: React.FC<BasicJobInfoCardProps> = ({ jobData, setJobData }) => {
  const { t } = useTranslation('basicJobInfoCard'); 

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="jobTitle">{t('jobTitle.label')}</Label>
            <Input
              id="jobTitle"
              value={jobData.title}
              onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('jobTitle.placeholder')}
            />
          </div>
          <div>
            <Label htmlFor="location">{t('location.label')}</Label>
            <Input
              id="location"
              value={jobData.location}
              onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={t('location.placeholder')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="jobType">{t('jobType.label')}</Label>
            <Select
              value={jobData.jobType}
              onValueChange={(value) => setJobData(prev => ({ ...prev, jobType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('jobType.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">{t('jobType.options.fullTime')}</SelectItem>
                <SelectItem value="part-time">{t('jobType.options.partTime')}</SelectItem>
                <SelectItem value="contract">{t('jobType.options.contract')}</SelectItem>
                <SelectItem value="internship">{t('jobType.options.internship')}</SelectItem>
                <SelectItem value="trainee">{t('jobType.options.trainee')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="salary">{t('salary.label')}</Label>
            <Input
              id="salary"
              value={jobData.salary}
              onChange={(e) => setJobData(prev => ({ ...prev, salary: e.target.value }))}
              placeholder={t('salary.placeholder')}
            />
          </div>
          <div>
            <Label htmlFor="payFrequency">{t('payFrequency.label')}</Label>
            <Select
              value={jobData.payFrequency}
              onValueChange={(value) => setJobData(prev => ({ ...prev, payFrequency: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('payFrequency.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t('payFrequency.options.daily')}</SelectItem>
                <SelectItem value="weekly">{t('payFrequency.options.weekly')}</SelectItem>
                <SelectItem value="monthly">{t('payFrequency.options.monthly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="experience">{t('experience.label')}</Label>
            <Input
              id="experience"
              value={jobData.experience}
              onChange={(e) => setJobData(prev => ({ ...prev, experience: e.target.value }))}
              placeholder={t('experience.placeholder')}
            />
          </div>
          <div>
            <Label htmlFor="positions">{t('positions.label')}</Label>
            <Input
              id="positions"
              type="number"
              value={jobData.positions}
              onChange={(e) => setJobData(prev => ({ ...prev, positions: parseInt(e.target.value) || 1 }))}
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="lastDate">{t('lastDate.label')}</Label>
            <Input
              id="lastDate"
              type="date"
              value={jobData.lastDate}
              onChange={(e) => setJobData(prev => ({ ...prev, lastDate: e.target.value }))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicJobInfoCard;
