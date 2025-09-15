import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Award, ChevronRight } from 'lucide-react';
import { useAuth, Certificate, UserProfile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface AssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssessmentComplete: () => void;
}

const AssessmentDialog: React.FC<AssessmentDialogProps> = ({ 
  isOpen, 
  onClose, 
  onAssessmentComplete 
}) => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation("assessmentdialog");

  const [currentAssessment, setCurrentAssessment] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const isUserProfile = (profile: any): profile is UserProfile =>
    profile && user?.role === 'individual';

  const availableAssessments = [
    {
      id: 'technical-skills',
      title: t('assessments.technical.title'),
      description: t('assessments.technical.description'),
      duration: t('assessments.technical.duration'),
      difficulty: t('assessments.technical.difficulty'),
      matchPoints: 3,
      icon: '🔧'
    },
    {
      id: 'communication',
      title: t('assessments.communication.title'),
      description: t('assessments.communication.description'),
      duration: t('assessments.communication.duration'),
      difficulty: t('assessments.communication.difficulty'),
      matchPoints: 2,
      icon: '💬'
    },
    {
      id: 'industry-knowledge',
      title: t('assessments.industry.title'),
      description: t('assessments.industry.description'),
      duration: t('assessments.industry.duration'),
      difficulty: t('assessments.industry.difficulty'),
      matchPoints: 4,
      icon: '🏭'
    }
  ];

  const startAssessment = (assessmentId: string) => {
    setCurrentAssessment(assessmentId);
    setProgress(0);
    setCompleted(false);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeAssessment(assessmentId);
          return 100;
        }
        return prev + 20;
      });
    }, 1000);
  };

  const completeAssessment = (assessmentId: string) => {
    const assessment = availableAssessments.find(a => a.id === assessmentId);
    if (!assessment || !user?.profile || !isUserProfile(user.profile)) return;

    const score = Math.floor(Math.random() * 30) + 70; // 70-100

    const newCertificate: Certificate = {
      id: `assessment-${assessmentId}-${Date.now()}`,
      name: `${assessment.title} ${t('assessments.common.assessment')}`,
      issuer: t('assessments.common.issuer'),
      issueDate: new Date().toISOString(),
      isVerified: true,
      documentUrl: `assessment-result-${score}`
    };

    const updatedProfile: UserProfile = {
      ...user.profile,
      certificates: [...(user.profile.certificates || []), newCertificate]
    };

    updateProfile(updatedProfile);
    setCompleted(true);
    
    toast({
      title: t('assessments.completeToast.title'),
      description: t('assessments.completeToast.description', { score })
    });

    setTimeout(() => {
      onAssessmentComplete();
    }, 2000);
  };

  if (!user || user.role !== 'individual') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('assessments.notAvailable.title')}</DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <p>{t('assessments.notAvailable.message')}</p>
            <Button onClick={onClose} className="mt-4">
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (currentAssessment) {
    const assessment = availableAssessments.find(a => a.id === currentAssessment);
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{assessment?.icon}</span>
              {assessment?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {completed ? (
              <div className="text-center space-y-4">
                <Award className="h-12 w-12 mx-auto text-green-600" />
                <h3 className="text-lg font-medium">{t('assessments.completed.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('assessments.completed.message')}
                </p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h3 className="font-medium mb-2">{t('assessments.inProgress.title')}</h3>
                  <Progress value={progress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('assessments.inProgress.progress', { progress })}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm">
                    {t('assessments.inProgress.simulationNote')}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {t('assessments.dialogTitle')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t('assessments.intro')}
          </div>

          <div className="grid gap-4">
            {availableAssessments.map((assessment) => (
              <Card key={assessment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-2xl">{assessment.icon}</span>
                    {assessment.title}
                    <Badge variant="secondary" className="ml-auto">
                      +{assessment.matchPoints} {t('assessments.common.points')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {assessment.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assessment.duration}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {assessment.difficulty}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => startAssessment(assessment.id)}
                      className="flex items-center gap-1"
                    >
                      {t('common.start')}
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              {t('common.maybeLater')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentDialog;
