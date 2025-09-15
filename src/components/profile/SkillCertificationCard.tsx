import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';
import { SkillCertification } from '@/types/profile';
import CertificationListItem from './skills/CertificationListItem';
import AddCertificationForm from './skills/AddCertificationForm';
import { useTranslation } from 'react-i18next';

interface SkillCertificationCardProps {
  certifications: SkillCertification[];
  onChange: (certifications: SkillCertification[]) => void;
}

const SkillCertificationCard: React.FC<SkillCertificationCardProps> = ({
  certifications,
  onChange,
}) => {
  const { t } = useTranslation('skillcertificatecard'); 

  const handleAddCertification = (newCertification: SkillCertification) => {
    onChange([...certifications, newCertification]);
  };

  const handleRemoveCertification = (id: string) => {
    onChange(certifications.filter((cert) => cert.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-4 w-4" />
          {t('certifications.title')} {/* 🔑 from profile.json */}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Certifications */}
        {certifications.map((cert) => (
          <CertificationListItem
            key={cert.id}
            certification={cert}
            onRemove={handleRemoveCertification}
          />
        ))}

        {/* Add Certification Form */}
        <AddCertificationForm onAdd={handleAddCertification} />
      </CardContent>
    </Card>
  );
};

export default SkillCertificationCard;
