import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Camera, Upload } from 'lucide-react';
// @ts-ignore
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
  const [scanSuccess, setScanSuccess] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "html5qr-code-full-region";

  const startCameraScan = () => {
    setIsScanning(true);
    setScanSuccess(false);
  };

  const parseResultToVc = async (url: string, fromScanner: boolean) => {
    const pattern = /^https:\/\/dway\.io\/jobs\/([0-9a-fA-F-]{36})$/;
    const match = url.match(pattern);

    if (match) {
      const uuid = match[1];
      const vcUrl = `https://verify.jobs.onest.dhiway.net/jobs/${uuid}.json`
      // Do whatever you want with uuid here:
      onScanComplete(vcUrl);
      setLastScannedData(vcUrl);
      setScanSuccess(true);
      
      // Stop scanning after successful scan
      if (fromScanner && scannerRef.current) {
        try {
          if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (err) {
          console.log('Error stopping scanner:', err);
        }
        setIsScanning(false);
      }
    } else {
      console.log('URL does not match expected pattern.');
      // Show error message to user
      setLastScannedData('Invalid QR code format. Please scan a valid certificate QR code.');
      setScanSuccess(true);
    }

    // Don't close immediately - let user continue scanning
    if (!fromScanner) {
      stopScanning();
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.log('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    
    // Clear scanner element content
    const scannerElement = document.getElementById(scannerId);
    if (scannerElement) {
      try {
        scannerElement.innerHTML = '';
      } catch (err) {
        console.log('Error clearing scanner element:', err);
      }
    }
    
    setIsScanning(false);
    setScanSuccess(false);
    setLastScannedData('');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      try {
        const result = await scannerRef.current.scanFile(file, true);
        await parseResultToVc(result, false);
        // Clear the file input
        event.target.value = '';
      } catch (err) {
        console.error("Scan failed", err);
      }
    }
  };

  const handleClose = () => {
    // Clean up scanner
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.log('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    
    // Clear scanner element content
    const scannerElement = document.getElementById(scannerId);
    if (scannerElement) {
      try {
        scannerElement.innerHTML = '';
      } catch (err) {
        console.log('Error clearing scanner element:', err);
      }
    }
    
    setIsScanning(false);
    setScanSuccess(false);
    setLastScannedData('');
    onClose();
  };

  const handleScanAnother = async () => {
    setScanSuccess(false);
    setLastScannedData('');
    
    // Ensure scanner is properly cleaned up before starting again
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.log('Error clearing scanner:', err);
      }
      scannerRef.current = null;
    }
    
    // Clear the scanner element content
    const scannerElement = document.getElementById(scannerId);
    if (scannerElement) {
      try {
        scannerElement.innerHTML = '';
      } catch (err) {
        console.log('Error clearing scanner element:', err);
      }
    }
    
    // Wait a bit for cleanup to complete and then start scanning
    setTimeout(() => {
      setIsScanning(true);
    }, 300);
  };

  useEffect(() => {
    const runScanner = async () => {
      if (isScanning) {
        // Ensure any existing scanner is cleaned up first
        if (scannerRef.current) {
          try {
            if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
              await scannerRef.current.stop();
            }
            scannerRef.current.clear();
          } catch (err) {
            console.log('Error cleaning up existing scanner:', err);
          }
          scannerRef.current = null;
        }

        // Wait a bit for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if the scanner element exists and is empty
        const scannerElement = document.getElementById(scannerId);
        if (!scannerElement) {
          console.error('Scanner element not found');
          setIsScanning(false);
          return;
        }

        // Clear any existing content in the scanner element
        try {
          scannerElement.innerHTML = '';
        } catch (err) {
          console.log('Error clearing scanner element:', err);
        }

        // Create new scanner instance
        try {
          scannerRef.current = new Html5Qrcode(scannerId);
          
          // Check if the scanner was created successfully
          if (!scannerRef.current) {
            throw new Error('Failed to create scanner instance');
          }
          
          await scannerRef.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            async (decodedText) => {
              try {
                await parseResultToVc(decodedText, true);
              } catch (err) {
                console.error('Error parsing QR result:', err);
              }
            },
            (_errorMessage) => {
              /* console.warn("QR Scan Error:", errorMessage); */
            }
          );
        } catch (err) {
          console.error("Unable to start scanning", err);
          setIsScanning(false);
          // Clean up the scanner reference if creation failed
          scannerRef.current = null;
        }
      }
    };

    runScanner();

    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (err) {
          console.log('scanner cleanup error: ', err)
        }
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (err) {
          console.log('scanner unmount cleanup error: ', err)
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import {type} Certificate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Message */}
          {scanSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    QR Code scanned successfully!
                  </p>
                  <p className="text-xs text-green-700 mt-1 break-all">
                    {lastScannedData}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card>
            <div 
              key={`${scannerId}-${isScanning ? 'scanning' : 'idle'}`}
              id={scannerId} 
              className="relative h-full w-full aspect-[4/3]"
            >
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Done
            </Button>
            {scanSuccess && (
              <Button
                onClick={handleScanAnother}
                className="flex-1"
              >
                Scan Another
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeScannerDialog;
