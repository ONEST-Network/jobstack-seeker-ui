import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrgData } from '@/types/jobPost';

interface OrgProfileStepProps {
  isOpen: boolean;
  onClose: () => void;
  orgData: OrgData;
  setOrgData: React.Dispatch<React.SetStateAction<OrgData>>;
  onSubmit: () => void;
}

const OrgProfileStep: React.FC<OrgProfileStepProps> = ({
  isOpen,
  onClose,
  orgData,
  setOrgData,
  onSubmit
}) => {
  const { t } = useTranslation('orgProfileStep');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle>{t('orgProfileStep.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('orgProfileStep.details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orgName">{t('orgProfileStep.orgName')}</Label>
                    <Input
                      id="orgName"
                      value={orgData.name}
                      onChange={(e) => setOrgData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('orgProfileStep.placeholders.orgName') || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gst">{t('orgProfileStep.gst')}</Label>
                    <Input
                      id="gst"
                      value={orgData.gst}
                      onChange={(e) => setOrgData(prev => ({ ...prev, gst: e.target.value }))}
                      placeholder={t('orgProfileStep.placeholders.gst') || ''}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">{t('orgProfileStep.address')}</Label>
                  <Textarea
                    id="address"
                    value={orgData.address}
                    onChange={(e) => setOrgData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={t('orgProfileStep.placeholders.address') || ''}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPerson">{t('orgProfileStep.contactPerson')}</Label>
                    <Input
                      id="contactPerson"
                      value={orgData.contactPerson}
                      onChange={(e) => setOrgData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder={t('orgProfileStep.placeholders.contactPerson') || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgEmail">{t('orgProfileStep.email')}</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={orgData.email}
                      onChange={(e) => setOrgData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={t('orgProfileStep.placeholders.email') || ''}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orgPhone">{t('orgProfileStep.phone')}</Label>
                    <Input
                      id="orgPhone"
                      value={orgData.phone}
                      onChange={(e) => setOrgData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder={t('orgProfileStep.placeholders.phone') || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">{t('orgProfileStep.website')}</Label>
                    <Input
                      id="website"
                      value={orgData.website}
                      onChange={(e) => setOrgData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder={t('orgProfileStep.placeholders.website') || ''}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="orgDescription">{t('orgProfileStep.description')}</Label>
                  <Textarea
                    id="orgDescription"
                    value={orgData.description}
                    onChange={(e) => setOrgData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('orgProfileStep.placeholders.description') || ''}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex gap-2">
            <Button onClick={onSubmit} className="flex-1">
              {t('orgProfileStep.saveAndContinue')}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrgProfileStep;
