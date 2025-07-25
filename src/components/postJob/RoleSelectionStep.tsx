
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Briefcase, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { JOB_ROLES_BY_INDUSTRY } from '@/constants/jobRoles';

interface RoleSelectionStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: string;
  selectedIndustry: string;
  onRoleSelection: (role: string, industry: string) => void;
  onProceed: () => void;
  onBack: () => void;
  skipAuthSteps: boolean;
}

const RoleSelectionStep: React.FC<RoleSelectionStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  selectedIndustry,
  onRoleSelection,
  onProceed,
  onBack,
  skipAuthSteps
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  // Priority roles to show at top
  const priorityRoles = [
    'Industrial Tailor',
    'Warehouse Loader & Picker', 
    //'Field Sales Executive',
    'In Store Promoter',
    'Recruitment Associate',
    'Electrician',
    'Fitter',
    'Mechanic',
    'Machine Operator'
  ];

  const getFilteredRoles = () => {
    if (!searchQuery) return JOB_ROLES_BY_INDUSTRY;
    
    const filtered: Partial<typeof JOB_ROLES_BY_INDUSTRY> = {};
    Object.entries(JOB_ROLES_BY_INDUSTRY).forEach(([industry, roles]) => {
      const matchingRoles = roles.filter(role =>
        role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingRoles.length > 0) {
        filtered[industry as keyof typeof JOB_ROLES_BY_INDUSTRY] = matchingRoles;
      }
    });
    return filtered;
  };

  const getFilteredPriorityRoles = () => {
    if (!searchQuery) return priorityRoles;
    return priorityRoles.filter(role =>
      role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handlePriorityRoleSelection = (role: string) => {
    // Find industry for priority roles
    let roleIndustry = 'Other';
    for (const [industry, roles] of Object.entries(JOB_ROLES_BY_INDUSTRY)) {
      if (roles.includes(role)) {
        roleIndustry = industry;
        break;
      }
    }
    onRoleSelection(role, roleIndustry);
  };

  const filteredRoles = getFilteredRoles();
  const filteredPriorityRoles = getFilteredPriorityRoles();
  const industries = Object.keys(filteredRoles);

  const content = (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Choose the specific role you want to hire for</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col h-full max-h-[45vh] sm:max-h-[50vh]">
            {/* Search Bar - Fixed */}
            <div className="relative mb-4 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search job roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-touch text-base"
              />
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  {/* Priority Roles - Always visible at top */}
                  {filteredPriorityRoles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        Popular Roles
                      </h4>
                      <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {filteredPriorityRoles.map(role => (
                          <Button
                            key={role}
                            variant={selectedJobRole === role ? "default" : "outline"}
                            onClick={() => handlePriorityRoleSelection(role)}
                            className="h-auto p-3 text-left justify-start text-wrap min-h-touch"
                            title={role}
                          >
                            <span className="text-xs sm:text-sm leading-tight">{role}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Other Roles in Accordion */}
                  {Object.keys(filteredRoles).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3">Browse by Industry</h4>
                      <Accordion type="multiple" defaultValue={industries} className="w-full">
                        {Object.entries(filteredRoles).map(([industry, roles]) => (
                          <AccordionItem key={industry} value={industry}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex items-center gap-2">
                                <span className="text-lg sm:text-2xl">
                                  {industry === 'Textile Industry' && '🧵'}
                                  {industry === 'Warehousing Industry' && '📦'}
                                  {industry === 'Hospitality' && '🏨'}
                                  {industry === 'Semiconductor' && '💻'}
                                  {industry === 'Manufacturing' && '🏭'}
                                  {industry === 'Electric Vehicles' && '🚗'}
                                  {industry === 'Sales' && '💼'}
                                </span>
                                <span className="font-medium text-sm sm:text-base">{industry}</span>
                                <span className="text-xs sm:text-sm text-muted-foreground">({roles.length} roles)</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-1 gap-2 sm:gap-3 pt-2">
                                {roles.map(role => (
                                  <Button
                                    key={role}
                                    variant={selectedJobRole === role ? "default" : "outline"}
                                    onClick={() => onRoleSelection(role, industry)}
                                    className="h-auto p-3 text-left justify-start text-wrap min-h-touch"
                                    title={role}
                                  >
                                    <span className="text-xs sm:text-sm leading-tight">{role}</span>
                                  </Button>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Selected Role Display - Fixed */}
            {selectedJobRole && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-blue-900 text-xs sm:text-sm truncate">Selected: {selectedJobRole}</p>
                    <p className="text-xs text-blue-700 truncate">Industry: {selectedIndustry}</p>
                  </div>
                  <Button onClick={onProceed} size="sm" className="ml-auto h-touch">
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 sticky bottom-0 bg-background pb-4 sm:pb-0 sm:static border-t sm:border-t-0 -mx-4 px-4 sm:mx-0 sm:px-0 pt-4 sm:pt-0">
        <Button variant="outline" onClick={onBack} className="h-touch">
          Back
        </Button>
        <Button variant="outline" onClick={onClose} className="h-touch">
          Cancel
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[95vh]">
          <DrawerHeader className="text-left border-b pb-3">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg">Select Job Role</DrawerTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Job Role</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionStep;
