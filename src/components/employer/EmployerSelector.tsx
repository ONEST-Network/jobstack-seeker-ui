import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2, Plus, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmployerSelectorProps {
  onAddEmployer: () => void;
}

const EmployerSelector: React.FC<EmployerSelectorProps> = ({ onAddEmployer }) => {
  const { t } = useTranslation("employerselector");
  const { user, selectEmployer, getSelectedEmployer } = useAuth();
  const selectedEmployer = getSelectedEmployer();

  if (!user) return null;

  // Sort employers to show default employer first
  const sortedEmployers = [...user.managedEmployers].sort((a, b) => {
    if (a.id === 'default-employer') return -1;
    if (b.id === 'default-employer') return 1;
    return 0;
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 min-w-0 flex-1 sm:flex-none justify-between"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {selectedEmployer
                ? selectedEmployer.name
                : t('employerSelector.selectEmployer')}
            </span>
            {selectedEmployer?.id === 'default-employer' && (
              <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[280px] sm:w-[320px] max-h-[60vh] overflow-y-auto"
        sideOffset={8}
        avoidCollisions={true}
      >
        <div className="p-3">
          <div className="text-sm font-medium text-muted-foreground mb-3">
            {t('employerSelector.switchEmployer')}
          </div>
          <div className="space-y-1">
            {sortedEmployers.map((employer) => (
              <DropdownMenuItem
                key={employer.id}
                onClick={() => selectEmployer(employer.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedEmployer?.id === employer.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between w-full min-w-0">
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium truncate">{employer.name}</span>
                      {employer.id === 'default-employer' && (
                        <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {employer.contactEmail}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onAddEmployer}
          className="gap-2 p-3 cursor-pointer hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          {t('employerSelector.addNewEmployer')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmployerSelector;
