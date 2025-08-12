import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot } from 'lucide-react';

interface ChatbotButtonProps {
  show: boolean;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ show }) => {
  const [open, setOpen] = useState(false);

  if (!show) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[99998]">
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          aria-label="Open AI Help"
          title="Open AI Help"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call AI for Help</DialogTitle>
          </DialogHeader>
          {/* Placeholder content - to be implemented later */}
          <div className="text-sm text-muted-foreground">
            This is a placeholder. Chatbot functionality will be added later.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatbotButton;


