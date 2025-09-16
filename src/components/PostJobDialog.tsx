
import React from 'react';
import LoginStep from './postJob/LoginStep';
import OrgProfileStep from './postJob/OrgProfileStep';
import RoleSelectionStep from './postJob/RoleSelectionStep';
import WhoIAmJobStep from './postJob/WhoIAmJobStep';
import WhatIHaveJobStep from './postJob/WhatIHaveJobStep';
import WhatIWantJobStep from './postJob/WhatIWantJobStep';
import { PostJobDialogProps } from '@/types/jobPost';
import { useJobPostState } from './postJob/hooks/useJobPostState';
import { useJobPostHandlers } from './postJob/hooks/useJobPostHandlers';

const PostJobDialog: React.FC<PostJobDialogProps> = ({ isOpen, onClose, skipAuthSteps = false, draftId }) => {
  const {
    step,
    setStep,
    selectedJobRole,
    setSelectedJobRole,
    selectedIndustry,
    setSelectedIndustry,
    jobData,
    setJobData,
    orgData,
    setOrgData,
    handleSaveDraft,
    toast
  } = useJobPostState({ skipAuthSteps, draftId, isOpen });

  const {
    handleRoleSelection,
    handleLogin,
    handleOrgProfileSubmit,
    handlePublishJob,
    handleJobSubmit,
    handleClose
  } = useJobPostHandlers({
    jobData,
    selectedJobRole,
    setJobData,
    setStep,
    handleSaveDraft,
    onClose,
    skipAuthSteps,
    toast
  });

  if (step === 'login') {
    return (
      <LoginStep
        isOpen={isOpen}
        onClose={handleClose}
        onLogin={handleLogin}
      />
    );
  }

  if (step === 'orgProfile') {
    return (
      <OrgProfileStep
        isOpen={isOpen}
        onClose={handleClose}
        orgData={orgData}
        setOrgData={setOrgData}
        onSubmit={handleOrgProfileSubmit}
      />
    );
  }

  if (step === 'roleSelection') {
    return (
      <RoleSelectionStep
        isOpen={isOpen}
        onClose={handleClose}
        selectedJobRole={selectedJobRole}
        selectedIndustry={selectedIndustry}
        onRoleSelection={(role, industry) => {
          setSelectedJobRole(role);
          setSelectedIndustry(industry);
          handleRoleSelection(role, industry);
        }}
        onProceed={() => setStep('whoIAm')}
        onBack={() => setStep(skipAuthSteps ? 'roleSelection' : 'orgProfile')}
        skipAuthSteps={skipAuthSteps}
      />
    );
  }

  if (step === 'whoIAm') {
    return (
      <WhoIAmJobStep
        isOpen={isOpen}
        onClose={handleClose}
        selectedJobRole={selectedJobRole}
        selectedIndustry={selectedIndustry}
        jobData={jobData}
        setJobData={setJobData}
        onNext={() => setStep('whatIHave')}
        onBack={() => setStep('roleSelection')}
        onSaveDraft={handleSaveDraft}
      />
    );
  }

  if (step === 'whatIHave') {
    return (
      <WhatIHaveJobStep
        isOpen={isOpen}
        onClose={handleClose}
        selectedJobRole={selectedJobRole}
        selectedIndustry={selectedIndustry}
        jobData={jobData}
        setJobData={setJobData}
        onNext={() => setStep('whatIWant')}
        onBack={() => setStep('whoIAm')}
        onSaveDraft={handleSaveDraft}
      />
    );
  }

  return (
    <WhatIWantJobStep
      isOpen={isOpen}
      onClose={handleClose}
      selectedJobRole={selectedJobRole}
      selectedIndustry={selectedIndustry}
      jobData={jobData}
      setJobData={setJobData}
      onSubmit={handleJobSubmit}
      onBack={() => setStep('whatIHave')}
      onSaveDraft={handleSaveDraft}
      onPublish={handlePublishJob}
    />
  );
};

export default PostJobDialog;
