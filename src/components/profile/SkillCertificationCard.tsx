import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';
import { SkillCertification } from '@/types/profile';
import CertificationListItem from './skills/CertificationListItem';
import AddCertificationForm from './skills/AddCertificationForm';

interface SkillCertificationCardProps {
  certifications: SkillCertification[];
  onChange: (certifications: SkillCertification[]) => void;
}

const SkillCertificationCard: React.FC<SkillCertificationCardProps> = ({
  certifications,
  onChange
}) => {
  const handleAddCertification = (newCertification: SkillCertification) => {
    onChange([...certifications, newCertification]);
  };

  const handleRemoveCertification = (id: string) => {
    onChange(certifications.filter(cert => cert.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-4 w-4" />
          Skill Certifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Certifications List */}
        {certifications.map((cert) => (
          <CertificationListItem
            key={cert.id}
            certification={cert}
            onRemove={handleRemoveCertification}
          />
        ))}

        {/* Add New Certification Form */}
        <AddCertificationForm onAdd={handleAddCertification} />
      </CardContent>
    </Card>
  );
};

export default SkillCertificationCard;
