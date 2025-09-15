import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobData } from '@/types/jobPost';
import BasicJobInfoCard from './BasicJobInfoCard';
import JobDescriptionCard from './JobDescriptionCard';
import RequirementsBenefitsCard from './RequirementsBenefitsCard';
import ApplicationQuestionsCard from './ApplicationQuestionsCard';
import { useTranslation } from 'react-i18next';

interface LegacyJobPostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: string;
  selectedIndustry: string;
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
  onSubmit: () => void;
  onBack: () => void;
}

const LegacyJobPostDialog: React.FC<LegacyJobPostDialogProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  selectedIndustry,
  jobData,
  setJobData,
  onSubmit,
  onBack
}) => {
  const { t } = useTranslation('jobPostDialog'); 

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
          {selectedJobRole && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{selectedIndustry}</Badge>
              <span className="text-sm text-muted-foreground">→</span>
              <Badge>{selectedJobRole}</Badge>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          <BasicJobInfoCard jobData={jobData} setJobData={setJobData} />
          <JobDescriptionCard jobData={jobData} setJobData={setJobData} />
          <RequirementsBenefitsCard jobData={jobData} setJobData={setJobData} />
          <ApplicationQuestionsCard jobData={jobData} setJobData={setJobData} />

          <div className="flex gap-2">
            <Button onClick={onSubmit} className="flex-1">
              {t('dialog.postJob')}
            </Button>
            <Button variant="outline" onClick={onBack}>
              {t('dialog.back')}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t('dialog.saveDraft')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegacyJobPostDialog;
