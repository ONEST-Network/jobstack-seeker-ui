
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin } from 'lucide-react';
import { JobData } from '@/types/jobPost';

interface WhoIAmJobStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: string;
  selectedIndustry: string;
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft?: () => void;
}

const WhoIAmJobStep: React.FC<WhoIAmJobStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  selectedIndustry,
  jobData,
  setJobData,
  onNext,
  onBack,
  onSaveDraft
}) => {
  const handleNext = () => {
    // Basic validation
    if (!jobData.companyName || !jobData.factoryLocation || !jobData.pocName || !jobData.pocPhone || !jobData.pocEmail) {
      alert('Please fill all required fields');
      return;
    }
    onNext();
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>Who I Am - Company & Role Details (Step 1 of 3)</span>
            {jobData.lastSavedAt && (
              <span className="text-xs text-muted-foreground">
                Last saved: {new Date(jobData.lastSavedAt).toLocaleTimeString()}
              </span>
            )}
          </DialogTitle>
          {selectedJobRole && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{selectedIndustry}</Badge>
              <span className="text-sm text-muted-foreground">→</span>
              <Badge>{selectedJobRole}</Badge>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Company Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={jobData.companyName}
                    onChange={(e) => setJobData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g., ABC Garments Pvt Ltd"
                  />
                </div>
                <div>
                  <Label htmlFor="cin">CIN Number</Label>
                  <Input
                    id="cin"
                    value={jobData.cin}
                    onChange={(e) => setJobData(prev => ({ ...prev, cin: e.target.value }))}
                    placeholder="U12345AB2020PTC123456"
                  />
                </div>
                <div>
                  <Label htmlFor="gst">GST Number</Label>
                  <Input
                    id="gst"
                    value={jobData.gst}
                    onChange={(e) => setJobData(prev => ({ ...prev, gst: e.target.value }))}
                    placeholder="12ABCDE3456F7GH"
                  />
                </div>
                <div>
                  <Label htmlFor="factoryLocation">Factory Location *</Label>
                  <div className="relative">
                    <Input
                      id="factoryLocation"
                      value={jobData.factoryLocation}
                      onChange={(e) => setJobData(prev => ({ ...prev, factoryLocation: e.target.value }))}
                      placeholder="City, State"
                    />
                    <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Role Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openRole">Open Role *</Label>
                  <Input
                    id="openRole"
                    value={jobData.openRole || selectedJobRole}
                    onChange={(e) => setJobData(prev => ({ ...prev, openRole: e.target.value }))}
                    placeholder="e.g., Tailor, Machine Operator"
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfOpenings">Number of Openings *</Label>
                  <Input
                    id="numberOfOpenings"
                    type="number"
                    value={jobData.numberOfOpenings || ''}
                    onChange={(e) => setJobData(prev => ({ ...prev, numberOfOpenings: parseInt(e.target.value) || 0 }))}
                    placeholder="e.g., 40"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Point of Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Point of Contact for this Opening</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pocName">PoC Name *</Label>
                  <Input
                    id="pocName"
                    value={jobData.pocName}
                    onChange={(e) => setJobData(prev => ({ ...prev, pocName: e.target.value }))}
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <Label htmlFor="pocPhone">PoC Phone Number *</Label>
                  <Input
                    id="pocPhone"
                    type="tel"
                    value={jobData.pocPhone}
                    onChange={(e) => setJobData(prev => ({ ...prev, pocPhone: e.target.value }))}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="pocEmail">PoC Email ID *</Label>
                  <Input
                    id="pocEmail"
                    type="email"
                    value={jobData.pocEmail}
                    onChange={(e) => setJobData(prev => ({ ...prev, pocEmail: e.target.value }))}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back to Role Selection
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button onClick={handleNext}>
                Next: What I Have
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhoIAmJobStep;
