import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, Calendar, Building2, Clock } from 'lucide-react';
import { getDraftSummaries, deleteDraft, DraftSummary } from '@/utils/draftManager';
import { useToast } from '@/components/ui/use-toast';

interface DraftManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onEditDraft: (draftId: string) => void;
}

const DraftManager: React.FC<DraftManagerProps> = ({ isOpen, onClose, onEditDraft }) => {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation('draftManager');

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen]);

  const loadDrafts = () => {
    const draftSummaries = getDraftSummaries();
    setDrafts(draftSummaries);
  };

  const handleDeleteDraft = (draftId: string) => {
    if (window.confirm(t('drafts.confirmDelete'))) {
      deleteDraft(draftId);
      loadDrafts();
      toast({
        title: t('drafts.toast.deletedTitle'),
        description: t('drafts.toast.deletedDesc'),
      });
    }
  };

  const handleEditDraft = (draftId: string) => {
    onEditDraft(draftId);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('drafts.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('drafts.noDrafts')}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {drafts.map((draft) => (
                <Card key={draft.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{draft.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{draft.companyName}</span>
                          <span>•</span>
                          <span>{draft.openRole}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(draft.status)}>
                        {t(`drafts.status.${draft.status}`)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{t('drafts.lastSaved')}: {formatDate(draft.lastSavedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{t('drafts.createdAt')}: {formatDate(draft.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDraft(draft.id)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDraft(draft.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DraftManager;
