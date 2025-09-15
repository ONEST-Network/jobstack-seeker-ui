import React, { useState } from 'react';
import CandidateDetailDialog from './candidates/CandidateDetailDialog';
import JobPostingCard from './my-jobs/JobPostingCard';
import { useTranslation } from 'react-i18next';

interface JobPosting {
  id: string;
  title: string;
  location: string;
  postedDate: string;
  salary: string;
  jobType: string;
  status: 'active' | 'closed' | 'draft';
  applicationsCount: number;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    alt?: string;
    duration?: string;
  }>;
  applications: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    appliedFor: string;
    applicationDate: string;
    status: 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
    trustScore: number;
    matchScore: number;
    experience: string;
    skills: string[];
  }>;
}

const MyJobs = () => {
  const { t } = useTranslation("myjobs");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showCandidateDialog, setShowCandidateDialog] = useState(false);

  const myJobs: JobPosting[] = [{
    id: '1',
    title: t('myJobs.jobs.seniorElectrician.title'),
    location: t('myJobs.jobs.seniorElectrician.location'),
    postedDate: '2024-01-15',
    salary: t('myJobs.jobs.seniorElectrician.salary'),
    jobType: t('myJobs.jobs.seniorElectrician.jobType'),
    status: 'active',
    applicationsCount: 12,
    media: [
      {
        type: 'video',
        url: 'https://example.com/electrician-workplace.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=200&fit=crop',
        alt: t('myJobs.jobs.seniorElectrician.media.alt1'),
        duration: '2:30'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop',
        alt: t('myJobs.jobs.seniorElectrician.media.alt2')
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=200&fit=crop',
        alt: t('myJobs.jobs.seniorElectrician.media.alt3')
      }
    ],
    applications: [{
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+91 9876543210',
      location: 'Mumbai, Maharashtra',
      appliedFor: t('myJobs.jobs.seniorElectrician.title'),
      applicationDate: '2024-01-20',
      status: 'shortlisted',
      trustScore: 85,
      matchScore: 92,
      experience: '5 years',
      skills: [t('myJobs.skills.wiring'), t('myJobs.skills.motorRepair'), t('myJobs.skills.safetyProtocols'), t('myJobs.skills.industrialEquipment')]
    }, {
      id: '2',
      name: 'Amit Sharma',
      email: 'amit.sharma@email.com',
      phone: '+91 9876543211',
      location: 'Pune, Maharashtra',
      appliedFor: t('myJobs.jobs.seniorElectrician.title'),
      applicationDate: '2024-01-18',
      status: 'reviewed',
      trustScore: 78,
      matchScore: 88,
      experience: '4 years',
      skills: [t('myJobs.skills.wiring'), t('myJobs.skills.troubleshooting'), t('myJobs.skills.circuitDesign')]
    }]
  }, {
    id: '2',
    title: t('myJobs.jobs.securityGuard.title'),
    location: t('myJobs.jobs.securityGuard.location'),
    postedDate: '2024-01-10',
    salary: t('myJobs.jobs.securityGuard.salary'),
    jobType: t('myJobs.jobs.securityGuard.jobType'),
    status: 'active',
    applicationsCount: 8,
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop',
        alt: t('myJobs.jobs.securityGuard.media.alt1')
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop',
        alt: t('myJobs.jobs.securityGuard.media.alt2')
      }
    ],
    applications: [{
      id: '3',
      name: 'Suresh Singh',
      email: 'suresh.singh@email.com',
      phone: '+91 9876543212',
      location: 'Delhi, NCR',
      appliedFor: t('myJobs.jobs.securityGuard.title'),
      applicationDate: '2024-01-12',
      status: 'applied',
      trustScore: 90,
      matchScore: 85,
      experience: '3 years',
      skills: [t('myJobs.skills.securityProtocols'), t('myJobs.skills.cctvMonitoring'), t('myJobs.skills.emergencyResponse')]
    }]
  }];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'hired':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewCandidate = (candidate: any) => {
    setSelectedCandidate(candidate);
    setShowCandidateDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('myJobs.title')}</h2>
      </div>

      <div className="space-y-6">
        {myJobs.map(job => (
          <JobPostingCard
            key={job.id}
            job={job}
            onViewCandidate={handleViewCandidate}
            getStatusColor={getStatusColor}
            getApplicationStatusColor={getApplicationStatusColor}
          />
        ))}
      </div>

      {selectedCandidate && (
        <CandidateDetailDialog 
          candidate={selectedCandidate} 
          isOpen={showCandidateDialog} 
          onClose={() => {
            setShowCandidateDialog(false);
            setSelectedCandidate(null);
          }} 
        />
      )}
    </div>
  );
};

export default MyJobs;
