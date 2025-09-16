
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2, User, MapPin, Briefcase, Calendar } from 'lucide-react';
import { CandidateProfile } from '@/contexts/AuthContext';

interface CandidateCardProps {
  candidate: CandidateProfile;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDefault?: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  isDefault = false
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getExperienceLevel = () => {
    const totalExperience = candidate.experience?.length || 0;
    if (totalExperience === 0) return 'Fresher';
    if (totalExperience <= 2) return 'Entry Level';
    if (totalExperience <= 5) return 'Mid Level';
    return 'Senior Level';
  };

  return (
    <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.profileImage} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{candidate.name}</CardTitle>
              {candidate.nickname && (
                <p className="text-sm text-muted-foreground">{candidate.nickname}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSelected && <Badge variant="default" className="text-xs">Active</Badge>}
            {isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          {candidate.interestedRole && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{candidate.interestedRole}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{candidate.currentLocation}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{getExperienceLevel()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Created {new Date(candidate.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {candidate.skills && candidate.skills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {candidate.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={onSelect}
            className="flex-1"
          >
            {isSelected ? 'Selected' : 'Select'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          {!isDefault && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateCard;
