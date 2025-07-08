
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JobData } from '@/types/jobPost';

interface BasicJobInfoCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const BasicJobInfoCard: React.FC<BasicJobInfoCardProps> = ({ jobData, setJobData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              value={jobData.title}
              onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Electrician, Welder, Security Guard"
            />
          </div>
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={jobData.location}
              onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, State"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="jobType">Job Type *</Label>
            <Select value={jobData.jobType} onValueChange={(value) => setJobData(prev => ({ ...prev, jobType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="trainee">Trainee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="salary">Salary Range *</Label>
            <Input
              id="salary"
              value={jobData.salary}
              onChange={(e) => setJobData(prev => ({ ...prev, salary: e.target.value }))}
              placeholder="₹15,000 - ₹25,000"
            />
          </div>
          <div>
            <Label htmlFor="payFrequency">Pay Frequency *</Label>
            <Select value={jobData.payFrequency} onValueChange={(value) => setJobData(prev => ({ ...prev, payFrequency: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="experience">Experience Required</Label>
            <Input
              id="experience"
              value={jobData.experience}
              onChange={(e) => setJobData(prev => ({ ...prev, experience: e.target.value }))}
              placeholder="e.g., 2-5 years"
            />
          </div>
          <div>
            <Label htmlFor="positions">Number of Positions</Label>
            <Input
              id="positions"
              type="number"
              value={jobData.positions}
              onChange={(e) => setJobData(prev => ({ ...prev, positions: parseInt(e.target.value) || 1 }))}
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="lastDate">Last Date to Apply</Label>
            <Input
              id="lastDate"
              type="date"
              value={jobData.lastDate}
              onChange={(e) => setJobData(prev => ({ ...prev, lastDate: e.target.value }))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicJobInfoCard;
