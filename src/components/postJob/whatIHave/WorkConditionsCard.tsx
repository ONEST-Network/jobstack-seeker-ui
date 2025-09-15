import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { JobData } from '@/types/jobPost';
import { useTranslation } from 'react-i18next';

interface WorkConditionsCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const WorkConditionsCard: React.FC<WorkConditionsCardProps> = ({ jobData, setJobData }) => {
  const { t } = useTranslation('workConditionsCard');

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">
          {t('workConditions.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="regularHours" className="text-sm font-medium">
              {t('workConditions.regularHours')}
            </Label>
            <Input
              id="regularHours"
              type="number"
              inputMode="numeric"
              value={jobData.regularHoursPerDay || ''}
              onChange={(e) =>
                setJobData((prev) => ({
                  ...prev,
                  regularHoursPerDay: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="8"
              min="1"
              max="12"
              className="h-touch text-base"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('workConditions.overtime')}
            </Label>
            <div className="flex items-center space-x-3">
              <Switch
                checked={jobData.overtime}
                onCheckedChange={(checked) =>
                  setJobData((prev) => ({ ...prev, overtime: checked }))
                }
              />
              <span className="text-sm">
                {jobData.overtime ? t('common.yes') : t('common.no')}
              </span>
            </div>
          </div>
        </div>

        {jobData.overtime && (
          <div>
            <Label htmlFor="overtimePay" className="text-sm font-medium">
              {t('workConditions.overtimePay')}
            </Label>
            <Select
              value={jobData.overtimePay}
              onValueChange={(value: '1x' | '1.5x' | '2x') =>
                setJobData((prev) => ({ ...prev, overtimePay: value }))
              }
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1x">{t('workConditions.overtimeRates.1x')}</SelectItem>
                <SelectItem value="1.5x">{t('workConditions.overtimeRates.1_5x')}</SelectItem>
                <SelectItem value="2x">{t('workConditions.overtimeRates.2x')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('workConditions.housing')}
            </Label>
            <div className="flex items-center space-x-3">
              <Switch
                checked={jobData.housingFacility}
                onCheckedChange={(checked) =>
                  setJobData((prev) => ({ ...prev, housingFacility: checked }))
                }
              />
              <span className="text-sm">
                {jobData.housingFacility ? t('common.available') : t('common.notAvailable')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('workConditions.food')}
            </Label>
            <div className="flex items-center space-x-3">
              <Switch
                checked={jobData.foodFacility}
                onCheckedChange={(checked) =>
                  setJobData((prev) => ({ ...prev, foodFacility: checked }))
                }
              />
              <span className="text-sm">
                {jobData.foodFacility ? t('common.available') : t('common.notAvailable')}
              </span>
            </div>
          </div>
        </div>

        {jobData.housingFacility && (
          <div>
            <Label htmlFor="housingType" className="text-sm font-medium">
              {t('workConditions.housingType')}
            </Label>
            <Select
              value={jobData.housingType || ''}
              onValueChange={(value: 'dormitory' | 'shared-room' | 'individual-room') =>
                setJobData((prev) => ({ ...prev, housingType: value }))
              }
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dormitory">{t('workConditions.housingTypes.dormitory')}</SelectItem>
                <SelectItem value="shared-room">{t('workConditions.housingTypes.shared')}</SelectItem>
                <SelectItem value="individual-room">{t('workConditions.housingTypes.individual')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {jobData.foodFacility && (
          <div>
            <Label htmlFor="foodType" className="text-sm font-medium">
              {t('workConditions.foodType')}
            </Label>
            <Select
              value={jobData.foodType || ''}
              onValueChange={(value: 'meals-provided' | 'subsidized-canteen' | 'food-allowance') =>
                setJobData((prev) => ({ ...prev, foodType: value }))
              }
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meals-provided">{t('workConditions.foodTypes.meals')}</SelectItem>
                <SelectItem value="subsidized-canteen">{t('workConditions.foodTypes.canteen')}</SelectItem>
                <SelectItem value="food-allowance">{t('workConditions.foodTypes.allowance')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t('workConditions.gradeUpgradation')}
          </Label>
          <div className="flex items-center space-x-3">
            <Switch
              checked={jobData.gradeUpgradation}
              onCheckedChange={(checked) =>
                setJobData((prev) => ({ ...prev, gradeUpgradation: checked }))
              }
            />
            <span className="text-sm">
              {jobData.gradeUpgradation ? t('common.available') : t('common.notAvailable')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkConditionsCard;