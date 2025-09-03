import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, CheckCircle, AlertCircle, User, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  walletAPI, 
  isWalletConfigured, 
  WalletError,
  WalletConfigurationError,
  type WalletCredentialSubject,
  type IdentifierOption 
} from '@/lib/wallet-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WalletImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: Record<string, string | number | boolean | undefined>) => void;
}

const WalletImportModal: React.FC<WalletImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'selectIdentifier' | 'processing' | 'success'>('initial');
  const [identifierOptions, setIdentifierOptions] = useState<IdentifierOption[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [importedData, setImportedData] = useState<Record<string, string | number | boolean | undefined>>({});
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
      await fetchWalletCredentials(options[0].value);
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

    await fetchWalletCredentials(selectedIdentifier);
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

      // Extract and transform all credential data
      const transformedData = walletAPI.extractAllCredentialData(response.credentials);
      setImportedData(transformedData);
      
      // Show success step with imported data
      setStep('success');
      
      // Show success toast with imported fields
      const importedFields = Object.keys(transformedData)
        .filter(key => !key.includes('Verified') && transformedData[key])
        .join(', ');
      
      toast({
        title: "Import Successful",
        description: `Successfully imported: ${importedFields}`,
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

  const handleConfirmImport = () => {
    onSuccess(importedData);
    onClose();
  };

  const handleClose = () => {
    setStep('initial');
    setSelectedIdentifier('');
    setIdentifierOptions([]);
    setImportedData({});
    setIsLoading(false);
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
                    Missing: VITE_VC_WALLET_URL environment variable
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
                The following data has been imported from your wallet:
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="font-medium text-green-800">Imported Data:</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {Object.entries(importedData)
                  .filter(([key, value]) => !key.includes('Verified') && value)
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

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('initial')} className="flex-1">
                Import Again
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
