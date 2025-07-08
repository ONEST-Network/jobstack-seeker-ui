
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { useProfileForm } from '../ProfileFormProvider';

const ProfileSummaryStep: React.FC = () => {
  const { profile } = useProfileForm();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Profile Summary</h3>
      
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <h4 className="font-medium flex items-center gap-2">
              {profile.name}
              {profile.isNameVerified && <Shield className="h-4 w-4 text-green-600" />}
            </h4>
            {profile.age && <p className="text-sm text-muted-foreground">Age: {profile.age}</p>}
          </div>

          {profile.interestedRole && (
            <div>
              <p className="text-sm">
                <strong>Interested Role:</strong> {profile.interestedRole}
              </p>
              <p className="text-sm">
                <strong>Industry:</strong> {profile.interestedIndustry}
              </p>
            </div>
          )}
          
          <div>
            <p className="text-sm">
              <strong>Current:</strong> {profile.currentLocation}
            </p>
            <p className="text-sm">
              <strong>Preferred:</strong> {profile.desiredLocation}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Experience ({profile.experience.length})</p>
            {profile.experience.slice(0, 2).map((exp) => (
              <p key={exp.id} className="text-xs text-muted-foreground">
                {exp.designation} at {exp.company}
              </p>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium">Skills ({profile.skills.length})</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {profile.skills.slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSummaryStep;
