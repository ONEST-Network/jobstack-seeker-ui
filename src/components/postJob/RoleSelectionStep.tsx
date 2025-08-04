
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Briefcase, SearchX } from 'lucide-react';
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
  const hasSearchResults = filteredPriorityRoles.length > 0 || Object.keys(filteredRoles).length > 0;

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
                  {/* No Results Message */}
                  {searchQuery && !hasSearchResults && (
                    <div className="text-center py-8">
                      <SearchX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No roles found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We couldn't find any job roles matching "{searchQuery}"
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Try searching for:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Industrial Tailor</li>
                          <li>Warehouse Loader & Picker</li>
                          <li>In Store Promoter</li>
                          <li>Recruitment Associate</li>
                          <li>Electrician, Fitter, Mechanic</li>
                          <li>Machine Operator</li>
                        </ul>
                      </div>
                    </div>
                  )}

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

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {selectedJobRole && (
          <Button onClick={onProceed}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );

  // Mobile version with Drawer
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
            <h2 className="text-lg font-semibold">Select Job Role</h2>
            <div className="w-8"></div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Desktop version with Dialog
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-lg border">
        <div className="p-6">
          {content}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionStep;
