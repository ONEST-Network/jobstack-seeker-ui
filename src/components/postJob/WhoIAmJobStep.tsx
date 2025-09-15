import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin } from 'lucide-react';
import { JobData } from '@/types/jobPost';
import { useTranslation } from 'react-i18next';

interface WhoIAmJobStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: string;
  selectedIndustry: string;
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft?: () => void;
}

const WhoIAmJobStep: React.FC<WhoIAmJobStepProps> = ({
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
  const { t } = useTranslation('whoIAmJobStep');

  const handleNext = () => {
    if (!jobData.companyName || !jobData.factoryLocation || !jobData.pocName || !jobData.pocPhone || !jobData.pocEmail) {
      alert(t('postJob.whoIAm.validation.fillRequired'));
      return;
    }
    onNext();
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) onSaveDraft();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>{t('postJob.steps.whoIAm')} - {t('postJob.whoIAm.title')} (Step 1 of 3)</span>
            {jobData.lastSavedAt && (
              <span className="text-xs text-muted-foreground">
                {t('postJob.common.lastSaved')} {new Date(jobData.lastSavedAt).toLocaleTimeString()}
              </span>
            )}
          </DialogTitle>
          {selectedJobRole && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{selectedIndustry}</Badge>
              <span className="text-sm text-muted-foreground">→</span>
              <Badge>{selectedJobRole}</Badge>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">{t('postJob.whoIAm.companyInfo.title')}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">{t('postJob.whoIAm.companyInfo.companyName')} *</Label>
                  <Input
                    id="companyName"
                    value={jobData.companyName}
                    onChange={(e) => setJobData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder={t('postJob.whoIAm.companyInfo.companyNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="cin">{t('postJob.whoIAm.companyInfo.cin')}</Label>
                  <Input
                    id="cin"
                    value={jobData.cin}
                    onChange={(e) => setJobData(prev => ({ ...prev, cin: e.target.value }))}
                    placeholder={t('postJob.whoIAm.companyInfo.cinPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="gst">{t('postJob.whoIAm.companyInfo.gst')}</Label>
                  <Input
                    id="gst"
                    value={jobData.gst}
                    onChange={(e) => setJobData(prev => ({ ...prev, gst: e.target.value }))}
                    placeholder={t('postJob.whoIAm.companyInfo.gstPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="factoryLocation">{t('postJob.whoIAm.companyInfo.factoryLocation')} *</Label>
                  <div className="relative">
                    <Input
                      id="factoryLocation"
                      value={jobData.factoryLocation}
                      onChange={(e) => setJobData(prev => ({ ...prev, factoryLocation: e.target.value }))}
                      placeholder={t('postJob.whoIAm.companyInfo.factoryLocationPlaceholder')}
                    />
                    <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('postJob.whoIAm.roleInfo.title')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openRole">{t('postJob.whoIAm.roleInfo.openRole')} *</Label>
                  <Input
                    id="openRole"
                    value={jobData.openRole || selectedJobRole}
                    onChange={(e) => setJobData(prev => ({ ...prev, openRole: e.target.value }))}
                    placeholder={t('postJob.whoIAm.roleInfo.openRolePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfOpenings">{t('postJob.whoIAm.roleInfo.numberOfOpenings')} *</Label>
                  <Input
                    id="numberOfOpenings"
                    type="number"
                    value={jobData.numberOfOpenings || ''}
                    onChange={(e) => setJobData(prev => ({ ...prev, numberOfOpenings: parseInt(e.target.value) || 0 }))}
                    placeholder={t('postJob.whoIAm.roleInfo.numberOfOpeningsPlaceholder')}
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Point of Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('postJob.whoIAm.pocInfo.title')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pocName">{t('postJob.whoIAm.pocInfo.pocName')} *</Label>
                  <Input
                    id="pocName"
                    value={jobData.pocName}
                    onChange={(e) => setJobData(prev => ({ ...prev, pocName: e.target.value }))}
                    placeholder={t('postJob.whoIAm.pocInfo.pocNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="pocPhone">{t('postJob.whoIAm.pocInfo.pocPhone')} *</Label>
                  <Input
                    id="pocPhone"
                    type="tel"
                    value={jobData.pocPhone}
                    onChange={(e) => setJobData(prev => ({ ...prev, pocPhone: e.target.value }))}
                    placeholder={t('postJob.whoIAm.pocInfo.pocPhonePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="pocEmail">{t('postJob.whoIAm.pocInfo.pocEmail')} *</Label>
                  <Input
                    id="pocEmail"
                    type="email"
                    value={jobData.pocEmail}
                    onChange={(e) => setJobData(prev => ({ ...prev, pocEmail: e.target.value }))}
                    placeholder={t('postJob.whoIAm.pocInfo.pocEmailPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              {t('postJob.whoIAm.buttons.backToRoleSelection')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                {t('postJob.common.saveDraft')}
              </Button>
              <Button onClick={handleNext}>
                {t('postJob.whoIAm.buttons.next')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhoIAmJobStep;
