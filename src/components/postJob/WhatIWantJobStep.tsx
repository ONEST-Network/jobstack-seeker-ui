
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Award } from 'lucide-react';
import { JobData } from '@/types/jobPost';

interface WhatIWantJobStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: string;
  selectedIndustry: string;
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
  onSubmit: () => void;
  onBack: () => void;
  onSaveDraft?: () => void;
  onPublish?: () => void;
}

const WhatIWantJobStep: React.FC<WhatIWantJobStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  selectedIndustry,
  jobData,
  setJobData,
  onSubmit,
  onBack,
  onSaveDraft,
  onPublish
}) => {
  const handleSubmit = () => {
    if (!jobData.basicLiteracy || !jobData.commitmentMonths) {
      alert('Please fill all required fields');
      return;
    }
    onSubmit();
  };

  const handlePublish = () => {
    if (!jobData.basicLiteracy || !jobData.commitmentMonths) {
      alert('Please fill all required fields to publish');
      return;
    }
    if (onPublish) {
      onPublish();
    }
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>What I Want - Candidate Requirements (Step 3 of 3)</span>
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
            {/* Basic Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Basic Candidate Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="basicLiteracy">Basic Literacy Level *</Label>
                  <Select 
                    value={jobData.basicLiteracy} 
                    onValueChange={(value: '8th-pass' | '10th-pass' | '12th-pass' | 'graduate') => setJobData(prev => ({ ...prev, basicLiteracy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum education" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8th-pass">8th Pass - Can read and write</SelectItem>
                      <SelectItem value="10th-pass">10th Pass</SelectItem>
                      <SelectItem value="12th-pass">12th Pass</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="commitmentMonths">Minimum Commitment Period (Months) *</Label>
                  <Input
                    id="commitmentMonths"
                    type="number"
                    value={jobData.commitmentMonths || ''}
                    onChange={(e) => setJobData(prev => ({ ...prev, commitmentMonths: parseInt(e.target.value) || 0 }))}
                    placeholder="12"
                    min="1"
                    max="36"
                  />
                  <p className="text-xs text-muted-foreground mt-1">How long should the candidate commit to work?</p>
                </div>
              </CardContent>
            </Card>

            {/* Skill Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-600" />
                  Skill Requirements & Proof
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Skill Proof Required</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={jobData.skillProofRequired}
                      onCheckedChange={(checked) => setJobData(prev => ({ ...prev, skillProofRequired: checked }))}
                    />
                    <span className="text-sm">{jobData.skillProofRequired ? 'Required' : 'Not Required'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Candidate must demonstrate ability to handle electrical sewing machine
                  </p>
                </div>

                {jobData.skillProofRequired && (
                  <div className="space-y-4 pl-4 border-l-2 border-orange-200">
                    <div className="space-y-2">
                      <Label>Machine Control - Speed & Straight Line Stitching</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={jobData.machineControlSpeed}
                          onCheckedChange={(checked) => setJobData(prev => ({ ...prev, machineControlSpeed: checked }))}
                        />
                        <span className="text-sm">{jobData.machineControlSpeed ? 'Required' : 'Not Required'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Candidate must demonstrate fast, straight-line stitching with speed control
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Machine Control - Corner Handling</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={jobData.machineControlCorners}
                          onCheckedChange={(checked) => setJobData(prev => ({ ...prev, machineControlCorners: checked }))}
                        />
                        <span className="text-sm">{jobData.machineControlCorners ? 'Required' : 'Not Required'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Candidate must show ability to slow down at corners for consistent quality
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Intent & Commitment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Intent & Commitment Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Proof of Intent Required</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={jobData.proofOfIntent}
                      onCheckedChange={(checked) => setJobData(prev => ({ ...prev, proofOfIntent: checked }))}
                    />
                    <span className="text-sm">{jobData.proofOfIntent ? 'Required' : 'Not Required'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Candidate must demonstrate informed willingness to work in factory conditions
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">What we'll verify:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Understanding of factory floor working conditions</li>
                    <li>• Willingness to commit for the specified duration</li>
                    <li>• Actions taken throughout the application journey</li>
                    <li>• Genuine interest in the role and industry</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Job Posting Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Company:</strong> {jobData.companyName}
                  </div>
                  <div>
                    <strong>Role:</strong> {jobData.openRole}
                  </div>
                  <div>
                    <strong>Openings:</strong> {jobData.numberOfOpenings}
                  </div>
                  <div>
                    <strong>Location:</strong> {jobData.factoryLocation}
                  </div>
                  <div>
                    <strong>Salary:</strong> ₹{jobData.inHandSalary}/month (in-hand)
                  </div>
                  <div>
                    <strong>Min. Education:</strong> {jobData.basicLiteracy}
                  </div>
                  <div>
                    <strong>Commitment:</strong> {jobData.commitmentMonths} months
                  </div>
                  <div>
                    <strong>Skill Proof:</strong> {jobData.skillProofRequired ? 'Required' : 'Not Required'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back: What I Have
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
                Publish Job
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatIWantJobStep;
