import React, { useEffect, useState } from 'react';
import { ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { getCertificateName, isCertificateUrl } from '@/lib/utils';
import { Button } from './button';
import { Skeleton } from './skeleton';

interface CertificateDisplayProps {
  url: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

const CertificateDisplay: React.FC<CertificateDisplayProps> = ({ 
  url, 
  onRemove, 
  showRemoveButton = false 
}) => {
  const [certificateName, setCertificateName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchCertificateName = async () => {
      if (!isCertificateUrl(url)) {
        setCertificateName(url);
        return;
      }

      setIsLoading(true);
      setError('');
      
      try {
        const name = await getCertificateName(url);
        setCertificateName(name);
      } catch (err) {
        console.error('Error fetching certificate data:', err);
        setError('Failed to fetch certificate details');
        setCertificateName(url); // Fallback to URL
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificateName();
  }, [url]);

  const handleUrlClick = () => {
    // Open the certificate URL in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // For non-certificate URLs, show a simpler display
  if (!isCertificateUrl(url)) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-gray-100 rounded-full">
                <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                Scanned Data
              </h4>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleUrlClick}
                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                title={url} // Show full URL on hover
              >
                <span className="truncate max-w-[200px]" title={url}>{url}</span>
                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
              </Button>
            </div>
          </div>
          
          {showRemoveButton && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 p-1"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1.5 bg-blue-100 rounded-full">
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Certificate Name as Heading */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-blue-100 rounded-full">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {certificateName}
            </h4>
          </div>
          
          {/* Clickable URL */}
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleUrlClick}
              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
              title={url} // Show full URL on hover
            >
              <span className="truncate max-w-[200px]" title={url}>{url}</span>
              <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
            </Button>
          </div>
          
          {error && (
            <div className="flex items-center space-x-1 mt-2">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              <p className="text-xs text-amber-600">{error}</p>
            </div>
          )}
        </div>
        
        {/* Remove Button */}
        {showRemoveButton && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 p-1"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  );
};

export default CertificateDisplay;
