import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Briefcase, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileForm, ProfileFormProvider } from '@/components/profile/ProfileFormProvider';
import DynamicFormStep from '@/components/profile/DynamicFormStep';
import { JobApplicationData } from '@/hooks/useJobApplication';
import { getUnifiedSchema } from '@/schemas';

interface ConsolidatedJobApplicationProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationData: JobApplicationData) => Promise<void>;
  job: any;
  selectedProfile: any;
  applying?: boolean;
}

const ConsolidatedJobApplicationContent: React.FC<ConsolidatedJobApplicationProps> = ({
  isOpen,
  onClose,
  onSubmit,
  job,
  selectedProfile,
  applying = false
}) => {
  const { user } = useAuth();
  const { profile, setProfile } = useProfileForm();
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Helper function to map job title to role name
  const getRoleFromJobTitle = (jobTitle: string): string => {
    const lowerJobTitle = jobTitle.toLowerCase();
    
    if (lowerJobTitle.includes('tailor') || lowerJobTitle.includes('stitch') || lowerJobTitle.includes('garment')) {
      return 'Industrial Tailor';
    }
    if (lowerJobTitle.includes('warehouse') || lowerJobTitle.includes('loader') || lowerJobTitle.includes('picker') || lowerJobTitle.includes('logistics')) {
      return 'Warehouse Loader & Picker';
    }
    if (lowerJobTitle.includes('recruitment') || lowerJobTitle.includes('hr') || lowerJobTitle.includes('talent') || lowerJobTitle.includes('hiring')) {
      return 'Recruitment Associate';
    }
    if (lowerJobTitle.includes('sales') || lowerJobTitle.includes('field') || lowerJobTitle.includes('executive')) {
      return 'Field Sales Executive';
    }
    if (lowerJobTitle.includes('promoter') || lowerJobTitle.includes('store') || lowerJobTitle.includes('retail')) {
      return 'In Store Promoter';
    }
    
    return 'Industrial Tailor';
  };

  const getJobTitle = (job: any): string => {
    if (job.descriptor?.name) {
      return job.descriptor.name;
    }
    if (job.title) {
      return job.title;
    }
    return 'Unknown Job';
  };

  // Initialize profile with selected profile data
  useEffect(() => {
    if (isOpen && selectedProfile && !isDataLoaded) {
      const transformedProfile = {
        // Who I Am data
        name: selectedProfile.name,
        dateOfBirth: selectedProfile.dateOfBirth,
        age: selectedProfile.age,
        gender: selectedProfile.gender,
        hometown: selectedProfile.hometown,
        aadharNumber: selectedProfile.aadharNumber,
        phone: selectedProfile.phone,
        currentLocation: selectedProfile.currentLocation,
        desiredLocation: selectedProfile.desiredLocation,
        isNameVerified: selectedProfile.isNameVerified,
        isAgeVerified: selectedProfile.isAgeVerified,
        isGenderVerified: selectedProfile.isGenderVerified,
        isAadharVerified: selectedProfile.isAadharVerified,
        isHometownVerified: selectedProfile.isHometownVerified,
        
        // What I Have data
        basicLiteracy: selectedProfile.basicLiteracy,
        skillProofVideo: selectedProfile.skillProofVideo,
        qualityProofImage: selectedProfile.qualityProofImage,
        hasWorkExperience: selectedProfile.hasWorkExperience,
        previousCompany: selectedProfile.previousCompany,
        previousLocation: selectedProfile.previousLocation,
        experienceMonths: selectedProfile.experienceMonths,
        machinesOperated: selectedProfile.machinesOperated,
        
        // What I Want data
        salaryFrequency: selectedProfile.salaryFrequency,
        advanceMonthsAvailable: selectedProfile.advanceMonthsAvailable,
        advanceFrequency: selectedProfile.advanceFrequency,
        monthlySalary: selectedProfile.monthlySalary,
        pfDeduction: selectedProfile.pfDeduction,
        esicDeduction: selectedProfile.esicDeduction,
        inHandSalary: selectedProfile.inHandSalary,
        housingFacility: selectedProfile.housingFacility,
        foodFacility: selectedProfile.foodFacility,
        workHoursPerDay: selectedProfile.workHoursPerDay,
        overtimeAvailable: selectedProfile.overtimeAvailable,
        overtimePayMultiplier: selectedProfile.overtimePayMultiplier,
        gradeUpgradation: selectedProfile.gradeUpgradation,
        factoryTrustScore: selectedProfile.factoryTrustScore,
        
        // Role and industry
        interestedRole: selectedProfile.interestedRole,
        interestedIndustry: selectedProfile.interestedIndustry,
        
        // Legacy fields
        experience: selectedProfile.experience,
        skills: selectedProfile.skills,
        certificates: selectedProfile.certificates,
        
        // Education and certifications
        education: selectedProfile.education,
        skillCertifications: selectedProfile.skillCertifications,
        workExperience: selectedProfile.workExperience,
        
        // Assessment and verification
        assessmentScores: selectedProfile.assessmentScores,
        documentVerificationStatus: selectedProfile.documentVerificationStatus,
        
        // Unified schema data
        whoIAm: selectedProfile.whoIAm,
        whatIHave: selectedProfile.whatIHave,
        whatIWant: selectedProfile.whatIWant,
      };
      
      setProfile(transformedProfile);
      setIsDataLoaded(true);
    }
  }, [isOpen, selectedProfile, isDataLoaded, setProfile]);

  const handleSubmit = async () => {
    const applicationData: JobApplicationData = {
      name: profile.name || profile.whoIAm?.name || user?.name || '',
      age: profile.age?.toString() || profile.whoIAm?.age?.toString() || profile.whatIHave?.age?.toString(),
      gender: profile.gender || profile.whoIAm?.gender,
      phone: profile.phone || profile.whoIAm?.phone || user?.phone || '',
      email: user?.email || '',
      expectedSalary: profile.monthlyInHandPreferred?.toString() || profile.whatIWant?.monthlyInHandPreferred?.toString() || profile.monthlySalary?.toString() || '1200000',
      totalExperience: profile.experienceMonths?.toString() || profile.whatIHave?.experienceMonths?.toString() || '0',
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: profile.currentLocation || profile.whoIAm?.currentLocation || 'Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India'
      },
      skills: profile.skills?.map(skill => ({ code: skill, name: skill })) || [
        { code: "UI", name: "UI Design" }
      ],
      languages: [
        { code: "en", name: "English" }
      ],
      profileData: {
        whoIAm: profile.whoIAm || {},
        whatIHave: profile.whatIHave || {},
        whatIWant: profile.whatIWant || {},
        ...profile
      }
    };
    
    await onSubmit(applicationData);
  };

  const canSubmit = () => {
    const name = profile.name || profile.whoIAm?.name;
    return name?.trim() !== '';
  };

  const jobTitle = getJobTitle(job);
  const mappedRole = getRoleFromJobTitle(jobTitle);
  const unifiedSchema = getUnifiedSchema(mappedRole);

  const formatKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const renderProfileSection = (title: string, data: Record<string, any> | undefined, icon: React.ReactNode) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(data).map(([key, value]) => {
              if (value === undefined || value === null || value === '' || key === 'gps' || key === 'tag') return null;
              if (Array.isArray(value) && value.length === 0) return null;

              return (
                <div key={key} className="p-3 rounded-lg bg-gray-50">
                  <div className="text-sm font-medium text-muted-foreground">
                    {formatKey(key)}
                  </div>
                  <div className="text-base font-semibold break-words">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Application for {jobTitle}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Profile: {selectedProfile?.nickname || selectedProfile?.name}</span>
            {selectedProfile?.interestedRole && (
              <>
                <span>•</span>
                <span>{selectedProfile.interestedRole}</span>
              </>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Profile Information Display */}
          <div className="space-y-4">
            {renderProfileSection(
              "Who I Am",
              profile.whoIAm,
              <User className="h-5 w-5" />
            )}

            {renderProfileSection(
              "What I Have",
              profile.whatIHave,
              <Briefcase className="h-5 w-5" />
            )}

            {renderProfileSection(
              "What I Want",
              profile.whatIWant,
              <Target className="h-5 w-5" />
            )}
          </div>

          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-blue-50">
                  <div className="text-sm font-medium text-muted-foreground">Job Title</div>
                  <div className="text-base font-semibold">{jobTitle}</div>
                </div>
                {job.provider?.descriptor?.name && (
                  <div className="p-3 rounded-lg bg-blue-50">
                    <div className="text-sm font-medium text-muted-foreground">Company</div>
                    <div className="text-base font-semibold">{job.provider.descriptor.name}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              className="flex-1 h-12 text-base font-medium"
              disabled={applying || !canSubmit()}
            >
              {applying ? 'Submitting...' : 'Submit Application'}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="h-12 px-8 text-base"
              disabled={applying}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ConsolidatedJobApplication: React.FC<ConsolidatedJobApplicationProps> = (props) => {
  return (
    <ProfileFormProvider>
      <ConsolidatedJobApplicationContent {...props} />
    </ProfileFormProvider>
  );
};

export default ConsolidatedJobApplication; 