
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Building2, Briefcase, Menu } from 'lucide-react';
import EmployerSelector from '@/components/employer/EmployerSelector';

interface DashboardHeaderProps {
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  onAddEmployer: () => void;
  onManageDrafts: () => void;
  onPostJob: () => void;
  onManageEmployers: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  showMobileMenu,
  setShowMobileMenu,
  onAddEmployer,
  onManageDrafts,
  onPostJob,
  onManageEmployers
}) => {
  const isMobile = useIsMobile();

  const MobileActions = () => (
    <div className="space-y-2">
      <EmployerSelector onAddEmployer={onAddEmployer} />
      <Button variant="outline" onClick={onManageDrafts} className="w-full justify-start h-touch">
        <Briefcase className="h-4 w-4 mr-2" />
        Manage Drafts
      </Button>
      <Button onClick={onPostJob} className="w-full justify-start h-touch">
        <Plus className="h-4 w-4 mr-2" />
        Post New Job
      </Button>
      <Button variant="outline" onClick={onManageEmployers} className="w-full justify-start h-touch">
        <Building2 className="h-4 w-4 mr-2" />
        Manage Employers
      </Button>
    </div>
  );

  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Provider Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage employers, job postings, and candidate applications
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {isMobile ? (
          <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-touch">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Actions</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <MobileActions />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <>
            <EmployerSelector onAddEmployer={onAddEmployer} />
            <Button variant="outline" onClick={onManageDrafts} className="h-touch">
              <Briefcase className="h-4 w-4 mr-2" />
              Manage Drafts
            </Button>
            <Button onClick={onPostJob} className="h-touch">
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
            <Button variant="outline" onClick={onManageEmployers} className="h-touch">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Employers
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
