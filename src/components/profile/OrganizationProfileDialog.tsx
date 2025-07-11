
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Building } from 'lucide-react';
import { useAuth, OrganizationProfile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FileUploadField } from '@/components/ui/file-upload-field';

interface OrganizationProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrganizationProfileDialog: React.FC<OrganizationProfileDialogProps> = ({ isOpen, onClose }) => {
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<OrganizationProfile>({
    name: '',
    address: '',
    gstNumber: '',
    logo: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: ''
  });

  const handleSave = () => {
    if (!profile.name || !profile.contactPersonName || !profile.contactEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    updateProfile(profile);
    onClose();
    toast({
      title: "Organization Profile Created",
      description: "Your organization profile has been successfully created."
    });
  };

  const handleLogoUpload = (file: string | File | null) => {
    if (file && typeof file === 'string') {
      setProfile({ ...profile, logo: file });
      toast({
        title: "Logo Uploaded",
        description: "Your organization logo has been uploaded."
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle>Create Organization Profile</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Organization Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Organization Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="orgName">Organization Name *</Label>
                  <Input
                    id="orgName"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Enter organization name"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Enter complete address"
                  />
                </div>

                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={profile.gstNumber}
                    onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                    placeholder="Enter GST number"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>

              <div>
                <Label>Organization Logo</Label>
                <FileUploadField
                  label=""
                  description="Upload your organization logo (PNG, JPG, max 5MB)"
                  accept="image/png,image/jpeg,image/jpg"
                  fileType="image"
                  value={profile.logo}
                  onChange={handleLogoUpload}
                  usePresignedUrl={true}
                  objectKeyPrefix="organization"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Describe your organization"
                  rows={3}
                />
              </div>
            </div>

            {/* Contact Person Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Person Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="contactName">Contact Person Name *</Label>
                  <Input
                    id="contactName"
                    value={profile.contactPersonName}
                    onChange={(e) => setProfile({ ...profile, contactPersonName: e.target.value })}
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profile.contactEmail}
                    onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={profile.contactPhone}
                    onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  By creating an organization profile, you agree to the additional terms and conditions 
                  applicable to organizations for posting jobs and issuing certificates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Create Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationProfileDialog;
