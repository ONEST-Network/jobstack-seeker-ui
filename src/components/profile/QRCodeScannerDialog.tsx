
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Camera, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: any) => void;
  type: 'education' | 'skill' | 'experience';
}

const QRCodeScannerDialog: React.FC<QRCodeScannerDialogProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  type
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const handleScan = () => {
    setIsScanning(true);
    // Simulate QR code scanning
    setTimeout(() => {
      const mockData = {
        education: {
          institution: 'ABC Technical Institute',
          degree: 'Diploma',
          fieldOfStudy: 'Electrical Engineering',
          startYear: 2018,
          endYear: 2020,
          percentage: 85,
          isVerified: true
        },
        skill: {
          name: 'Industrial Sewing Machine Operation',
          issuer: 'National Skill Development Corporation',
          issueDate: '2023-06-15',
          credentialId: 'NSDC-123456',
          skillLevel: 'intermediate',
          isVerified: true
        },
        experience: {
          company: 'XYZ Garments Ltd',
          position: 'Machine Operator',
          location: 'Mumbai, Maharashtra',
          startDate: '2020-07-01',
          endDate: '2023-05-31',
          description: 'Operated industrial sewing machines for garment production',
          isVerified: true
        }
      };

      onScanComplete(mockData[type]);
      setIsScanning(false);
      toast({
        title: "Certificate Scanned",
        description: `${type} certificate imported successfully!`
      });
      onClose();
    }, 2000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate file processing
      toast({
        title: "File Uploaded",
        description: "Certificate uploaded and processing..."
      });
      handleScan();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import {type} Certificate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Point your camera at the QR code on your certificate
              </p>
              <Button 
                onClick={handleScan} 
                disabled={isScanning}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                {isScanning ? 'Scanning...' : 'Start Camera'}
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Or upload certificate image</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </span>
              </Button>
            </label>
          </div>

          {isScanning && (
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="animate-pulse">
                <Camera className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-blue-800">Scanning certificate...</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeScannerDialog;
