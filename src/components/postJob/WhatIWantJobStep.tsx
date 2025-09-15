import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Award } from 'lucide-react';
import { JobData } from '@/types/jobPost';

interface WhatIWantJobStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: string;
  selectedIndustry: string;
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
  onSubmit: () => void;
  onBack: () => void;
  onSaveDraft?: () => void;
  onPublish?: () => void;
}

const WhatIWantJobStep: React.FC<WhatIWantJobStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  selectedIndustry,
  jobData,
  setJobData,
  onSubmit,
  onBack,
  onSaveDraft,
  onPublish
}) => {
  const { t } = useTranslation('whatIWantJobStep');

  const handleSubmit = () => {
    if (!jobData.basicLiteracy || !jobData.commitmentMonths) {
      alert(t('postJob.whatIWant.alertFillFields'));
      return;
    }
    onSubmit();
  };

  const handlePublish = () => {
    if (!jobData.basicLiteracy || !jobData.commitmentMonths) {
      alert(t('postJob.whatIWant.alertPublishFields'));
      return;
    }
    if (onPublish) {
      onPublish();
    }
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>{t('postJob.whatIWant.title')}</span>
            {jobData.lastSavedAt && (
              <span className="text-xs text-muted-foreground">
                {t('postJob.whatIWant.lastSaved')} {new Date(jobData.lastSavedAt).toLocaleTimeString()}
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
            {/* Basic Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  {t('postJob.whatIWant.basicReq.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="basicLiteracy">{t('postJob.whatIWant.basicReq.literacy')}</Label>
                  <Select 
                    value={jobData.basicLiteracy} 
                    onValueChange={(value: '8th-pass' | '10th-pass' | '12th-pass' | 'graduate') => setJobData(prev => ({ ...prev, basicLiteracy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('postJob.whatIWant.basicReq.educationPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8th-pass">{t('postJob.whatIWant.basicReq.education.8th')}</SelectItem>
                      <SelectItem value="10th-pass">{t('postJob.whatIWant.basicReq.education.10th')}</SelectItem>
                      <SelectItem value="12th-pass">{t('postJob.whatIWant.basicReq.education.12th')}</SelectItem>
                      <SelectItem value="graduate">{t('postJob.whatIWant.basicReq.education.graduate')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="commitmentMonths">{t('postJob.whatIWant.basicReq.commitment')}</Label>
                  <Input
                    id="commitmentMonths"
                    type="number"
                    value={jobData.commitmentMonths || ''}
                    onChange={(e) => setJobData(prev => ({ ...prev, commitmentMonths: parseInt(e.target.value) || 0 }))}
                    placeholder="12"
                    min="1"
                    max="36"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('postJob.whatIWant.basicReq.commitmentHint')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Skill Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-600" />
                  {t('postJob.whatIWant.skillReq.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('postJob.whatIWant.skillReq.skillProof')}</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={jobData.skillProofRequired}
                      onCheckedChange={(checked) => setJobData(prev => ({ ...prev, skillProofRequired: checked }))}
                    />
                    <span className="text-sm">
                      {jobData.skillProofRequired ? t('postJob.common.required') : t('postJob.common.notRequired')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('postJob.whatIWant.skillReq.skillProofHint')}</p>
                </div>

                {jobData.skillProofRequired && (
                  <div className="space-y-4 pl-4 border-l-2 border-orange-200">
                    <div className="space-y-2">
                      <Label>{t('postJob.whatIWant.skillReq.speedControl')}</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={jobData.machineControlSpeed}
                          onCheckedChange={(checked) => setJobData(prev => ({ ...prev, machineControlSpeed: checked }))}
                        />
                        <span className="text-sm">
                          {jobData.machineControlSpeed ? t('postJob.common.required') : t('postJob.common.notRequired')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('postJob.whatIWant.skillReq.speedControlHint')}</p>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('postJob.whatIWant.skillReq.cornerHandling')}</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={jobData.machineControlCorners}
                          onCheckedChange={(checked) => setJobData(prev => ({ ...prev, machineControlCorners: checked }))}
                        />
                        <span className="text-sm">
                          {jobData.machineControlCorners ? t('postJob.common.required') : t('postJob.common.notRequired')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('postJob.whatIWant.skillReq.cornerHandlingHint')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Intent & Commitment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {t('postJob.whatIWant.intent.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('postJob.whatIWant.intent.proofOfIntent')}</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={jobData.proofOfIntent}
                      onCheckedChange={(checked) => setJobData(prev => ({ ...prev, proofOfIntent: checked }))}
                    />
                    <span className="text-sm">
                      {jobData.proofOfIntent ? t('postJob.common.required') : t('postJob.common.notRequired')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('postJob.whatIWant.intent.proofOfIntentHint')}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">{t('postJob.whatIWant.intent.verifyTitle')}</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {t('postJob.whatIWant.intent.verifyPoints.conditions')}</li>
                    <li>• {t('postJob.whatIWant.intent.verifyPoints.commitment')}</li>
                    <li>• {t('postJob.whatIWant.intent.verifyPoints.actions')}</li>
                    <li>• {t('postJob.whatIWant.intent.verifyPoints.interest')}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('postJob.whatIWant.summary.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>{t('postJob.whatIWant.summary.company')}</strong> {jobData.companyName}</div>
                  <div><strong>{t('postJob.whatIWant.summary.role')}</strong> {jobData.openRole}</div>
                  <div><strong>{t('postJob.whatIWant.summary.openings')}</strong> {jobData.numberOfOpenings}</div>
                  <div><strong>{t('postJob.whatIWant.summary.location')}</strong> {jobData.factoryLocation}</div>
                  <div><strong>{t('postJob.whatIWant.summary.salary')}</strong> ₹{jobData.inHandSalary}/month</div>
                  <div><strong>{t('postJob.whatIWant.summary.education')}</strong> {jobData.basicLiteracy}</div>
                  <div><strong>{t('postJob.whatIWant.summary.commitment')}</strong> {jobData.commitmentMonths} months</div>
                  <div><strong>{t('postJob.whatIWant.summary.skillProof')}</strong> {jobData.skillProofRequired ? t('postJob.common.required') : t('postJob.common.notRequired')}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              {t('postJob.whatIWant.back')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                {t('postJob.whatIWant.saveDraft')}
              </Button>
              <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
                {t('postJob.whatIWant.publish')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatIWantJobStep;
