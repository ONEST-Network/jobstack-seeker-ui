import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Plus } from 'lucide-react';
import { SkillCertification } from '@/types/profile';
import QRCodeScannerDialog from '../QRCodeScannerDialog';

interface AddCertificationFormProps {
  onAdd: (certification: SkillCertification) => void;
}

const AddCertificationForm: React.FC<AddCertificationFormProps> = ({ onAdd }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [newCertification, setNewCertification] = useState<Partial<SkillCertification>>({
    name: '',
    issuer: '',
    issueDate: '',
    skillLevel: 'beginner',
    isVerified: false
  });

  const handleAddCertification = () => {
    if (newCertification.name && newCertification.issuer) {
      const certification: SkillCertification = {
        id: Date.now().toString(),
        name: newCertification.name || '',
        issuer: newCertification.issuer || '',
        issueDate: newCertification.issueDate || '',
        expiryDate: newCertification.expiryDate,
        credentialId: newCertification.credentialId,
        skillLevel: newCertification.skillLevel || 'beginner',
        isVerified: newCertification.isVerified || false,
        certificateUrl: newCertification.certificateUrl,
        qrCodeData: newCertification.qrCodeData
      };
      
      onAdd(certification);
      setNewCertification({
        name: '',
        issuer: '',
        issueDate: '',
        skillLevel: 'beginner',
        isVerified: false
      });
    }
  };

  const handleQRScanComplete = (data: any) => {
    setNewCertification({
      ...newCertification,
      ...data,
      id: Date.now().toString()
    });
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,.pdf,.doc,.docx';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files).slice(0, 5);
        console.log('Selected files:', fileArray);
        // Handle file uploads here
      }
    };
    input.click();
  };

  return (
    <>
        <div className="space-y-4 p-4 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h4 className="font-medium">Add Skill Certification</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScanner(true)}
                className="w-full sm:w-auto"
              >
                <QrCode className="h-4 w-4 mr-1" />
                Scan QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFileUpload}
                className="w-full sm:w-auto"
              >
                Upload Files
              </Button>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="certName">Certification Name *</Label>
            <Input
              id="certName"
              value={newCertification.name || ''}
              onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
              placeholder="e.g., Industrial Sewing Machine Operation"
            />
          </div>

          <div>
            <Label htmlFor="issuer">Issuing Organization *</Label>
            <Input
              id="issuer"
              value={newCertification.issuer || ''}
              onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
              placeholder="e.g., NSDC, NIFT"
            />
          </div>

          <div>
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={newCertification.issueDate || ''}
              onChange={(e) => setNewCertification({ ...newCertification, issueDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              value={newCertification.expiryDate || ''}
              onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="credentialId">Credential ID</Label>
            <Input
              id="credentialId"
              value={newCertification.credentialId || ''}
              onChange={(e) => setNewCertification({ ...newCertification, credentialId: e.target.value })}
              placeholder="Certificate ID/Number"
            />
          </div>

          <div>
            <Label htmlFor="skillLevel">Skill Level</Label>
            <Select
              value={newCertification.skillLevel || 'beginner'}
              onValueChange={(value: any) => setNewCertification({ ...newCertification, skillLevel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleAddCertification} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Certification
        </Button>
      </div>

      <QRCodeScannerDialog
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanComplete={handleQRScanComplete}
        type="skill"
      />
    </>
  );
};

export default AddCertificationForm;