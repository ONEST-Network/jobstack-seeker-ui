import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Shield } from 'lucide-react';
import { SkillCertification } from '@/types/profile';

interface CertificationListItemProps {
  certification: SkillCertification;
  onRemove: (id: string) => void;
}

const getSkillLevelColor = (level: string) => {
  switch (level) {
    case 'beginner': return 'bg-blue-100 text-blue-800';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800';
    case 'advanced': return 'bg-orange-100 text-orange-800';
    case 'expert': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const CertificationListItem: React.FC<CertificationListItemProps> = ({
  certification,
  onRemove
}) => {
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-medium">{certification.name}</h4>
            <p className="text-sm text-muted-foreground">{certification.issuer}</p>
            <p className="text-xs text-muted-foreground">
              Issued: {new Date(certification.issueDate).toLocaleDateString()}
              {certification.expiryDate && ` • Expires: ${new Date(certification.expiryDate).toLocaleDateString()}`}
            </p>
            {certification.credentialId && (
              <p className="text-xs text-muted-foreground">ID: {certification.credentialId}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getSkillLevelColor(certification.skillLevel)}>
              {certification.skillLevel}
            </Badge>
            {certification.isVerified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(certification.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationListItem;