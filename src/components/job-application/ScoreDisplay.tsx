import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ScoreResult } from '@/utils/scoreCalculation';

interface ScoreDisplayProps {
  scores: ScoreResult;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scores }) => {
  const { user } = useAuth();
  const { t } = useTranslation("scoredisplay");

  if (user?.role !== 'individual') return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600 mb-1">0/10</div>
            <div className="text-sm font-medium text-blue-700">
              {t('scoreDisplay.trustScore')}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {t('scoreDisplay.trustScoreHint')}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {scores.matchScore}/10
            </div>
            <div className="text-sm font-medium text-green-700">
              {t('scoreDisplay.matchScore')}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {t('scoreDisplay.matchScoreHint')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreDisplay;
