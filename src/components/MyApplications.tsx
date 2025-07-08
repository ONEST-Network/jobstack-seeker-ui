
import React from 'react';
import ApplicationTabs from './my-applications/ApplicationTabs';

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  appliedDate: string;
  status: 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    alt?: string;
    duration?: string;
  }>;
}

const MyApplications = () => {
  const applications: JobApplication[] = [
    {
      id: '1',
      jobId: '1',
      jobTitle: 'Electrician',
      company: 'PowerTech Solutions',
      location: 'Mumbai, Maharashtra',
      salary: '₹25,000 - ₹35,000',
      appliedDate: '2024-01-20',
      status: 'shortlisted',
      media: [{
        type: 'image',
        url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=200&fit=crop',
        alt: 'Electrician work'
      }]
    },
    {
      id: '2',
      jobId: '2',
      jobTitle: 'Welder',
      company: 'MetalWorks Industries',
      location: 'Pune, Maharashtra',
      salary: '₹22,000 - ₹30,000',
      appliedDate: '2024-01-18',
      status: 'viewed',
      media: [{
        type: 'image',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=200&fit=crop',
        alt: 'Welder work'
      }]
    },
    {
      id: '3',
      jobId: '3',
      jobTitle: 'Security Guard',
      company: 'SecureNation Services',
      location: 'Delhi, NCR',
      salary: '₹18,000 - ₹22,000',
      appliedDate: '2024-01-15',
      status: 'applied',
      media: [{
        type: 'image',
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop',
        alt: 'Security work'
      }]
    }
  ];

  const activeApplications = applications.filter(app => 
    !['hired', 'rejected'].includes(app.status)
  );
  const completedApplications = applications.filter(app => 
    ['hired', 'rejected'].includes(app.status)
  );

  return (
    <div className="space-y-6">

      <ApplicationTabs 
        activeApplications={activeApplications}
        completedApplications={completedApplications}
      />
    </div>
  );
};

export default MyApplications;
