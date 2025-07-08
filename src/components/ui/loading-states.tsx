import React from 'react';
import { Loader2, Clock, Wifi, WifiOff } from 'lucide-react';
import { Button } from './button';
import { LoadingState } from '@/hooks/useJobSearch';

interface LoadingMessageProps {
  loadingState: LoadingState;
  retryCount?: number;
  onRetry?: () => void;
  message?: string;
}

export const LoadingMessage: React.FC<LoadingMessageProps> = ({
  loadingState,
  retryCount = 0,
  onRetry,
  message
}) => {
  const getLoadingMessage = () => {
    if (message) return message;
    
    switch (loadingState) {
      case 'initial':
        return 'Loading...';
      case 'loading':
        return 'Refreshing...';
      case 'partial':
        return 'Taking longer than expected...';
      case 'error':
        return 'Something went wrong';
      default:
        return 'Loading...';
    }
  };

  const getLoadingIcon = () => {
    switch (loadingState) {
      case 'partial':
        return <Clock className="h-4 w-4 animate-pulse" />;
      case 'error':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className="text-center py-4">
      <div className="flex items-center justify-center gap-2 mb-2">
        {getLoadingIcon()}
        <span className="text-sm font-medium">{getLoadingMessage()}</span>
      </div>
      {loadingState === 'partial' && (
        <p className="text-xs text-muted-foreground">
          The server is taking longer than usual to respond. Please wait...
        </p>
      )}
      {retryCount > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          Retrying... (Attempt {retryCount + 1})
        </p>
      )}
      {loadingState === 'error' && onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="mt-2"
        >
          <Wifi className="h-4 w-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  );
};

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  count = 3, 
  className = "" 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-32"></div>
        </div>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Wifi className="h-12 w-12 text-muted-foreground" />,
  action
}) => {
  return (
    <div className="text-center py-12">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}; 