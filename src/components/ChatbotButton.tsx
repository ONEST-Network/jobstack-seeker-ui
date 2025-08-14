import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Phone, X, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

interface ChatbotButtonProps {
  show: boolean;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ show }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatBoxRef.current && !chatBoxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsExpanded(false);
        setShowPhoneInput(false);
        setPhoneNumber('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsExpanded(false);
        setShowPhoneInput(false);
        setPhoneNumber('');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsExpanded(false);
      setShowPhoneInput(false);
      setPhoneNumber('');
    } else {
      setIsOpen(true);
      setIsExpanded(true);
    }
  };

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const getUserPhoneNumber = (): string | null => {
    // Get phone number from user session (from /auth/get-session API)
    // This comes from user.phone which is mapped from backendUser.phoneNumber
    const userPhone = user?.phone;
    return userPhone || null;
  };

  const handleCallAI = () => {
    const userPhone = getUserPhoneNumber();
    
    if (userPhone) {
      // User has a phone number, proceed with call
      handleCallWithPhone(userPhone);
    } else {
      // No phone number found, show input field
      setShowPhoneInput(true);
    }
  };

  const handleCallWithPhone = async (phoneToUse: string) => {
    const validatedPhone = validatePhoneNumber(phoneToUse);
    
    if (validatedPhone.length !== 12 || !validatedPhone.startsWith('91')) {
      toast({
        title: "Invalid Phone Number",
        description: "The phone number in your profile is not valid. Please update it or enter manually.",
        variant: "destructive",
      });
      setShowPhoneInput(true);
      return;
    }

    setIsCalling(true);
    
    try {
      const data = await apiClient.initiateOutboundCall(validatedPhone);

      if (data.success === true) {
        toast({
          title: "Agent is Calling you, please pick up!!",
          description: "Your call is being connected...",
          duration: 5000,
        });
        
        // Close the chat after successful call
        setTimeout(() => {
          setIsOpen(false);
          setIsExpanded(false);
          setShowPhoneInput(false);
          setPhoneNumber('');
          setIsCalling(false);
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to initiate call');
      }
    } catch (error) {
      console.error('Outbound call error:', error);
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Failed to initiate call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalling(false);
    }
  };

  const validatePhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with +91 and has 13 digits total, remove +91
    if (phone.startsWith('+91') && cleaned.length === 13) {
      return cleaned.substring(2);
    }
    
    // If it's just 10 digits, add 91 prefix
    if (cleaned.length === 10) {
      return '91' + cleaned;
    }
    
    // If it's already 12 digits and starts with 91, return as is
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned;
    }
    
    // If it's 11 digits and starts with 0, remove 0 and add 91
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return '91' + cleaned.substring(1);
    }
    
    return cleaned;
  };

  const handlePhoneSubmit = async () => {
    const validatedPhone = validatePhoneNumber(phoneNumber);
    
    if (validatedPhone.length !== 12 || !validatedPhone.startsWith('91')) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit Indian phone number",
        variant: "destructive",
      });
      return;
    }

    setIsCalling(true);
    
    try {
      const data = await apiClient.initiateOutboundCall(validatedPhone);

      if (data.success === true) {
        toast({
          title: "Agent is Calling you, please pick up!!",
          description: "Your call is being connected...",
          duration: 5000,
        });
        
        // Close the chat after successful call
        setTimeout(() => {
          setIsOpen(false);
          setIsExpanded(false);
          setShowPhoneInput(false);
          setPhoneNumber('');
          setIsCalling(false);
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to initiate call');
      }
    } catch (error) {
      console.error('Outbound call error:', error);
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Failed to initiate call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalling(false);
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits, +, and spaces
    if (/^[\d\s+]*$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePhoneSubmit();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[99998]" ref={chatBoxRef}>
      {/* Chat Box */}
      {isOpen && (
        <div 
          className={`absolute bottom-20 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ease-in-out animate-slide-up ${
            isExpanded ? 'h-96 opacity-100' : 'h-0 opacity-0'
          } overflow-hidden`}
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="p-4 h-full flex flex-col">
            {/* Welcome Message */}
            <div className="flex-1">
              <div className="bg-gray-100 rounded-lg p-3 mb-4 animate-bounce-in">
                <p className="text-sm text-gray-700">
                  👋 Hello! I'm your AI assistant. How can I help you today?
                </p>
              </div>
              
              {/* Call AI Button */}
              {!showPhoneInput && (
                <div className="space-y-3">
                  {getUserPhoneNumber() ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-sm text-green-800">
                        <strong>📱 Using your session phone:</strong> {getUserPhoneNumber()}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Click the button below to call using this number from your session
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ No phone number found in session</strong>
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Please enter your phone number to make a call
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleCallAI}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={isCalling}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {isCalling ? 'Connecting...' : getUserPhoneNumber() ? 'Call AI Agent (Session Number)' : 'Call AI Agent'}
                  </Button>
                </div>
              )}

              {/* Phone Input */}
              {showPhoneInput && (
                <div className="space-y-3">
                  {getUserPhoneNumber() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        <strong>Session Phone:</strong> {getUserPhoneNumber()}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        You can use this number from your session or enter a different one below
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your phone number
                    </label>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={handlePhoneInputChange}
                      onKeyPress={handleKeyPress}
                      className="w-full"
                      disabled={isCalling}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll call you on this number
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {getUserPhoneNumber() && (
                      <Button
                        onClick={() => handleCallWithPhone(getUserPhoneNumber()!)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isCalling}
                      >
                        {isCalling ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Calling...
                          </>
                        ) : (
                          <>
                            <Phone className="h-4 w-4 mr-2" />
                            Use Session Number
                          </>
                        )}
                      </Button>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={handlePhoneSubmit}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={isCalling || !phoneNumber.trim()}
                      >
                        {isCalling ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Calling...
                          </>
                        ) : (
                          <>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPhoneInput(false);
                          setPhoneNumber('');
                        }}
                        disabled={isCalling}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expand/Collapse Button */}
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpansion}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <Button
        onClick={toggleChat}
        size="lg"
        className={`rounded-full h-14 w-14 shadow-lg transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 scale-110 rotate-12' 
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-110 animate-pulse-glow'
        }`}
        aria-label="Open AI Help"
        title="Open AI Help"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>
    </div>
  );
};

export default ChatbotButton;


