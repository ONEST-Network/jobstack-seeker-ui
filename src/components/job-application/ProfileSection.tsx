
import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CandidateSelector from '@/components/candidates/CandidateSelector';

interface ProfileSectionProps {
  formData: { name: string };
  showCandidateDialog: boolean;
  setShowCandidateDialog: (show: boolean) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ 
  formData, 
  showCandidateDialog, 
  setShowCandidateDialog 
}) => {
  const { user } = useAuth();

  if (user?.role !== 'individual') return null;

  return (
    <div className="mb-6">
      <Label className="mb-3 block text-base">Applying with Profile:</Label>
      {user.managedCandidates.length > 0 ? (
        <CandidateSelector onAddCandidate={() => setShowCandidateDialog(true)} />
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-green-800 text-base">
                  {formData.name || 'Your Profile'}
                </div>
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Verified Profile
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileSection;
