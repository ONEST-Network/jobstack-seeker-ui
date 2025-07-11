import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Camera, Upload } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface QRCodeScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: string) => void;
  type: 'education' | 'skill' | 'experience';
}

const QRCodeScannerDialog: React.FC<QRCodeScannerDialogProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  type
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "html5qr-code-full-region";

  const startCameraScan = () => {
    setIsScanning(true);
  };

  const parseResultToVc = async (url: string, fromScanner: boolean) => {
    const pattern = /^https:\/\/dway\.io\/jobs\/([0-9a-fA-F-]{36})$/;
    const match = url.match(pattern);

    if (match) {
      const uuid = match[1];
      const vcUrl = `https://verify.jobs.onest.dhiway.net/jobs/${uuid}.json`
      // Do whatever you want with uuid here:
      onScanComplete(vcUrl);
    } else {
      console.log('URL does not match expected pattern.');
    }

    if (fromScanner) {
      onClose();
    } else {
      stopScanning();
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        await scannerRef.current.stop();
      }
      scannerRef.current.clear();
    }
    setIsScanning(false);
    onClose();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      try {
        const result = await scannerRef.current.scanFile(file, true);
        await parseResultToVc(result, false)
      } catch (err) {
        console.error("Scan failed", err);
      }
    }
  };

  useEffect(() => {
    const runScanner = async () => {
      if (isScanning) {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(scannerId);
        }

        try {
          await scannerRef.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            async (decodedText) => {
              await parseResultToVc(decodedText, true)
            },
            (_errorMessage) => {
              /* console.warn("QR Scan Error:", errorMessage); */
            }
          );
        } catch (err) {
          console.error("Unable to start scanning", err);
          stopScanning();
        }
      }
    };

    runScanner();

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          console.log('scanner error: ', err)
        }
      }
    };
  }, [isScanning]);

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import {type} Certificate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            < div id={scannerId} className="relative h-full w-full aspect-[4/3]">
              {isScanning ? <></> :
                <CardContent className="p-6 text-center">
                  <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Scan QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Point your camera at the QR code on your certificate
                  </p>
                  <Button
                    onClick={startCameraScan}
                    disabled={isScanning}
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {isScanning ? 'Scanning...' : 'Start Camera'}
                  </Button>
                </CardContent>
              }
            </div>
          </Card>

          {!isScanning && (
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
          )}
        </div>
      </DialogContent >
    </Dialog >
  );
};

export default QRCodeScannerDialog;
