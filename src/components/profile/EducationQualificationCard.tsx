import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { Education } from '@/types/profile';
import EducationListItem from './education/EducationListItem';
import AddEducationForm from './education/AddEducationForm';
import { useTranslation } from 'react-i18next';

interface EducationQualificationCardProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

const EducationQualificationCard: React.FC<EducationQualificationCardProps> = ({
  education,
  onChange
}) => {
  const { t } = useTranslation('educationqualificationcard');

  const handleAddEducation = (newEducation: Education) => {
    onChange([...education, newEducation]);
  };

  const handleRemoveEducation = (id: string) => {
    onChange(education.filter(edu => edu.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Education List */}
        {education.map((edu) => (
          <EducationListItem
            key={edu.id}
            education={edu}
            onRemove={handleRemoveEducation}
          />
        ))}

        {/* Add New Education Form */}
        <AddEducationForm onAdd={handleAddEducation} />
      </CardContent>
    </Card>
  );
};

export default EducationQualificationCard;
