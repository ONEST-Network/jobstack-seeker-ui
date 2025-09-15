import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, EmployerProfile } from '@/contexts/AuthContext';

interface EmployerProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employer?: EmployerProfile;
}

const EmployerProfileDialog: React.FC<EmployerProfileDialogProps> = ({ 
  isOpen, 
  onClose, 
  employer 
}) => {
  const { t } = useTranslation("employerprofiledialog");
  const { addEmployer, updateEmployer } = useAuth();
  const [formData, setFormData] = useState({
    name: employer?.name || '',
    address: employer?.address || '',
    gstNumber: employer?.gstNumber || '',
    contactPersonName: employer?.contactPersonName || '',
    contactEmail: employer?.contactEmail || '',
    contactPhone: employer?.contactPhone || '',
    website: employer?.website || '',
    description: employer?.description || '',
    isActive: employer?.isActive ?? true
  });

  const handleSubmit = () => {
    if (employer) {
      updateEmployer(employer.id, formData);
    } else {
      addEmployer(formData);
    }
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employer ? t('employerDialog.editTitle') : t('employerDialog.addTitle')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('employerDialog.detailsSection')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empName">{t('employerDialog.companyName')} *</Label>
                  <Input
                    id="empName"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={t('employerDialog.companyNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="gst">{t('employerDialog.gstNumber')}</Label>
                  <Input
                    id="gst"
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                    placeholder={t('employerDialog.gstPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">{t('employerDialog.address')} *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t('employerDialog.addressPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">{t('employerDialog.contactPerson')} *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPersonName}
                    onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                    placeholder={t('employerDialog.contactPersonPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="empEmail">{t('employerDialog.email')} *</Label>
                  <Input
                    id="empEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder={t('employerDialog.emailPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empPhone">{t('employerDialog.phone')} *</Label>
                  <Input
                    id="empPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder={t('employerDialog.phonePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="website">{t('employerDialog.website')}</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder={t('employerDialog.websitePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="empDescription">{t('employerDialog.description')}</Label>
                <Textarea
                  id="empDescription"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t('employerDialog.descriptionPlaceholder')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              {employer ? t('employerDialog.updateButton') : t('employerDialog.addButton')}
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

export default EmployerProfileDialog;
