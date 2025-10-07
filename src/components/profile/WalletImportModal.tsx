import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, CheckCircle, AlertCircle, User, Phone, Mail, Shield, Building, Calendar, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  walletAPI, 
  isWalletConfigured, 
  WalletError,
  WalletConfigurationError,
  type WalletCredentialSubject,
  type IdentifierOption,
  type WalletResponse,
  type SelectedVC
} from '@/lib/wallet-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WalletImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: Record<string, string | number | boolean | undefined>) => void;
}

const WalletImportModal: React.FC<WalletImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'selectIdentifier' | 'requestCode' | 'verifyCode' | 'selectVC' | 'processing' | 'success'>('initial');
  const [identifierOptions, setIdentifierOptions] = useState<IdentifierOption[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [selectedIdentifierType, setSelectedIdentifierType] = useState<'email' | 'phone'>('email');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [walletResponse, setWalletResponse] = useState<WalletResponse | null>(null);
  const [selectedVC, setSelectedVC] = useState<SelectedVC | null>(null);
  const [importedData, setImportedData] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const getAvailableIdentifiers = (): IdentifierOption[] => {
    const options: IdentifierOption[] = [];
    
    if (user?.email) {
      options.push({
        value: user.email,
        label: user.email,
        type: 'email'
      });
    }

    if (user?.phone) {
      options.push({
        value: user.phone,
        label: user.phone,
        type: 'phone'
      });
    }

    return options;
  };

  const handleWalletImport = async () => {
    if (!isWalletConfigured() || !walletAPI) {
      toast({
        title: "Configuration Error",
        description: "Wallet API configuration is missing. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    const options = getAvailableIdentifiers();
    
    if (options.length === 0) {
      toast({
        title: "No Identifiers Available",
        description: "Please ensure you have either email or phone number in your profile.",
        variant: "destructive"
      });
      return;
    }

    if (options.length === 1) {
      // Directly proceed with the single identifier
      setSelectedIdentifier(options[0].value);
      setSelectedIdentifierType(options[0].type);
      await requestAuthenticationCode(options[0].value, options[0].type);
    } else {
      // Show identifier selection
      setIdentifierOptions(options);
      setStep('selectIdentifier');
    }
  };

  const handleIdentifierSelection = async () => {
    if (!selectedIdentifier) {
      toast({
        title: "Selection Required",
        description: "Please select an identifier to proceed.",
        variant: "destructive"
      });
      return;
    }

    const selectedOption = identifierOptions.find(option => option.value === selectedIdentifier);
    if (selectedOption) {
      setSelectedIdentifierType(selectedOption.type);
      await requestAuthenticationCode(selectedIdentifier, selectedOption.type);
    }
  };

  const requestAuthenticationCode = async (identifier: string, type: 'email' | 'phone') => {
    if (!walletAPI) return;

    setIsLoading(true);
    setStep('requestCode');

    try {
      const response = await walletAPI.requestCode(identifier, type === 'email' ? 'email' : 'phoneNumber');
      
      // Treat any successful HTTP response as success to avoid false negatives
      toast({
        title: "Code Sent",
        description: response?.message || `Verification code sent to your ${type === 'email' ? 'email' : 'phone'}.`,
        variant: "default"
      });
      setStep('verifyCode');
    } catch (error) {
      console.error('Request code error:', error);
      
      let errorMessage = "Failed to send verification code. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // If the server still responded with 2xx but message suggests OTP sent, proceed to verify step
      if (errorMessage.toLowerCase().includes('otp sent')) {
        toast({
          title: "Code Sent",
          description: errorMessage,
          variant: "default"
        });
        setStep('verifyCode');
      } else {
        toast({
          title: "Code Request Failed",
          description: errorMessage,
          variant: "destructive"
        });
        setStep('initial');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter the verification code.",
        variant: "destructive"
      });
      return;
    }

    if (!walletAPI) return;

    setIsLoading(true);

    try {
      const response = await walletAPI.verifyCode(selectedIdentifier, verificationCode);
      
      // Check if verification was successful (message contains success indicators)
      if (response.message && (response.message.includes('verified') || response.message.includes('✅'))) {
        // Set the auth token if provided
        if (response.token) {
          walletAPI.setAuthToken(response.token);
        }
        
        toast({
          title: "Verification Successful",
          description: response.message || "Code verified successfully. Fetching your credentials...",
          variant: "default"
        });
        await fetchWalletCredentials(selectedIdentifier);
      } else {
        throw new Error(response.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      
      let errorMessage = "Invalid verification code. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalletCredentials = async (identifier: string) => {
    if (!walletAPI) return;

    setIsLoading(true);
    setStep('processing');

    try {
      const response = await walletAPI.getVerifiedCredentials(identifier);
      
      if (response.total === 0) {
        toast({
          title: "No Credentials Found",
          description: "No verified credentials found for the selected identifier.",
          variant: "destructive"
        });
        setStep('initial');
        return;
      }

      // Store the response and show VC selection
      setWalletResponse(response);
      setStep('selectVC');
      
      toast({
        title: "Credentials Found",
        description: `Found ${response.total} verified credentials. Please select one to import.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Wallet import error:', error);
      
      let errorMessage = "Failed to import from wallet. Please try again.";
      if (error instanceof WalletError) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Wallet Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setStep('initial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVCSelection = (credentialData: any, credential: any) => {
    const selectedVCData: SelectedVC = {
      credentialData,
      credential,
      orgName: credentialData.metadata.orgName,
      issuedBy: credentialData.metadata.issuedBy
    };
    
    setSelectedVC(selectedVCData);
    
    // Transform the selected VC data
    const transformedData = walletAPI.transformSelectedVC(selectedVCData);
    setImportedData(transformedData);
    
    // Show success step
    setStep('success');
    
    toast({
      title: "VC Selected",
      description: `Selected credential from ${credentialData.metadata.orgName}`,
      variant: "default"
    });
  };

  const handleConfirmImport = () => {
    onSuccess(importedData);
    onClose();
  };

  const handleClose = () => {
    setStep('initial');
    setSelectedIdentifier('');
    setSelectedIdentifierType('email');
    setVerificationCode('');
    setIdentifierOptions([]);
    setWalletResponse(null);
    setSelectedVC(null);
    setImportedData({});
    setIsLoading(false);
    
    // Clear auth token when closing
    if (walletAPI) {
      walletAPI.clearAuthToken();
    }
    
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'initial':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Import from Wallet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Import your verified credentials from your digital wallet to auto-fill your profile.
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-purple-800">What will be imported:</p>
              <ul className="text-purple-700 mt-1 space-y-1">
                <li>• Full Name</li>
                <li>• Email Address</li>
                <li>• Phone Number</li>
                <li>• Certification Details</li>
                <li>• Educational Credentials</li>
              </ul>
            </div>
            
            {!isWalletConfigured() && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-red-800">Configuration Required</p>
                <p className="text-red-700 mt-1">
                  Wallet integration requires proper API configuration. Please contact your administrator.
                </p>
                <div className="mt-2 pt-2 border-t border-red-300">
                  <p className="text-xs text-red-600">
                    Missing: VITE_VC_WALLET_URL or VITE_VC_WALLET_API_KEY environment variables
                  </p>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleWalletImport} 
              disabled={isLoading || !isWalletConfigured()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting to Wallet...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Import from Wallet
                </>
              )}
            </Button>
          </div>
        );

      case 'selectIdentifier':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Select Identifier</h3>
              <p className="text-sm text-muted-foreground">
                Multiple identifiers found. Please select one to import credentials.
              </p>
            </div>
            
            <div className="space-y-3">
              <Select value={selectedIdentifier} onValueChange={setSelectedIdentifier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an identifier" />
                </SelectTrigger>
                <SelectContent>
                  {identifierOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        {option.type === 'email' ? (
                          <Mail className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('initial')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleIdentifierSelection}
                disabled={!selectedIdentifier}
                className="flex-1"
              >
                Proceed
              </Button>
            </div>
          </div>
        );

      case 'requestCode':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Sending Verification Code</h3>
              <p className="text-sm text-muted-foreground">
                We're sending a verification code to your {selectedIdentifierType === 'email' ? 'email' : 'phone'}...
              </p>
            </div>
          </div>
        );

      case 'verifyCode':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Enter Verification Code</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a verification code to your {selectedIdentifierType === 'email' ? 'email' : 'phone'}.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep('initial');
                  setVerificationCode('');
                }} 
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={handleVerifyCode}
                disabled={!verificationCode.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </div>
          </div>
        );

      case 'selectVC':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Select Verified Credential</h3>
              <p className="text-sm text-muted-foreground">
                Found {walletResponse?.total} verified credentials. Select one to import to your profile.
              </p>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {walletResponse?.credentials.map((credentialData) => (
                <Card key={credentialData.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        {credentialData.metadata.orgName}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {credentialData.credentials.length} credential{credentialData.credentials.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Issued by: {credentialData.metadata.issuedBy}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {credentialData.credentials.map((credential, index) => (
                      <div key={credential.id} className="border rounded-lg p-3 mb-2 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">
                            {credential.credentialSchema.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {new Date(credential.issuanceDate).toLocaleDateString()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {credential.credentialSubject.name && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{credential.credentialSubject.name}</span>
                            </div>
                          )}
                          {credential.credentialSubject.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{credential.credentialSubject.email}</span>
                            </div>
                          )}
                          {credential.credentialSubject.phone_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{credential.credentialSubject.phone_number}</span>
                            </div>
                          )}
                          {credential.credentialSubject.cert_name && (
                            <div className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              <span>{credential.credentialSubject.cert_name}</span>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => handleVCSelection(credentialData, credential)}
                        >
                          Select This Credential
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep('verifyCode');
                  setWalletResponse(null);
                }} 
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Importing Your Credentials</h3>
              <p className="text-sm text-muted-foreground">
                We're securely importing your verified credentials from your wallet...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Import Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Credential data has been imported from your wallet and will be applied to your profile.
              </p>
            </div>
            
            {selectedVC && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="font-medium text-blue-800">Selected Credential:</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Organization:</span>
                    <span className="text-blue-800 font-medium">{selectedVC.orgName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Issued By:</span>
                    <span className="text-blue-800 font-medium">{selectedVC.issuedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Schema:</span>
                    <span className="text-blue-800 font-medium">{importedData.vcMetadata?.schemaTitle}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <p className="font-medium text-green-800">Data to be imported:</p>
              
              {importedData.whoIAm && Object.keys(importedData.whoIAm).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-1">Personal Information:</h4>
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {Object.entries(importedData.whoIAm)
                      .filter(([key, value]) => value && !key.includes('Verified'))
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-green-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="text-green-800 font-medium">
                            {typeof value === 'string' || typeof value === 'number' ? value.toString() : 'Yes'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {importedData.whatIHave && Object.keys(importedData.whatIHave).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-1">Qualifications & Skills:</h4>
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {Object.entries(importedData.whatIHave)
                      .filter(([key, value]) => value)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-green-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="text-green-800 font-medium">
                            {typeof value === 'string' || typeof value === 'number' ? value.toString() : 'Yes'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {importedData.whatIWant && Object.keys(importedData.whatIWant).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-1">Preferences:</h4>
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {Object.entries(importedData.whatIWant)
                      .filter(([key, value]) => value)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-green-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="text-green-800 font-medium">
                            {typeof value === 'string' || typeof value === 'number' ? value.toString() : 'Yes'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Imported fields will be marked as verified and may be non-editable in your profile.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('selectVC')} className="flex-1">
                Select Different VC
              </Button>
              <Button onClick={handleConfirmImport} className="flex-1">
                Apply to Profile
              </Button>
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
            <Wallet className="w-5 h-5 text-purple-600" />
            Wallet Integration
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default WalletImportModal;
