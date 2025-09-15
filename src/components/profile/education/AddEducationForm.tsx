import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Plus } from 'lucide-react';
import { Education } from '@/types/profile';
import QRCodeScannerDialog from '../QRCodeScannerDialog';
import { useTranslation } from 'react-i18next';

interface AddEducationFormProps {
  onAdd: (education: Education) => void;
}

const AddEducationForm: React.FC<AddEducationFormProps> = ({ onAdd }) => {
  const { t } = useTranslation('addeducationforms'); 
  const [showScanner, setShowScanner] = useState(false);
  const [newEducation, setNewEducation] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: new Date().getFullYear(),
    percentage: undefined,
    isVerified: false
  });

  const handleAddEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      const educationEntry: Education = {
        id: Date.now().toString(),
        institution: newEducation.institution || '',
        degree: newEducation.degree || '',
        fieldOfStudy: newEducation.fieldOfStudy || '',
        startYear: newEducation.startYear || new Date().getFullYear(),
        endYear: newEducation.endYear,
        percentage: newEducation.percentage,
        grade: newEducation.grade,
        isVerified: newEducation.isVerified || false,
        certificateUrl: newEducation.certificateUrl,
        qrCodeData: newEducation.qrCodeData
      };

      onAdd(educationEntry);
      setNewEducation({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startYear: new Date().getFullYear(),
        percentage: undefined,
        isVerified: false
      });
    }
  };

  const handleQRScanComplete = (data: any) => {
    setNewEducation({
      ...newEducation,
      ...data,
      id: Date.now().toString()
    });
  };

  return (
    <>
      <div className="space-y-4 p-4 border-2 border-dashed border-gray-200 rounded-lg">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">{t('education.addTitle')}</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScanner(true)}
          >
            <QrCode className="h-4 w-4 mr-1" />
            {t('education.scanCertificate')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="institution">{t('education.institution')} *</Label>
            <Input
              id="institution"
              value={newEducation.institution || ''}
              onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              placeholder={t('education.institutionPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="degree">{t('education.degree')} *</Label>
            <Select
              value={newEducation.degree || ''}
              onValueChange={(value) => setNewEducation({ ...newEducation, degree: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('education.degreePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="below-10th">{t('education.degreeOptions.below10th')}</SelectItem>
                <SelectItem value="10th">{t('education.degreeOptions.10th')}</SelectItem>
                <SelectItem value="12th">{t('education.degreeOptions.12th')}</SelectItem>
                <SelectItem value="diploma">{t('education.degreeOptions.diploma')}</SelectItem>
                <SelectItem value="bachelor">{t('education.degreeOptions.bachelor')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fieldOfStudy">{t('education.fieldOfStudy')}</Label>
            <Input
              id="fieldOfStudy"
              value={newEducation.fieldOfStudy || ''}
              onChange={(e) => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })}
              placeholder={t('education.fieldOfStudyPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="percentage">{t('education.percentage')}</Label>
            <Input
              id="percentage"
              type="number"
              value={newEducation.percentage || ''}
              onChange={(e) => setNewEducation({ ...newEducation, percentage: parseInt(e.target.value) })}
              placeholder={t('education.percentagePlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="startDate">{t('education.startDate')}</Label>
            <Input
              id="startDate"
              type="month"
              value={newEducation.startDate || ''}
              onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="endDate">{t('education.endDate')}</Label>
            <Input
              id="endDate"
              type="month"
              value={newEducation.endDate || ''}
              onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
              placeholder={t('education.endDatePlaceholder')}
            />
          </div>
        </div>

        <Button onClick={handleAddEducation} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t('education.addButton')}
        </Button>
      </div>

      <QRCodeScannerDialog
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanComplete={handleQRScanComplete}
        type="education"
      />
    </>
  );
};

export default AddEducationForm;
