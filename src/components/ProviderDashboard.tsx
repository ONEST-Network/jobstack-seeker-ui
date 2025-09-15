import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { 
  Building2, 
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import UnauthenticatedView from './provider/UnauthenticatedView';
import UnifiedAuthDialog from './auth/UnifiedAuthDialog';
import OrganizationProfileDialog from './profile/OrganizationProfileDialog';
import EmployerManagement from './employer/EmployerManagement';
import EmployerProfileDialog from './employer/EmployerProfileDialog';
import PostJobDialog from './PostJobDialog';
import DraftManager from './postJob/DraftManager';
import MyJobs from './MyJobs';
import ProfileSetupView from './provider/ProfileSetupView';
import DashboardHeader from './provider/DashboardHeader';
import QuickStats from './provider/QuickStats';
import CandidateManagement from './CandidateManagement';

const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('my-jobs');
  const [showUnifiedAuth, setShowUnifiedAuth] = useState(false);
  const [showOrgProfile, setShowOrgProfile] = useState(false);
  const [showEmployerDialog, setShowEmployerDialog] = useState(false);
  const [showEmployerManagement, setShowEmployerManagement] = useState(false);
  const [showPostJob, setShowPostJob] = useState(false);
  const [showDraftManager, setShowDraftManager] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | undefined>(undefined);
  
  const { user, getSelectedEmployer } = useAuth();
  const selectedEmployer = getSelectedEmployer();
  const isMobile = useIsMobile();
  const { t } = useTranslation("providerdashboard");

  // If user is not logged in, show authentication flow
  if (!user) {
    return (
      <>
        <UnauthenticatedView
          onLogin={() => setShowUnifiedAuth(true)}
          onRegister={() => setShowUnifiedAuth(true)}
        />

        {/* Unified Auth Dialog */}
        <UnifiedAuthDialog
          isOpen={showUnifiedAuth}
          onClose={() => setShowUnifiedAuth(false)}
          defaultRole="organization"
        />
      </>
    );
  }

  // If user doesn't have organization profile, show profile creation
  if (user && !user.profile) {
    return (
      <>
        <ProfileSetupView
          userEmail={user.email}
          onCreateProfile={() => setShowOrgProfile(true)}
        />

        <OrganizationProfileDialog
          isOpen={showOrgProfile}
          onClose={() => setShowOrgProfile(false)}
        />
      </>
    );
  }

  const handleEditDraft = (draftId: string) => {
    setEditingDraftId(draftId);
    setShowPostJob(true);
  };

  const handleClosePostJob = () => {
    setShowPostJob(false);
    setEditingDraftId(undefined);
  };

  // Main dashboard for authenticated users with profiles
  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <DashboardHeader
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        onAddEmployer={() => setShowEmployerDialog(true)}
        onManageDrafts={() => setShowDraftManager(true)}
        onPostJob={() => setShowPostJob(true)}
        onManageEmployers={() => setShowEmployerManagement(true)}
      />

      {/* Current Employer Info */}
      {selectedEmployer && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <div>
              <p className="text-sm sm:text-base font-medium">
                {t('providerDashboard.currentEmployer')}: {selectedEmployer.name}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {selectedEmployer.contactEmail}
              </p>
            </div>
          </div>
        </div>
      )}

      <QuickStats />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
          <TabsTrigger value="my-jobs" className="text-sm font-medium">
            {t('providerDashboard.tabs.myJobs')}
          </TabsTrigger>
          <TabsTrigger value="candidates" className="text-sm font-medium">
            {t('providerDashboard.tabs.candidates')}
          </TabsTrigger>
          <TabsTrigger value="employers" className="text-sm font-medium">
            {t('providerDashboard.tabs.employers')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-jobs" className="mt-0">
          <MyJobs />
        </TabsContent>
        
        <TabsContent value="candidates" className="mt-0">
          <CandidateManagement />
        </TabsContent>
        
        <TabsContent value="employers" className="mt-0">
          <EmployerManagement />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PostJobDialog 
        isOpen={showPostJob}
        onClose={handleClosePostJob}
        skipAuthSteps={true}
        draftId={editingDraftId}
      />
      
      <DraftManager
        isOpen={showDraftManager}
        onClose={() => setShowDraftManager(false)}
        onEditDraft={handleEditDraft}
      />
      
      <EmployerProfileDialog
        isOpen={showEmployerDialog}
        onClose={() => setShowEmployerDialog(false)}
      />

      {isMobile ? (
        <Drawer open={showEmployerManagement} onOpenChange={setShowEmployerManagement}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader className="text-left border-b pb-3">
              <div className="flex items-center justify-between">
                <DrawerTitle>{t('providerDashboard.employerManagement.title')}</DrawerTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmployerManagement(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <EmployerManagement />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showEmployerManagement} onOpenChange={setShowEmployerManagement}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{t('providerDashboard.employerManagement.title')}</DialogTitle>
              <DialogDescription>
                {t('providerDashboard.employerManagement.description')}
              </DialogDescription>
            </DialogHeader>
            <EmployerManagement />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProviderDashboard;
