import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import { JobData } from '@/types/jobPost';
import { useTranslation } from 'react-i18next';

interface SalaryPaymentCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const SalaryPaymentCard: React.FC<SalaryPaymentCardProps> = ({ jobData, setJobData }) => {
  const { t } = useTranslation('salaryPaymentcard');

  // Auto-calculate in-hand salary
  useEffect(() => {
    const inHand = jobData.monthlySalary - (jobData.pfDeduction || 0) - (jobData.esicDeduction || 0);
    setJobData(prev => ({ ...prev, inHandSalary: Math.max(0, inHand) }));
  }, [jobData.monthlySalary, jobData.pfDeduction, jobData.esicDeduction, setJobData]);

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          {t('salaryPayment.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="monthlySalary" className="text-sm font-medium">
              {t('salaryPayment.monthlySalaryLabel')}
            </Label>
            <Input
              id="monthlySalary"
              type="number"
              inputMode="numeric"
              value={jobData.monthlySalary || ''}
              onChange={(e) => setJobData(prev => ({ ...prev, monthlySalary: parseInt(e.target.value) || 0 }))}
              placeholder={t('salaryPayment.monthlySalaryPlaceholder')}
              className="h-touch text-base"
            />
          </div>
          <div>
            <Label htmlFor="salaryFrequency" className="text-sm font-medium">
              {t('salaryPayment.salaryFrequencyLabel')}
            </Label>
            <Select 
              value={jobData.salaryFrequency} 
              onValueChange={(value: 'weekly' | 'monthly') => setJobData(prev => ({ ...prev, salaryFrequency: value }))}
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder={t('salaryPayment.salaryFrequencyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{t('salaryPayment.salaryFrequencyOptions.weekly')}</SelectItem>
                <SelectItem value="monthly">{t('salaryPayment.salaryFrequencyOptions.monthly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pfDeduction" className="text-sm font-medium">
              {t('salaryPayment.pfDeductionLabel')}
            </Label>
            <Input
              id="pfDeduction"
              type="number"
              inputMode="numeric"
              value={jobData.pfDeduction || ''}
              onChange={(e) => setJobData(prev => ({ ...prev, pfDeduction: parseInt(e.target.value) || 0 }))}
              placeholder={t('salaryPayment.pfDeductionPlaceholder')}
              className="h-touch text-base"
            />
          </div>
          <div>
            <Label htmlFor="esicDeduction" className="text-sm font-medium">
              {t('salaryPayment.esicDeductionLabel')}
            </Label>
            <Input
              id="esicDeduction"
              type="number"
              inputMode="numeric"
              value={jobData.esicDeduction || ''}
              onChange={(e) => setJobData(prev => ({ ...prev, esicDeduction: parseInt(e.target.value) || 0 }))}
              placeholder={t('salaryPayment.esicDeductionPlaceholder')}
              className="h-touch text-base"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="inHandSalary" className="text-sm font-medium">
            {t('salaryPayment.inHandLabel')}
          </Label>
          <Input
            id="inHandSalary"
            type="number"
            value={jobData.inHandSalary || 0}
            readOnly
            className="bg-green-50 font-semibold h-touch text-base"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('salaryPayment.inHandNote')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="advanceMonths" className="text-sm font-medium">
              {t('salaryPayment.advanceMonthsLabel')}
            </Label>
            <Input
              id="advanceMonths"
              type="number"
              inputMode="numeric"
              value={jobData.advanceMonths || ''}
              onChange={(e) => setJobData(prev => ({ ...prev, advanceMonths: parseInt(e.target.value) || 0 }))}
              placeholder={t('salaryPayment.advanceMonthsPlaceholder')}
              min="0"
              max="12"
              className="h-touch text-base"
            />
          </div>
          <div>
            <Label htmlFor="advanceFrequency" className="text-sm font-medium">
              {t('salaryPayment.advanceFrequencyLabel')}
            </Label>
            <Select 
              value={jobData.advanceFrequency} 
              onValueChange={(value: 'monthly' | 'quarterly' | 'half-yearly') => setJobData(prev => ({ ...prev, advanceFrequency: value }))}
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder={t('salaryPayment.advanceFrequencyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t('salaryPayment.advanceFrequencyOptions.monthly')}</SelectItem>
                <SelectItem value="quarterly">{t('salaryPayment.advanceFrequencyOptions.quarterly')}</SelectItem>
                <SelectItem value="half-yearly">{t('salaryPayment.advanceFrequencyOptions.halfYearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryPaymentCard;
