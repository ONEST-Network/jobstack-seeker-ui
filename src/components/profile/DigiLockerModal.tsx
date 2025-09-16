import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ExternalLink, AlertCircle, Eye, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  digiLockerAPI, 
  isDigiLockerConfigured, 
  DigiLockerConfigurationError,
  DigiLockerError,
  type DigiLockerCredentialSubject 
} from '@/lib/digilocker-api';

interface DigiLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

const DigiLockerModal: React.FC<DigiLockerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [step, setStep] = useState<'initial' | 'popup' | 'processing' | 'manual' | 'detected'>('initial');
  const [manualCode, setManualCode] = useState('');
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const windowRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setStep('initial');
      setAuthUrl(null);
      setIsLoading(false);
      setManualCode('');
      setDetectedCode(null);
      setIsMonitoring(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
        windowRef.current = null;
      }
    }
  }, [isOpen]);

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from studiodemo.dhiway.com or any localhost for development
      const allowedOrigins = [
        'https://studiodemo.dhiway.com',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8080'
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }



      // Check if the message contains a code
      if (event.data && typeof event.data === 'object') {
        let extractedCode = null;
        
        // Handle DIGILOCKER_REDIRECT format (from our bridge page)
        if (event.data.type === 'DIGILOCKER_REDIRECT' && event.data.code) {
          extractedCode = event.data.code;
        }
        
        // Handle DIGILOCKER_DONE format (from studiodemo.dhiway.com)
        else if (event.data.type === 'DIGILOCKER_DONE' && event.data.finalUrl) {
          try {
            const url = new URL(event.data.finalUrl);
            extractedCode = url.searchParams.get('code');
          } catch (error) {
            // Silently handle URL parsing errors
          }
        }
        
        // If we found a code, process it
        if (extractedCode) {
          setDetectedCode(extractedCode);
          setStep('detected');
          setIsMonitoring(false);
          
          // Show success toast
          toast({
            title: "Code Detected Successfully",
            description: `Authorization code automatically detected: ${extractedCode.substring(0, 8)}...`,
            variant: "default"
          });
          
          // Clean up polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          // Close popup
          if (windowRef.current && !windowRef.current.closed) {
            windowRef.current.close();
            windowRef.current = null;
          }
        } else {
          // Try to extract code from any URL in the message data as fallback
          const messageStr = JSON.stringify(event.data);
          const urlMatch = messageStr.match(/https?:\/\/[^\s"]+wallet-redirect\?[^"]*code=([^&"]+)/);
          if (urlMatch && urlMatch[1]) {
            const fallbackCode = urlMatch[1];
            setDetectedCode(fallbackCode);
            setStep('detected');
            setIsMonitoring(false);
            
            // Show success toast
            toast({
              title: "Code Detected Successfully",
              description: `Authorization code automatically detected: ${fallbackCode.substring(0, 8)}...`,
              variant: "default"
            });
            
            // Clean up polling
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
            // Close popup
            if (windowRef.current && !windowRef.current.closed) {
              windowRef.current.close();
              windowRef.current = null;
            }
          }
        }
      }

      // Also check for direct URL messages
      if (typeof event.data === 'string' && event.data.includes('wallet-redirect?code=')) {
        try {
          const url = new URL(event.data);
          const extractedCode = url.searchParams.get('code');
          if (extractedCode) {
            setDetectedCode(extractedCode);
            setStep('detected');
            setIsMonitoring(false);
            
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
            if (windowRef.current && !windowRef.current.closed) {
              windowRef.current.close();
              windowRef.current = null;
            }
          }
        } catch (error) {
          // Silently handle URL parsing errors
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleDigiLockerRequest = async () => {
    if (!isDigiLockerConfigured() || !digiLockerAPI) {
      toast({
        title: "Configuration Error",
        description: "DigiLocker API configuration is missing. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await digiLockerAPI.initiateDigiLockerRequest();
      if (response.url) {
        setAuthUrl(response.url);
        setStep('popup');
        // Don't automatically open popup, let user choose
      } else {
        throw new DigiLockerError('No URL returned from DigiLocker request');
      }
    } catch (error) {
      console.error('DigiLocker request error:', error);
      
      if (error instanceof DigiLockerConfigurationError) {
        toast({
          title: "Configuration Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "DigiLocker Request Failed",
          description: "Failed to initiate DigiLocker authentication. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPopup = () => {
    if (!authUrl) return;

    // Close any existing popup
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }

    // Open DigiLocker in a popup window
    windowRef.current = window.open(
      authUrl,
      'digilocker-auth',
      'width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=yes'
    );

    if (!windowRef.current) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site and try again.",
        variant: "destructive"
      });
      return;
    }

    setIsMonitoring(true);
    startPopupMonitoring();
  };

  const startPopupMonitoring = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      if (!windowRef.current || windowRef.current.closed) {
        // User closed the popup
        setIsMonitoring(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        windowRef.current = null;
        
        toast({
          title: "Authentication Cancelled",
          description: "The DigiLocker authentication window was closed. You can try again or enter the code manually.",
          variant: "destructive"
        });
        return;
      }

      // Try to detect if popup has navigated to redirect URL
      try {
        const popupUrl = windowRef.current.location.href;
        if (popupUrl.includes('studiodemo.dhiway.com/wallet-redirect')) {
          const url = new URL(popupUrl);
          const code = url.searchParams.get('code');
          if (code) {
            setDetectedCode(code);
            setStep('detected');
            setIsMonitoring(false);
            
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            
            windowRef.current.close();
            windowRef.current = null;
          }
        }
      } catch (error) {
        // Cross-origin access blocked - this is expected
        // Continue monitoring for window closure or postMessage
      }
    }, 1000);

    // Stop monitoring after 10 minutes
    setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setIsMonitoring(false);
        
        if (windowRef.current && !windowRef.current.closed) {
          windowRef.current.close();
          windowRef.current = null;
        }
        
        toast({
          title: "Authentication Timeout",
          description: "DigiLocker authentication timed out. Please try again.",
          variant: "destructive"
        });
      }
    }, 600000); // 10 minutes
  };

  const handleCopyUrl = async () => {
    if (authUrl) {
      try {
        await navigator.clipboard.writeText(authUrl);
        toast({
          title: "URL Copied",
          description: "DigiLocker authentication URL copied to clipboard."
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Could not copy URL to clipboard. Please copy manually.",
          variant: "destructive"
        });
      }
    }
  };

  const handleConfirmDetectedCode = () => {
    if (detectedCode) {
      setStep('processing');
      handleDigiLockerAuth(detectedCode);
    }
  };

  const handleManualCodeSubmit = () => {
    if (!manualCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter the authorization code.",
        variant: "destructive"
      });
      return;
    }
    
    setStep('processing');
    handleDigiLockerAuth(manualCode.trim());
  };

  const handleDigiLockerAuth = async (code: string) => {
    if (!digiLockerAPI) {
      toast({
        title: "Configuration Error",
        description: "DigiLocker API is not configured.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await digiLockerAPI.completeDigiLockerAuth(code);
      
      if (response.data && response.data.credentialSubject) {
        // Transform the data to match our profile format
        const transformedData = digiLockerAPI.transformCredentialData(response.data.credentialSubject);
        onSuccess(transformedData);
        toast({
          title: "DigiLocker Import Successful",
          description: "Your verified details have been imported from DigiLocker."
        });
        onClose();
      } else {
        throw new DigiLockerError('Invalid response format from DigiLocker auth');
      }
    } catch (error) {
      console.error('DigiLocker auth error:', error);
      
      let errorMessage = "Failed to authenticate with DigiLocker. Please try again.";
      if (error instanceof DigiLockerError) {
        errorMessage = error.message;
      }
      
      toast({
        title: "DigiLocker Authentication Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setStep('popup');
    }
  };

  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
      windowRef.current = null;
    }
    setStep('initial');
    setAuthUrl(null);
    setIsLoading(false);
    setManualCode('');
    setDetectedCode(null);
    setIsMonitoring(false);
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'initial':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Import from DigiLocker</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Securely import your verified AADHAAR details from DigiLocker to auto-fill your profile.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-800">What will be imported:</p>
              <ul className="text-blue-700 mt-1 space-y-1">
                <li>• Full Name</li>
                <li>• Date of Birth</li>
                <li>• Gender</li>
                <li>• AADHAAR Number</li>
                <li>• Address/Location</li>
              </ul>
            </div>
            
            {!isDigiLockerConfigured() && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-red-800">Configuration Required</p>
                <p className="text-red-700 mt-1">
                  DigiLocker integration requires proper API configuration. Please contact your administrator.
                </p>
                <div className="mt-2 pt-2 border-t border-red-300">
                  <p className="text-xs text-red-600">
                    Missing: VITE_AGENT_URL and VITE_AGENT_TOKEN environment variables
                  </p>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleDigiLockerRequest} 
              disabled={isLoading || !isDigiLockerConfigured()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting to DigiLocker...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect to DigiLocker
                </>
              )}
            </Button>
          </div>
        );

      case 'popup':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">DigiLocker Authentication Ready</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Click below to open DigiLocker authentication in a popup window.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-800 mb-2">Authentication Process:</p>
              <ol className="text-blue-700 space-y-1 list-decimal list-inside text-left">
                <li>Click "Open DigiLocker" to open authentication popup</li>
                <li>Login with your DigiLocker credentials</li>
                <li>Complete the authentication process</li>
                <li>The authorization code will be detected automatically</li>
              </ol>
            </div>

            {isMonitoring && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                  <p className="font-medium text-green-800">Monitoring authentication...</p>
                </div>
                <p className="text-green-700 text-sm">
                  Complete the login in the popup window. The code will be detected automatically.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleOpenPopup}
                disabled={isMonitoring}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {isMonitoring ? 'Authentication in Progress...' : 'Open DigiLocker'}
              </Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Alternative Options:</p>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyUrl}
                      className="text-amber-700 border-amber-300 hover:bg-amber-100"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy URL
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setStep('manual')}
                      className="text-amber-700 border-amber-300 hover:bg-amber-100"
                    >
                      Enter Code Manually
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'detected':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Authorization Code Detected!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                We've automatically detected your DigiLocker authorization code.
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-green-800 mb-2">Detected Code:</p>
              <code className="bg-green-100 px-2 py-1 rounded text-green-700 font-mono text-xs break-all">
                {detectedCode}
              </code>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('manual')} className="flex-1">
                Enter Different Code
              </Button>
              <Button onClick={handleConfirmDetectedCode} className="flex-1">
                Proceed with This Code
              </Button>
            </div>
          </div>
        );

      case 'manual':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Manual Code Entry</h3>
              <p className="text-sm text-muted-foreground">
                After completing DigiLocker authentication, copy the code from the redirect URL and paste it below.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-800 mb-2">How to get the code:</p>
              <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                <li>Complete the DigiLocker authentication</li>
                <li>Look for the redirect URL: <code className="bg-blue-100 px-1 rounded">studiodemo.dhiway.com/wallet-redirect?code=...</code></li>
                <li>Copy the value after "code=" (like: <code className="bg-blue-100 px-1 rounded">ea9592697f76832972be4a0919b229399e57d56f</code>)</li>
                <li>Paste it in the field below</li>
              </ol>
            </div>

            <div className="space-y-2">
              <label htmlFor="manualCode" className="text-sm font-medium">
                Authorization Code
              </label>
              <input
                id="manualCode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="ea9592697f76832972be4a0919b229399e57d56f"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('popup')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleManualCodeSubmit}
                disabled={!manualCode.trim()}
                className="flex-1"
              >
                Submit Code
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Processing Your Data</h3>
              <p className="text-sm text-muted-foreground">
                We're securely importing your verified details from DigiLocker...
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            DigiLocker Integration
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default DigiLockerModal; 