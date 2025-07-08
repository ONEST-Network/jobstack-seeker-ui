import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Shield } from 'lucide-react';
import { Education } from '@/types/profile';

interface EducationListItemProps {
  education: Education;
  onRemove: (id: string) => void;
}

const EducationListItem: React.FC<EducationListItemProps> = ({
  education,
  onRemove
}) => {
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-medium">{education.degree} in {education.fieldOfStudy}</h4>
            <p className="text-sm text-muted-foreground">{education.institution}</p>
            <p className="text-xs text-muted-foreground">
              {education.startYear} - {education.endYear || 'Present'}
              {education.percentage && ` • ${education.percentage}%`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {education.isVerified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(education.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EducationListItem;