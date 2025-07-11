
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FileUploadField } from '@/components/ui/file-upload-field';

interface OrganizationProfile {
  name: string;
  address: string;
  gstNumber: string;
  logo: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  description: string;
}

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

  const handleLogoChange = (logoUrl: string | null) => {
    setProfile({ ...profile, logo: logoUrl || '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Organization Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Organization Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Enter organization name"
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
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Enter organization address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={handleLogoChange}
                usePresignedUrl={true}
                objectKeyPrefix="provider"
                className="mt-2"
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
            <h3 className="text-lg font-semibold">Contact Person Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                <Input
                  id="contactPersonName"
                  value={profile.contactPersonName}
                  onChange={(e) => setProfile({ ...profile, contactPersonName: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <Input
                  id="contactPhone"
                  value={profile.contactPhone}
                  onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                  placeholder="Enter contact phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={profile.contactEmail}
                onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                placeholder="Enter contact email address"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationProfileDialog;
