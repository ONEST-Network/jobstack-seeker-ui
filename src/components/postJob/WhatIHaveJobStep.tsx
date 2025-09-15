import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { JobData } from '@/types/jobPost';
import SalaryPaymentCard from './whatIHave/SalaryPaymentCard';
import WorkConditionsCard from './whatIHave/WorkConditionsCard';
import FactoryEnvironmentCard from './whatIHave/FactoryEnvironmentCard';

interface WhatIHaveJobStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: string;
  selectedIndustry: string;
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

const WhatIHaveJobStep: React.FC<WhatIHaveJobStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  selectedIndustry,
  jobData,
  setJobData,
  onNext,
  onBack,
  onSaveDraft
}) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation('whatIHaveJobStep');

  const handleNext = () => {
    if (!jobData.monthlySalary || jobData.regularHoursPerDay === 0) {
      alert(t('postJob.whatIHave.alert'));
      return;
    }
    onNext();
  };

  const content = (
    <div className="space-y-4 sm:space-y-6">
      {/* Header for mobile */}
      {selectedJobRole && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">{selectedIndustry}</Badge>
          <span className="text-sm text-muted-foreground">→</span>
          <Badge className="text-xs">{selectedJobRole}</Badge>
        </div>
      )}

      <SalaryPaymentCard jobData={jobData} setJobData={setJobData} />
      <WorkConditionsCard jobData={jobData} setJobData={setJobData} />
      <FactoryEnvironmentCard jobData={jobData} setJobData={setJobData} />

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 sticky bottom-0 bg-background pb-4 sm:pb-0 sm:static border-t sm:border-t-0 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button variant="outline" onClick={onBack} className="h-touch order-2 sm:order-1">
          {t('postJob.whatIHave.back')}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
          <Button variant="outline" onClick={onSaveDraft} className="h-touch">
            {t('postJob.whatIHave.saveDraft')}
          </Button>
          <Button onClick={handleNext} className="h-touch">
            {t('postJob.whatIHave.next')}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[95vh]">
          <DrawerHeader className="text-left border-b pb-3">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg">{t('postJob.whatIHave.title')}</DrawerTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('postJob.whatIHave.title')}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default WhatIHaveJobStep;
