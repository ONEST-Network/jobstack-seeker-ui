import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, Upload, CheckCircle } from 'lucide-react';
import { useAuth, Certificate, UserProfile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface DocumentImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const DocumentImportDialog: React.FC<DocumentImportDialogProps> = ({ 
  isOpen, 
  onClose, 
  onImportComplete 
}) => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation("documentimportdialog"); 
  const [importing, setImporting] = useState(false);

  // Type guard to check if profile is UserProfile
  const isUserProfile = (profile: any): profile is UserProfile => {
    return profile && user?.role === 'individual';
  };

  const availableDocuments = [
    { name: t('documents.aadhaar'), verified: true, trustPoints: 2 },
    { name: t('documents.pan'), verified: true, trustPoints: 1 },
    { name: t('documents.drivingLicense'), verified: false, trustPoints: 1 },
    { name: t('documents.voterId'), verified: false, trustPoints: 1 },
    { name: t('documents.passport'), verified: false, trustPoints: 2 }
  ];

  const handleDigiLockerImport = async () => {
    if (!user?.profile || !isUserProfile(user.profile)) return;

    setImporting(true);
    
    // Mock import process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newCertificates: Certificate[] = [
      {
        id: 'aadhaar-' + Date.now(),
        name: t('certificates.aadhaarVerification'),
        issuer: t('certificates.government'),
        issueDate: new Date().toISOString(),
        isVerified: true
      },
      {
        id: 'pan-' + Date.now(),
        name: t('certificates.panVerification'),
        issuer: t('certificates.incomeTax'),
        issueDate: new Date().toISOString(),
        isVerified: true
      }
    ];

    const updatedProfile: UserProfile = {
      ...user.profile,
      isNameVerified: true,
      isAgeVerified: true,
      certificates: [...(user.profile.certificates || []), ...newCertificates]
    };

    updateProfile(updatedProfile);

    setImporting(false);
    toast({
      title: t('toasts.importSuccess.title'),
      description: t('toasts.importSuccess.description')
    });
    onImportComplete();
  };

  const handleManualUpload = () => {
    toast({
      title: t('toasts.uploadFeature.title'),
      description: t('toasts.uploadFeature.description')
    });
  };

  // Only allow document import for individual users
  if (!user || user.role !== 'individual') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dialogs.notAvailable.title')}</DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <p>{t('dialogs.notAvailable.message')}</p>
            <Button onClick={onClose} className="mt-4">{t('common.close')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            {t('dialogs.trustScore.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t('dialogs.trustScore.description')}
          </div>

          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium mb-2">{t('dialogs.digilocker.title')}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {t('dialogs.digilocker.description')}
              </p>
              <Button 
                onClick={handleDigiLockerImport}
                disabled={importing}
                className="w-full"
              >
                {importing ? t('dialogs.digilocker.importing') : t('dialogs.digilocker.button')}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('dialogs.availableDocs.title')}</h4>
            {availableDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{doc.name}</span>
                  {doc.verified && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <Badge variant="secondary" className="text-xs">
                  +{doc.trustPoints} {t('common.points')}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleManualUpload} className="flex-1">
              <Upload className="h-4 w-4 mr-1" />
              {t('common.upload')}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t('common.later')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentImportDialog;
