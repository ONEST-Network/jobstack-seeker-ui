import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth, OrganizationProfile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { useTranslation } from 'react-i18next';

interface OrganizationProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrganizationProfileDialog: React.FC<OrganizationProfileDialogProps> = ({ isOpen, onClose }) => {
  const { updateProfile, refreshProfileData } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('organizationprofiledialog'); 

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

  const handleSave = async () => {
    if (!profile.name || !profile.contactPersonName || !profile.contactEmail) {
      toast({
        title: t('errors.title'),
        description: t('errors.requiredFields'),
        variant: 'destructive',
      });
      return;
    }

    updateProfile(profile);

    try {
      await refreshProfileData();
    } catch (error) {
      console.log('Error refreshing profile data after organization profile save:', error);
    }

    onClose();
    toast({
      title: t('success.title'),
      description: t('success.description'),
    });

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleLogoUpload = (file: string | File | null) => {
    if (file && typeof file === 'string') {
      setProfile({ ...profile, logo: file });
      toast({
        title: t('logo.uploadedTitle'),
        description: t('logo.uploadedDesc'),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Organization Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('sections.organizationDetails')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="orgName">{t('fields.orgName')} *</Label>
                  <Input
                    id="orgName"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder={t('placeholders.orgName')}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">{t('fields.address')} *</Label>
                  <Textarea
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder={t('placeholders.address')}
                  />
                </div>

                <div>
                  <Label htmlFor="gstNumber">{t('fields.gstNumber')}</Label>
                  <Input
                    id="gstNumber"
                    value={profile.gstNumber}
                    onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                    placeholder={t('placeholders.gstNumber')}
                  />
                </div>

                <div>
                  <Label htmlFor="website">{t('fields.website')}</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder={t('placeholders.website')}
                  />
                </div>
              </div>

              <div>
                <Label>{t('fields.logo')}</Label>
                <FileUploadField
                  label=""
                  description={t('placeholders.logoDesc')}
                  accept="image/png,image/jpeg,image/jpg"
                  fileType="image"
                  value={profile.logo}
                  onChange={handleLogoUpload}
                  usePresignedUrl={true}
                  objectKeyPrefix="organization"
                />
              </div>

              <div>
                <Label htmlFor="description">{t('fields.description')}</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder={t('placeholders.description')}
                  rows={3}
                />
              </div>
            </div>

            {/* Contact Person Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('sections.contactDetails')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="contactName">{t('fields.contactName')} *</Label>
                  <Input
                    id="contactName"
                    value={profile.contactPersonName}
                    onChange={(e) => setProfile({ ...profile, contactPersonName: e.target.value })}
                    placeholder={t('placeholders.contactName')}
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">{t('fields.contactEmail')} *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profile.contactEmail}
                    onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                    placeholder={t('placeholders.contactEmail')}
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">{t('fields.contactPhone')} *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={profile.contactPhone}
                    onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                    placeholder={t('placeholders.contactPhone')}
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  {t('terms')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {t('actions.create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationProfileDialog;
