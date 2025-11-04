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
import { useTranslation } from '@/hooks/useI18n';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import GuardianVerificationModal from './GuardianVerificationModal';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ConsolidatedJobApplicationProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationData: JobApplicationData) => Promise<void>;
  onSaveDraft?: (applicationData: JobApplicationData) => Promise<void>;
  job: any;
  selectedProfile: any;
  applying?: boolean;
  savingDraft?: boolean;
}

const ConsolidatedJobApplicationContent: React.FC<ConsolidatedJobApplicationProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
  job,
  selectedProfile,
  applying = false,
  savingDraft = false
}) => {
  const { user } = useAuth();
  const { profile, setProfile } = useProfileForm();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [guardianDetails, setGuardianDetails] = useState<any>(null);
  const [pendingApplicationData, setPendingApplicationData] = useState<JobApplicationData | null>(null);
  const [profileConsentAccepted, setProfileConsentAccepted] = useState(false);
  const { toast } = useToast();
  const t = useTranslation('jobApplication');

  // Helper function to map job title to role name
  const getRoleFromJobTitle = (jobTitle: string): string => {
    const lowerJobTitle = jobTitle.toLowerCase();
    
    // Map based on keywords in the job title - Order matters! More specific patterns first
    
    // Check for specific multi-word patterns first
    if (lowerJobTitle.includes('data entry operator') || lowerJobTitle.includes('data entry') || lowerJobTitle.includes('data-entry-operator') || lowerJobTitle.includes('data-entry')) {
      return 'Data Entry Operator';
    }
    if (lowerJobTitle.includes('tele sales') || lowerJobTitle.includes('telesales') || lowerJobTitle.includes('tele salesperson') || lowerJobTitle.includes('telecaller') || lowerJobTitle.includes('tele-sales') || lowerJobTitle.includes('tele-salesperson')) {
      return 'Tele Salesperson';
    }
    if (lowerJobTitle.includes('field sales person') || lowerJobTitle.includes('field salesperson') || lowerJobTitle.includes('field-sales-person') || lowerJobTitle.includes('field-salesperson')) {
      return 'Field Sales Person';
    }
    if (lowerJobTitle.includes('machine operator')) {
      return 'Machine Operator';
    }
    if (lowerJobTitle.includes('iti') || lowerJobTitle.includes('industrial training') || lowerJobTitle.includes('technical') || lowerJobTitle.includes('vocational')) {
      return 'ITI (Other)';
    }
    
    // Then check for more general patterns
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
    if (lowerJobTitle.includes('electrician') || lowerJobTitle.includes('electrical') || lowerJobTitle.includes('wiring')) {
      return 'Electrician';
    }
    if (lowerJobTitle.includes('fitter') || lowerJobTitle.includes('fitting') || lowerJobTitle.includes('assembly')) {
      return 'Fitter';
    }
    if (lowerJobTitle.includes('mechanic') || lowerJobTitle.includes('maintenance') || lowerJobTitle.includes('repair')) {
      return 'Mechanic';
    }
    if (lowerJobTitle.includes('operator') || lowerJobTitle.includes('machine')) {
      return 'Machine Operator';
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

  const submitApplication = async (applicationData: JobApplicationData) => {
    await onSubmit(applicationData);
  };

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
      profileId: selectedProfile?.id, // Include the profile ID
      profileData: {
        whoIAm: profile.whoIAm || {},
        whatIHave: profile.whatIHave || {},
        whatIWant: profile.whatIWant || {},
        ...profile
      }
    };

    // Check if user is a minor
    if (user?.isMinor === true) {
      try {
        // Call guardian details API
        const guardianResponse = await apiClient.getGuardianDetails();
        
        if (guardianResponse.status === true && guardianResponse.guardian) {
          // User has a guardian - show verification modal
          setGuardianDetails(guardianResponse.guardian);
          setPendingApplicationData(applicationData);
          setShowGuardianModal(true);
          return; // Don't submit yet, wait for guardian verification
        } else {
          // No guardian found - proceed with normal application flow
          // (non-minor consent flow will be handled by backend)
          await submitApplication(applicationData);
        }
      } catch (error) {
        console.error('Error checking guardian details:', error);
        // If guardian check fails, proceed with application (non-blocking)
        toast({
          title: 'Warning',
          description: 'Could not verify guardian consent. Proceeding with application.',
          variant: 'default'
        });
        await submitApplication(applicationData);
      }
    } else {
      // User is not a minor - check if consent checkbox is checked
      if (!profileConsentAccepted) {
        toast({
          title: 'Consent Required',
          description: 'Please accept the consent checkbox to proceed with the application.',
          variant: 'destructive'
        });
        return;
      }

      // Create user consent before submitting application
      try {
        if (selectedProfile?.id) {
          await apiClient.createUserConsent({
            entityId: selectedProfile.id,
            consentType: 'profile'
          });
        }
      } catch (consentError) {
        console.error('Error creating user consent:', consentError);
        // Don't block the flow if consent creation fails
        toast({
          title: 'Warning',
          description: 'Could not record consent. Proceeding with application.',
          variant: 'default'
        });
      }

      // Proceed with normal application
      await submitApplication(applicationData);
    }
  };

  const handleGuardianVerificationSuccess = async () => {
    setShowGuardianModal(false);
    
    // After guardian verification succeeds, proceed with application submission
    if (pendingApplicationData) {
      await submitApplication(pendingApplicationData);
      setPendingApplicationData(null);
    }
  };

  const handleSaveDraft = async () => {
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
      profileId: selectedProfile?.id, // Include the profile ID
      profileData: {
        whoIAm: profile.whoIAm || {},
        whatIHave: profile.whatIHave || {},
        whatIWant: profile.whatIWant || {},
        ...profile
      }
    };

    if (onSaveDraft) {
      await onSaveDraft(applicationData);
    }
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
              // Skip verification status fields
              if (key === 'isAgeVerified' || key === 'isNameVerified' || key === 'isPhoneVerified' || key === 'isLocationVerified' || key === 'isGenderVerified' || key === 'isAadharVerified' || key === 'isHometownVerified') return null;
              // Skip empty values and known non-display keys
              if (value === undefined || value === null || value === '' || key === 'gps' || key === 'tag') return null;
              // If this is a structured location object (not a simple string), skip it to avoid duplicate Location Data display
              if (typeof value === 'object' && !Array.isArray(value) && /location/i.test(key)) return null;
              if (Array.isArray(value) && value.length === 0) return null;

              // Prepare a display string for nested objects (avoid [object Object])
              let display: string | null = null;

              if (typeof value === 'object' && !Array.isArray(value)) {
                // Special-case location objects with common fields
                if (value && (value.address || value.city || value.state || value.country)) {
                  const parts: string[] = [];
                  if (value.address) parts.push(value.address);
                  if (value.city) parts.push(String(value.city));
                  if (value.state) parts.push(String(value.state));
                  if (value.country) parts.push(String(value.country));
                  display = parts.join(', ');
                } else {
                  // Fallback: flatten inner object to key: value pairs
                  const inner = Object.entries(value)
                    .filter(([, v]) => v !== undefined && v !== null && v !== '')
                    .map(([k, v]) => `${formatKey(k)}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
                    .join(' • ');
                  display = inner || null;
                }
              } else if (Array.isArray(value)) {
                display = value.join(', ');
              } else {
                display = String(value);
              }

              if (!display) return null;

              return (
                <div key={key} className="p-3 rounded-lg bg-gray-50">
                  <div className="text-sm font-medium text-muted-foreground">
                    {formatKey(key)}
                  </div>
                  <div className="text-base font-semibold break-words">
                    {display}
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
    <>
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

          {/* Consent Checkbox for Non-Minor Users */}
          {user?.isMinor !== true && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="profile-consent"
                    checked={profileConsentAccepted}
                    onCheckedChange={(checked) => setProfileConsentAccepted(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="profile-consent" className="text-sm leading-relaxed cursor-pointer">
                    I consent to share my profile and application details with the selected Job Provider to enable this application. I understand that the Job Provider will handle this information under their own policies, and EkStep is not responsible for its use once shared.
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex-shrink-0 border-t pt-4">
            <div className="flex gap-3">
              <Button 
                onClick={handleSubmit} 
                className="flex-1 h-12 text-base font-medium"
                disabled={applying || savingDraft || !canSubmit() || (user?.isMinor !== true && !profileConsentAccepted)}
              >
                {applying ? t('actions.submitting', 'Submitting...') : t('actions.submit', 'Submit Application')}
              </Button>
              {/* Save Draft button disabled
              {onSaveDraft && (
                <Button 
                  onClick={handleSaveDraft} 
                  variant="secondary"
                  className="h-12 px-6 text-base font-medium"
                  disabled={applying || savingDraft || !canSubmit()}
                >
                  {savingDraft ? 'Saving...' : 'Save Draft'}
                </Button>
              )}
              */}
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="h-12 px-8 text-base"
                disabled={applying || savingDraft}
              >
                {t('actions.cancel', 'Cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {guardianDetails && (
        <GuardianVerificationModal
          isOpen={showGuardianModal}
          onClose={() => {
            setShowGuardianModal(false);
            setGuardianDetails(null);
            setPendingApplicationData(null);
          }}
          onSuccess={handleGuardianVerificationSuccess}
          guardianDetails={guardianDetails}
          profileId={selectedProfile?.id || ''}
        />
      )}
    </>
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