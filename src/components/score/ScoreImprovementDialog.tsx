
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Target, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { ScoreResult } from '@/utils/scoreCalculation';
import DocumentImportDialog from './DocumentImportDialog';
import AssessmentDialog from './AssessmentDialog';

interface ScoreImprovementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scores: ScoreResult;
  onScoreImproved: () => void;
}

const ScoreImprovementDialog: React.FC<ScoreImprovementDialogProps> = ({ 
  isOpen, 
  onClose, 
  scores,
  onScoreImproved 
}) => {
  const [showDocuments, setShowDocuments] = useState(false);
  const [showAssessments, setShowAssessments] = useState(false);

  const trustNeedsImprovement = scores.trustScore < 8;
  const matchNeedsImprovement = scores.matchScore < 8;

  const handleDocumentImport = () => {
    setShowDocuments(false);
    onScoreImproved();
  };

  const handleAssessmentComplete = () => {
    setShowAssessments(false);
    onScoreImproved();
  };

  if (showDocuments) {
    return (
      <DocumentImportDialog
        isOpen={true}
        onClose={() => setShowDocuments(false)}
        onImportComplete={handleDocumentImport}
      />
    );
  }

  if (showAssessments) {
    return (
      <AssessmentDialog
        isOpen={true}
        onClose={() => setShowAssessments(false)}
        onAssessmentComplete={handleAssessmentComplete}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Boost Your Application</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Improve your scores to stand out to employers and increase your chances of getting hired.
          </div>

          {/* Current Scores */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Trust Score</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">NA</div>
                <Progress value={0} className="mt-2" />
                {trustNeedsImprovement && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Needs Improvement
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Match Score</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{scores.matchScore}/10</div>
                <Progress value={scores.matchScore * 10} className="mt-2" />
                {matchNeedsImprovement && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Needs Improvement
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Improvement Actions */}
          <div className="space-y-3">
            {trustNeedsImprovement && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-900">Verify Your Documents</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Import verified documents to boost your trust score to 8+
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setShowDocuments(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Import Documents
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {matchNeedsImprovement && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-green-900">Take Skill Assessments</h3>
                      <p className="text-sm text-green-700 mb-3">
                        Complete assessments to improve your match score to 8+
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setShowAssessments(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Start Assessment
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <Button variant="outline" onClick={onClose} className="w-full">
              Continue with Current Scores
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreImprovementDialog;
