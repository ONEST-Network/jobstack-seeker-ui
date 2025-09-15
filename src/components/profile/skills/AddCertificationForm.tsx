import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Plus } from 'lucide-react';
import { SkillCertification } from '@/types/profile';
import QRCodeScannerDialog from '../QRCodeScannerDialog';
import { useTranslation } from 'react-i18next';

interface AddCertificationFormProps {
  onAdd: (certification: SkillCertification) => void;
}

const AddCertificationForm: React.FC<AddCertificationFormProps> = ({ onAdd }) => {
  const { t } = useTranslation('addcertificationform'); 

  const [showScanner, setShowScanner] = useState(false);
  const [newCertification, setNewCertification] = useState<Partial<SkillCertification>>({
    name: '',
    issuer: '',
    issueDate: '',
    skillLevel: 'beginner',
    isVerified: false
  });

  const handleAddCertification = () => {
    if (newCertification.name && newCertification.issuer) {
      const certification: SkillCertification = {
        id: Date.now().toString(),
        name: newCertification.name || '',
        issuer: newCertification.issuer || '',
        issueDate: newCertification.issueDate || '',
        expiryDate: newCertification.expiryDate,
        credentialId: newCertification.credentialId,
        skillLevel: newCertification.skillLevel || 'beginner',
        isVerified: newCertification.isVerified || false,
        certificateUrl: newCertification.certificateUrl,
        qrCodeData: newCertification.qrCodeData
      };
      
      onAdd(certification);
      setNewCertification({
        name: '',
        issuer: '',
        issueDate: '',
        skillLevel: 'beginner',
        isVerified: false
      });
    }
  };

  const handleQRScanComplete = (data: any) => {
    setNewCertification({
      ...newCertification,
      ...data,
      id: Date.now().toString()
    });
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,.pdf,.doc,.docx';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files).slice(0, 5);
        console.log('Selected files:', fileArray);
      }
    };
    input.click();
  };

  return (
    <>
      <div className="space-y-4 p-4 border-2 border-dashed border-gray-200 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h4 className="font-medium">{t('certification.addTitle')}</h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScanner(true)}
              className="w-full sm:w-auto"
            >
              <QrCode className="h-4 w-4 mr-1" />
              {t('certification.scanQr')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFileUpload}
              className="w-full sm:w-auto"
            >
              {t('certification.upload')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="certName">{t('certification.nameLabel')}</Label>
            <Input
              id="certName"
              value={newCertification.name || ''}
              onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
              placeholder={t('certification.namePlaceholder') || ''}
            />
          </div>

          <div>
            <Label htmlFor="issuer">{t('certification.issuerLabel')}</Label>
            <Input
              id="issuer"
              value={newCertification.issuer || ''}
              onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
              placeholder={t('certification.issuerPlaceholder') || ''}
            />
          </div>

          <div>
            <Label htmlFor="issueDate">{t('certification.issueDate')}</Label>
            <Input
              id="issueDate"
              type="date"
              value={newCertification.issueDate || ''}
              onChange={(e) => setNewCertification({ ...newCertification, issueDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">{t('certification.expiryDate')}</Label>
            <Input
              id="expiryDate"
              type="date"
              value={newCertification.expiryDate || ''}
              onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="credentialId">{t('certification.credentialId')}</Label>
            <Input
              id="credentialId"
              value={newCertification.credentialId || ''}
              onChange={(e) => setNewCertification({ ...newCertification, credentialId: e.target.value })}
              placeholder={t('certification.credentialIdPlaceholder') || ''}
            />
          </div>

          <div>
            <Label htmlFor="skillLevel">{t('certification.skillLevel')}</Label>
            <Select
              value={newCertification.skillLevel || 'beginner'}
              onValueChange={(value: any) => setNewCertification({ ...newCertification, skillLevel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('certification.skillLevelPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">{t('certification.skillLevels.beginner')}</SelectItem>
                <SelectItem value="intermediate">{t('certification.skillLevels.intermediate')}</SelectItem>
                <SelectItem value="advanced">{t('certification.skillLevels.advanced')}</SelectItem>
                <SelectItem value="expert">{t('certification.skillLevels.expert')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleAddCertification} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t('certification.addButton')}
        </Button>
      </div>

      <QRCodeScannerDialog
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanComplete={handleQRScanComplete}
        type="skill"
      />
    </>
  );
};

export default AddCertificationForm;
