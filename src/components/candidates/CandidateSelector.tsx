
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CandidateSelectorProps {
  onAddCandidate: () => void;
}

const CandidateSelector: React.FC<CandidateSelectorProps> = ({ onAddCandidate }) => {
  const { user, selectCandidate, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();

  if (!user || user.role !== 'individual' || user.managedCandidates.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-0 flex-1 sm:flex-none">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium truncate">
            {selectedCandidate?.nickname || selectedCandidate?.name || 'Select Profile'}
          </span>
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
          <div className="text-sm font-medium text-muted-foreground mb-3">Switch Profile</div>
          <div className="space-y-1">
            {user.managedCandidates.map((candidate) => (
              <DropdownMenuItem
                key={candidate.id}
                onClick={() => selectCandidate(candidate.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCandidate?.id === candidate.id 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium truncate">
                    {candidate.nickname || candidate.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {candidate.interestedRole || 'No role specified'}
                  </span>
                </div>
                {selectedCandidate?.id === candidate.id && (
                  <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={onAddCandidate} 
          className="gap-2 p-3 cursor-pointer hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          Add New Profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CandidateSelector;
