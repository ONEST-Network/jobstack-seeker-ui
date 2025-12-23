import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TermsPrivacyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const TermsPrivacyDialog: React.FC<TermsPrivacyDialogProps> = ({
  isOpen,
  onClose,
  url,
  title,
}) => {
  const isMobile = useIsMobile();
  const [popupBlocked, setPopupBlocked] = useState(false);

  useEffect(() => {
    if (isOpen && !isMobile) {
      // For desktop: Try to open popup window
      const width = Math.min(1000, window.screen.width * 0.9);
      const height = Math.min(700, window.screen.height * 0.9);
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        url,
        title,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no`
      );
      
      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setPopupBlocked(true);
      } else {
        // Popup opened successfully, close dialog
        onClose();
      }
    }
  }, [isOpen, isMobile, url, title, onClose]);

  const handleOpenLink = () => {
    if (isMobile) {
      // On mobile, open in new tab (popups don't work well)
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // On desktop, try popup again
      const width = Math.min(1000, window.screen.width * 0.9);
      const height = Math.min(700, window.screen.height * 0.9);
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      window.open(
        url,
        title,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no`
      );
    }
    onClose();
  };

  // On mobile, show a dialog with option to open
  // On desktop, if popup was blocked, show dialog with option to retry
  if (isMobile || popupBlocked) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {isMobile 
                ? 'Tap the button below to view the content. It will open in a new tab.'
                : 'Popup window was blocked. Click the button below to open the content.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleOpenLink}
              className="w-full"
              variant="default"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open {title}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop: No dialog shown, popup opens automatically
  return null;
};

export default TermsPrivacyDialog;

