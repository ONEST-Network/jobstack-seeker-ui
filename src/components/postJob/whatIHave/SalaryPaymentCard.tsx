
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import { JobData } from '@/types/jobPost';

interface SalaryPaymentCardProps {
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

const SalaryPaymentCard: React.FC<SalaryPaymentCardProps> = ({ jobData, setJobData }) => {
  // Auto-calculate in-hand salary
  useEffect(() => {
    const inHand = jobData.monthlySalary - (jobData.pfDeduction || 0) - (jobData.esicDeduction || 0);
    setJobData(prev => ({ ...prev, inHandSalary: Math.max(0, inHand) }));
  }, [jobData.monthlySalary, jobData.pfDeduction, jobData.esicDeduction, setJobData]);

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          Salary & Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="monthlySalary" className="text-sm font-medium">Monthly Salary (₹) *</Label>
            <Input
              id="monthlySalary"
              type="number"
              inputMode="numeric"
              value={jobData.monthlySalary || ''}
              onChange={(e) => setJobData(prev => ({ ...prev, monthlySalary: parseInt(e.target.value) || 0 }))}
              placeholder="15000"
              className="h-touch text-base"
            />
          </div>
          <div>
            <Label htmlFor="salaryFrequency" className="text-sm font-medium">Salary Settlement Frequency *</Label>
            <Select 
              value={jobData.salaryFrequency} 
              onValueChange={(value: 'weekly' | 'monthly') => setJobData(prev => ({ ...prev, salaryFrequency: value }))}
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pfDeduction" className="text-sm font-medium">PF Deduction (₹)</Label>
            <Input
              id="pfDeduction"
              type="number"
              inputMode="numeric"
              value={jobData.pfDeduction || ''}
              onChange={(e) => setJobData(prev => ({ ...prev, pfDeduction: parseInt(e.target.value) || 0 }))}
              placeholder="1800"
              className="h-touch text-base"
            />
          </div>
          <div>
            <Label htmlFor="esicDeduction" className="text-sm font-medium">ESIC Deduction (₹)</Label>
            <Input
              id="esicDeduction"
              type="number"
              inputMode="numeric"
              value={jobData.esicDeduction || ''}
              onChange={(e) => setJobData(prev => ({ ...prev, esicDeduction: parseInt(e.target.value) || 0 }))}
              placeholder="135"
              className="h-touch text-base"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="inHandSalary" className="text-sm font-medium">In-Hand Salary (₹)</Label>
          <Input
            id="inHandSalary"
            type="number"
            value={jobData.inHandSalary || 0}
            readOnly
            className="bg-green-50 font-semibold h-touch text-base"
          />
          <p className="text-xs text-muted-foreground mt-1">Auto-calculated: Monthly Salary - PF - ESIC</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="advanceMonths" className="text-sm font-medium">Advance Options (Months)</Label>
            <Input
              id="advanceMonths"
              type="number"
              inputMode="numeric"
              value={jobData.advanceMonths || ''}
              onChange={(e) => setJobData(prev => ({ ...prev, advanceMonths: parseInt(e.target.value) || 0 }))}
              placeholder="3"
              min="0"
              max="12"
              className="h-touch text-base"
            />
          </div>
          <div>
            <Label htmlFor="advanceFrequency" className="text-sm font-medium">Advance Frequency</Label>
            <Select 
              value={jobData.advanceFrequency} 
              onValueChange={(value: 'monthly' | 'quarterly' | 'half-yearly') => setJobData(prev => ({ ...prev, advanceFrequency: value }))}
            >
              <SelectTrigger className="h-touch">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="half-yearly">Half-Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryPaymentCard;
