
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { JobData } from '@/types/jobPost';

interface WorkConditionsCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const WorkConditionsCard: React.FC<WorkConditionsCardProps> = ({ jobData, setJobData }) => {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Work Conditions & Benefits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="regularHours" className="text-sm font-medium">Regular Hours per Day *</Label>
            <Input
              id="regularHours"
              type="number"
              inputMode="numeric"
              value={jobData.regularHoursPerDay || ''}
              onChange={(e) => setJobData(prev => ({ ...prev, regularHoursPerDay: parseInt(e.target.value) || 0 }))}
              placeholder="8"
              min="1"
              max="12"
              className="h-touch text-base"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Overtime Available</Label>
            <div className="flex items-center space-x-3">
              <Switch
                checked={jobData.overtime}
                onCheckedChange={(checked) => setJobData(prev => ({ ...prev, overtime: checked }))}
              />
              <span className="text-sm">{jobData.overtime ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {jobData.overtime && (
          <div>
            <Label htmlFor="overtimePay" className="text-sm font-medium">Overtime Pay Rate</Label>
            <Select 
              value={jobData.overtimePay} 
              onValueChange={(value: '1x' | '1.5x' | '2x') => setJobData(prev => ({ ...prev, overtimePay: value }))}
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder="Select rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1x">1x (Regular Rate)</SelectItem>
                <SelectItem value="1.5x">1.5x (Time and Half)</SelectItem>
                <SelectItem value="2x">2x (Double Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Housing Facility</Label>
            <div className="flex items-center space-x-3">
              <Switch
                checked={jobData.housingFacility}
                onCheckedChange={(checked) => setJobData(prev => ({ ...prev, housingFacility: checked }))}
              />
              <span className="text-sm">{jobData.housingFacility ? 'Available' : 'Not Available'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Food Facility</Label>
            <div className="flex items-center space-x-3">
              <Switch
                checked={jobData.foodFacility}
                onCheckedChange={(checked) => setJobData(prev => ({ ...prev, foodFacility: checked }))}
              />
              <span className="text-sm">{jobData.foodFacility ? 'Available' : 'Not Available'}</span>
            </div>
          </div>
        </div>

        {jobData.housingFacility && (
          <div>
            <Label htmlFor="housingType" className="text-sm font-medium">Housing Type</Label>
            <Select 
              value={jobData.housingType || ''} 
              onValueChange={(value: 'dormitory' | 'shared-room' | 'individual-room') => setJobData(prev => ({ ...prev, housingType: value }))}
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder="Select housing type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dormitory">Dormitory</SelectItem>
                <SelectItem value="shared-room">Shared Room</SelectItem>
                <SelectItem value="individual-room">Individual Room</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {jobData.foodFacility && (
          <div>
            <Label htmlFor="foodType" className="text-sm font-medium">Food Type</Label>
            <Select 
              value={jobData.foodType || ''} 
              onValueChange={(value: 'meals-provided' | 'subsidized-canteen' | 'food-allowance') => setJobData(prev => ({ ...prev, foodType: value }))}
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder="Select food type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meals-provided">Meals Provided</SelectItem>
                <SelectItem value="subsidized-canteen">Subsidized Canteen</SelectItem>
                <SelectItem value="food-allowance">Food Allowance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-medium">Grade Upgradation Possibility</Label>
          <div className="flex items-center space-x-3">
            <Switch
              checked={jobData.gradeUpgradation}
              onCheckedChange={(checked) => setJobData(prev => ({ ...prev, gradeUpgradation: checked }))}
            />
            <span className="text-sm">{jobData.gradeUpgradation ? 'Available' : 'Not Available'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkConditionsCard;
