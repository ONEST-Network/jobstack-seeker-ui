
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import { useProfileForm } from './ProfileFormProvider';

interface VoiceProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const VoiceProfileDialog: React.FC<VoiceProfileDialogProps> = ({ isOpen, onClose, onComplete }) => {
  const { profile, setProfile } = useProfileForm();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  const { speak, cancel, speaking } = useSpeechSynthesis();
  const { listen, stop, supported } = useSpeechRecognition({
    onResult: (result: string) => {
      handleVoiceResponse(result);
      setIsListening(false);
    },
    onError: (event: any) => {
      console.error('Speech recognition error:', event);
      toast({
        title: "Voice Recognition Error",
        description: "Please try speaking again or use manual input.",
        variant: "destructive"
      });
      setIsListening(false);
    }
  });

  const prompts = [
    "Hello! I'm here to help you create your profile. What type of job or role are you looking for?",
    "Great! Now, what's your full name?",
    "How old are you?",
    "Where are you currently located? Please mention your city and state.",
    "Where would you prefer to work? This can be the same as your current location or somewhere else.",
    "Tell me about your work experience. What was your last job position and company?",
    "Perfect! Your profile is almost complete. Would you like to review it?"
  ];

  const startVoiceSession = () => {
    if (supported) {
      setCurrentStep(0);
      speakPrompt(prompts[0]);
    } else {
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support voice recognition. Please use manual input.",
        variant: "destructive"
      });
    }
  };

  const speakPrompt = (text: string) => {
    setCurrentPrompt(text);
    speak({ text, rate: 0.9, pitch: 1 });
  };

  const handleVoiceResponse = (response: string) => {
    console.log('Voice response:', response);
    
    switch (currentStep) {
      case 0: // Role selection
        setProfile(prev => ({ ...prev, interestedRole: response }));
        nextStep();
        break;
      case 1: // Name
        setProfile(prev => ({ ...prev, name: response }));
        nextStep();
        break;
      case 2: // Age
        const age = parseInt(response.match(/\d+/)?.[0] || '0');
        if (age > 0) {
          setProfile(prev => ({ ...prev, age }));
          nextStep();
        } else {
          speakPrompt("I didn't catch your age. Please say your age as a number.");
        }
        break;
      case 3: // Current location
        setProfile(prev => ({ ...prev, currentLocation: response }));
        nextStep();
        break;
      case 4: // Desired location
        setProfile(prev => ({ ...prev, desiredLocation: response }));
        nextStep();
        break;
      case 5: // Experience
        const experience = {
          id: Date.now().toString(),
          designation: response.split(' at ')[0] || response,
          company: response.split(' at ')[1] || 'Not specified',
          location: '',
          duration: '',
          workType: 'full-time' as const,
          description: response
        };
        setProfile(prev => ({ ...prev, experience: [...prev.experience, experience] }));
        nextStep();
        break;
      case 6: // Review
        if (response.toLowerCase().includes('yes')) {
          onComplete();
          onClose();
        } else {
          speakPrompt("What would you like to change?");
        }
        break;
    }
  };

  const nextStep = () => {
    const next = currentStep + 1;
    if (next < prompts.length) {
      setCurrentStep(next);
      setTimeout(() => speakPrompt(prompts[next]), 1000);
    }
  };

  const startListening = () => {
    if (supported) {
      setIsListening(true);
      listen({ continuous: false, interimResults: false });
    }
  };

  const stopListening = () => {
    setIsListening(false);
    stop();
  };

  useEffect(() => {
    if (!isOpen) {
      cancel();
      stopListening();
      setCurrentStep(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Voice-Guided Profile Creation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!supported ? (
            <Card className="border-red-200">
              <CardContent className="p-4 text-center">
                <p className="text-red-600">
                  Your browser doesn't support voice recognition. Please use the manual profile creation instead.
                </p>
                <Button onClick={onClose} className="mt-2">
                  Use Manual Input
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current Prompt Display */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">AI Assistant:</span>
                  </div>
                  <p className="text-sm">{currentPrompt || "Click 'Start Voice Session' to begin!"}</p>
                </CardContent>
              </Card>

              {/* Voice Controls */}
              <div className="flex justify-center gap-4">
                {currentStep === 0 && !currentPrompt ? (
                  <Button onClick={startVoiceSession} size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    Start Voice Session
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={speaking ? cancel : () => speakPrompt(currentPrompt)}
                      variant="outline"
                      size="lg"
                      className="gap-2"
                    >
                      {speaking ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      {speaking ? 'Stop Speaking' : 'Repeat'}
                    </Button>
                    
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      size="lg"
                      className={`gap-2 ${isListening ? 'bg-red-600 hover:bg-red-700' : ''}`}
                      disabled={speaking}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isListening ? 'Stop Listening' : 'Speak Now'}
                    </Button>
                  </>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  {prompts.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Profile Preview */}
              {(profile.name || profile.interestedRole) && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Profile So Far:</h4>
                    <div className="text-sm space-y-1">
                      {profile.interestedRole && <p><strong>Role:</strong> {profile.interestedRole}</p>}
                      {profile.name && <p><strong>Name:</strong> {profile.name}</p>}
                      {profile.age && <p><strong>Age:</strong> {profile.age}</p>}
                      {profile.currentLocation && <p><strong>Location:</strong> {profile.currentLocation}</p>}
                      {profile.desiredLocation && <p><strong>Preferred Location:</strong> {profile.desiredLocation}</p>}
                      {profile.experience && profile.experience.length > 0 && <p><strong>Experience:</strong> {profile.experience[0].designation}</p>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onComplete} disabled={!profile.name}>
            Complete Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceProfileDialog;
