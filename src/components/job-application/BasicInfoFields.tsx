import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BasicInfoFieldsProps {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({ formData, setFormData }) => {
  const { t } = useTranslation("basicinfo");

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <Label htmlFor="name" className="text-base mb-2 block">
          {t('basicInfo.name.label')}
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="bg-green-50 h-12 text-base"
          placeholder={t('basicInfo.name.placeholder')}
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-base mb-2 block">
          {t('basicInfo.email.label')}
        </Label>
        <Input
          id="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="bg-green-50 h-12 text-base"
          placeholder={t('basicInfo.email.placeholder')}
        />
      </div>

      <div>
        <Label htmlFor="phone" className="text-base mb-2 block">
          {t('basicInfo.phone.label')}
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="bg-green-50 h-12 text-base"
          placeholder={t('basicInfo.phone.placeholder')}
        />
      </div>
    </div>
  );
};

export default BasicInfoFields;
