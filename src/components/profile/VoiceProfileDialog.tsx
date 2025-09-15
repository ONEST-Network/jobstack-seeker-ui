import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import { useProfileForm } from './ProfileFormProvider';
import { useTranslation } from 'react-i18next';

interface VoiceProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const VoiceProfileDialog: React.FC<VoiceProfileDialogProps> = ({ isOpen, onClose, onComplete }) => {
  const { profile, setProfile } = useProfileForm();
  const { toast } = useToast();
  const { t } = useTranslation('voiceprofiledialog');

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
        title: t('voice.errorTitle'),
        description: t('voice.errorDesc'),
        variant: 'destructive'
      });
      setIsListening(false);
    }
  });

  // Prompts (could also be moved into i18n JSON if needed)
  const prompts = [
    t('voice.prompts.role'),
    t('voice.prompts.name'),
    t('voice.prompts.age'),
    t('voice.prompts.currentLocation'),
    t('voice.prompts.desiredLocation'),
    t('voice.prompts.experience'),
    t('voice.prompts.review')
  ];

  const startVoiceSession = () => {
    if (supported) {
      setCurrentStep(0);
      speakPrompt(prompts[0]);
    } else {
      toast({
        title: t('voice.notSupportedTitle'),
        description: t('voice.notSupportedDesc'),
        variant: 'destructive'
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
      case 0:
        setProfile(prev => ({ ...prev, interestedRole: response }));
        nextStep();
        break;
      case 1:
        setProfile(prev => ({ ...prev, name: response }));
        nextStep();
        break;
      case 2:
        const age = parseInt(response.match(/\d+/)?.[0] || '0');
        if (age > 0) {
          setProfile(prev => ({ ...prev, age }));
          nextStep();
        } else {
          speakPrompt(t('voice.ageRetry'));
        }
        break;
      case 3:
        setProfile(prev => ({ ...prev, currentLocation: response }));
        nextStep();
        break;
      case 4:
        setProfile(prev => ({ ...prev, desiredLocation: response }));
        nextStep();
        break;
      case 5:
        const experience = {
          id: Date.now().toString(),
          designation: response.split(' at ')[0] || response,
          company: response.split(' at ')[1] || t('voice.notSpecified'),
          location: '',
          duration: '',
          workType: 'full-time' as const,
          description: response
        };
        setProfile(prev => ({ ...prev, experience: [...prev.experience, experience] }));
        nextStep();
        break;
      case 6:
        if (response.toLowerCase().includes('yes')) {
          onComplete();
          onClose();
        } else {
          speakPrompt(t('voice.changePrompt'));
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
          <DialogTitle>{t('voice.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!supported ? (
            <Card className="border-red-200">
              <CardContent className="p-4 text-center">
                <p className="text-red-600">
                  {t('voice.notSupportedDesc')}
                </p>
                <Button onClick={onClose} className="mt-2">
                  {t('voice.useManual')}
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
                    <span className="text-sm font-medium">{t('voice.aiAssistant')}</span>
                  </div>
                  <p className="text-sm">{currentPrompt || t('voice.startHint')}</p>
                </CardContent>
              </Card>

              {/* Voice Controls */}
              <div className="flex justify-center gap-4">
                {currentStep === 0 && !currentPrompt ? (
                  <Button onClick={startVoiceSession} size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    {t('voice.startSession')}
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
                      {speaking ? t('voice.stopSpeaking') : t('voice.repeat')}
                    </Button>

                    <Button
                      onClick={isListening ? stopListening : startListening}
                      size="lg"
                      className={`gap-2 ${isListening ? 'bg-red-600 hover:bg-red-700' : ''}`}
                      disabled={speaking}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isListening ? t('voice.stopListening') : t('voice.speakNow')}
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
                    <h4 className="font-medium mb-2">{t('voice.previewTitle')}</h4>
                    <div className="text-sm space-y-1">
                      {profile.interestedRole && <p><strong>{t('voice.role')}:</strong> {profile.interestedRole}</p>}
                      {profile.name && <p><strong>{t('voice.name')}:</strong> {profile.name}</p>}
                      {profile.age && <p><strong>{t('voice.age')}:</strong> {profile.age}</p>}
                      {profile.currentLocation && <p><strong>{t('voice.currentLocation')}:</strong> {profile.currentLocation}</p>}
                      {profile.desiredLocation && <p><strong>{t('voice.desiredLocation')}:</strong> {profile.desiredLocation}</p>}
                      {profile.experience && profile.experience.length > 0 && <p><strong>{t('voice.experience')}:</strong> {profile.experience[0].designation}</p>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onComplete} disabled={!profile.name}>
            {t('common.complete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceProfileDialog;
