import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';
import JobApplicationHeader from './JobApplicationHeader';
import ProfileSection from './ProfileSection';
import JobOverviewCard from './JobOverviewCard';
import BasicInfoFields from './BasicInfoFields';
import ApplicationQuestions from './ApplicationQuestions';
import ScoreDisplay from './ScoreDisplay';
import { ScoreResult } from '@/utils/scoreCalculation';

interface JobApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  job: any;
  formData: {
    name: string;
    email: string;
    phone: string;
    experience: string;
    whyJoin: string;
    previousWork: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isRecording: boolean;
  handleVoiceInput: (field: string) => void;
  scores: ScoreResult;
  showCandidateDialog: boolean;
  setShowCandidateDialog: (show: boolean) => void;
  applying?: boolean;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  job,
  formData,
  setFormData,
  isRecording,
  handleVoiceInput,
  scores,
  showCandidateDialog,
  setShowCandidateDialog,
  applying = false
}) => {
  const { t } = useTranslation("jobapplicationform");

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-2xl h-[90vh] flex flex-col">
          <JobApplicationHeader jobTitle={job.title} />
          
          <div className="flex-1 overflow-y-auto py-4">
            <ProfileSection 
              formData={formData}
              showCandidateDialog={showCandidateDialog}
              setShowCandidateDialog={setShowCandidateDialog}
            />
            
            <div className="space-y-6">
              <JobOverviewCard job={job} />
              <BasicInfoFields formData={formData} setFormData={setFormData} />
              <ApplicationQuestions 
                formData={formData}
                setFormData={setFormData}
                isRecording={isRecording}
                handleVoiceInput={handleVoiceInput}
              />
              <ScoreDisplay scores={scores} />
            </div>
          </div>

          <div className="flex-shrink-0 border-t pt-4">
            <div className="flex gap-3">
              <Button 
                onClick={onSubmit} 
                className="flex-1 h-12 text-base font-medium"
                disabled={applying}
              >
                {applying ? t('jobApplicationForm.submitting') : t('jobApplicationForm.submit')}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="h-12 px-8 text-base"
                disabled={applying}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CandidateProfileDialog
        isOpen={showCandidateDialog}
        onClose={() => setShowCandidateDialog(false)}
        mode="add"
      />
    </>
  );
};

export default JobApplicationForm;
