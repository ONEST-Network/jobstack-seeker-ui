
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2, Plus, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmployerSelectorProps {
  onAddEmployer: () => void;
}

const EmployerSelector: React.FC<EmployerSelectorProps> = ({ onAddEmployer }) => {
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
        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {selectedEmployer ? selectedEmployer.name : 'Select Employer'}
            </span>
            {selectedEmployer?.id === 'default-employer' && (
              <Crown className="h-3 w-3 text-amber-500" />
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        {sortedEmployers.map((employer) => (
          <DropdownMenuItem
            key={employer.id}
            onClick={() => selectEmployer(employer.id)}
            className={selectedEmployer?.id === employer.id ? 'bg-accent' : ''}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{employer.name}</span>
                  {employer.id === 'default-employer' && (
                    <Crown className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{employer.contactEmail}</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddEmployer}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Employer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmployerSelector;
