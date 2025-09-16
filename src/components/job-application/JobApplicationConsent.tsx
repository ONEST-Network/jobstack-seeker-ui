
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CandidateSelector from '@/components/candidates/CandidateSelector';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';

interface JobApplicationConsentProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  showCandidateDialog: boolean;
  setShowCandidateDialog: (show: boolean) => void;
}

const JobApplicationConsent: React.FC<JobApplicationConsentProps> = ({
  isOpen,
  onClose,
  onAccept,
  formData,
  showCandidateDialog,
  setShowCandidateDialog
}) => {
  const { user, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Auto-fill Application Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {user?.role === 'individual' && (
              <div className="space-y-2">
                <Label>Apply with Profile:</Label>
                {user.managedCandidates.length > 0 ? (
                  <CandidateSelector onAddCandidate={() => setShowCandidateDialog(true)} />
                ) : (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-green-800">
                            {formData.name || 'Your Profile'}
                          </div>
                          <div className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Information to be auto-filled:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">✓</Badge>
                    <span>Name: {formData.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">✓</Badge>
                    <span>Email: {formData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">✓</Badge>
                    <span>Phone: {formData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">✓</Badge>
                    <span>Documents: AADHAAR, PAN</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedCandidate && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Since you are applying with another profile ({selectedCandidate.name}), 
                  we will verify your identity with mobile OTP before submitting the application.
                </p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                By proceeding, you consent to auto-fill the application with your verified profile information. 
                You can review and edit before submitting.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={onAccept} className="flex-1 text-base py-6">
                Accept & Continue
              </Button>
              <Button variant="outline" onClick={onClose} className="text-base py-6">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CandidateProfileDialog
        isOpen={showCandidateDialog}
        onClose={() => setShowCandidateDialog(false)}
        mode="add"
      />
    </>
  );
};

export default JobApplicationConsent;
