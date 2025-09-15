import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

interface CriteriaLabelsProps {
  criteria: string[];
  maxVisible?: number;
}

const CriteriaLabels: React.FC<CriteriaLabelsProps> = ({ criteria, maxVisible = 2 }) => {
  const { t } = useTranslation("criterialable");

  const visibleCriteria = criteria.slice(0, maxVisible);
  const remainingCount = criteria.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleCriteria.map((criterion, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="text-xs bg-green-100 text-green-800"
        >
          {/* pinging translation key instead of raw text */}
          {t(`criteria.${criterion}`)}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
          {t('criteria.more', { count: remainingCount })}
        </Badge>
      )}
    </div>
  );
};

export default CriteriaLabels;
