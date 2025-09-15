import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, User } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface DraftSyncButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const DraftSyncButton: React.FC<DraftSyncButtonProps> = ({ 
  className = "", 
  variant = "outline", 
  size = "sm" 
}) => {
  const { user, getSelectedCandidate } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation("draftsyncbutton");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSyncDrafts = async () => {
    if (!user) {
      toast({
        title: t("draftSync.authRequiredTitle"),
        description: t("draftSync.authRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    const selectedCandidate = getSelectedCandidate();
    if (!selectedCandidate) {
      toast({
        title: t("draftSync.noProfileTitle"),
        description: t("draftSync.noProfileDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const profileId = selectedCandidate.id;
      if (!profileId) {
        toast({
          title: t("draftSync.errorTitle"),
          description: t("draftSync.noProfileId"),
          variant: "destructive",
        });
        return;
      }

      const draftsResponse = await apiClient.getBAPJobDrafts(profileId);
      const drafts = Array.isArray(draftsResponse) ? draftsResponse : (draftsResponse?.data || []);
      
      if (!drafts || drafts.length === 0) {
        toast({
          title: t("draftSync.noDraftsTitle"),
          description: t("draftSync.noDraftsDesc"),
        });
        return;
      }

      let updatedCount = 0;
      const errors: string[] = [];

      for (const draft of drafts) {
        let draftId = null;
        try {
          draftId = draft.id;
          if (!draftId) {
            errors.push(t("draftSync.noDraftId", { jobId: draft.job_id || "unknown" }));
            continue;
          }

          const url = `${import.meta.env.VITE_BAP_URL}/api/v1/job-applications/drafts/${draftId}`;
          
          const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ /* profileData — unchanged */ }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          await response.json();
          updatedCount++;
        } catch (error) {
          errors.push(t("draftSync.updateFailed", { draftId, error: String(error) }));
        }
      }

      if (updatedCount > 0) {
        toast({
          title: t("draftSync.successTitle"),
          description: t("draftSync.successDesc", { count: updatedCount }),
        });
      }

      if (errors.length > 0) {
        toast({
          title: t("draftSync.partialTitle"),
          description: t("draftSync.partialDesc", { updated: updatedCount, failed: errors.length }),
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: t("draftSync.failedTitle"),
        description: t("draftSync.failedDesc"),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      onClick={handleSyncDrafts}
      disabled={isUpdating || !user}
      variant={variant}
      size={size}
      className={className}
    >
      {isUpdating ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <User className="h-4 w-4 mr-2" />
      )}
      {isUpdating ? t("draftSync.syncing") : t("draftSync.syncProfile")}
    </Button>
  );
};

export default DraftSyncButton;
