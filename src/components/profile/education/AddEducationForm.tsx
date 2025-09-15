import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Plus } from 'lucide-react';
import { Education } from '@/types/profile';
import QRCodeScannerDialog from '../QRCodeScannerDialog';

interface AddEducationFormProps {
  onAdd: (education: Education) => void;
}

const AddEducationForm: React.FC<AddEducationFormProps> = ({ onAdd }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [newEducation, setNewEducation] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: new Date().getFullYear(),
    percentage: undefined,
    isVerified: false
  });

  const handleAddEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      const educationEntry: Education = {
        id: Date.now().toString(),
        institution: newEducation.institution || '',
        degree: newEducation.degree || '',
        fieldOfStudy: newEducation.fieldOfStudy || '',
        startYear: newEducation.startYear || new Date().getFullYear(),
        endYear: newEducation.endYear,
        percentage: newEducation.percentage,
        grade: newEducation.grade,
        isVerified: newEducation.isVerified || false,
        certificateUrl: newEducation.certificateUrl,
        qrCodeData: newEducation.qrCodeData
      };
      
      onAdd(educationEntry);
      setNewEducation({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startYear: new Date().getFullYear(),
        percentage: undefined,
        isVerified: false
      });
    }
  };

  const handleQRScanComplete = (data: any) => {
    setNewEducation({
      ...newEducation,
      ...data,
      id: Date.now().toString()
    });
  };

  return (
    <>
      <div className="space-y-4 p-4 border-2 border-dashed border-gray-200 rounded-lg">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Add Education</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScanner(true)}
          >
            <QrCode className="h-4 w-4 mr-1" />
            Scan Certificate
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="institution">Institution *</Label>
            <Input
              id="institution"
              value={newEducation.institution || ''}
              onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              placeholder="School/College/University"
            />
          </div>

          <div>
            <Label htmlFor="degree">Class or Degree *</Label>
            <Select
              value={newEducation.degree || ''}
              onValueChange={(value) => setNewEducation({ ...newEducation, degree: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class or degree" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="below-10th">Below 10th</SelectItem>
                <SelectItem value="10th">10th Standard</SelectItem>
                <SelectItem value="12th">12th Standard</SelectItem>
                <SelectItem value="diploma">Diploma</SelectItem>
                <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fieldOfStudy">Field of Study</Label>
            <Input
              id="fieldOfStudy"
              value={newEducation.fieldOfStudy || ''}
              onChange={(e) => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })}
              placeholder="e.g., Electrical Engineering"
            />
          </div>

          <div>
            <Label htmlFor="percentage">Percentage/Grade</Label>
            <Input
              id="percentage"
              type="number"
              value={newEducation.percentage || ''}
              onChange={(e) => setNewEducation({ ...newEducation, percentage: parseInt(e.target.value) })}
              placeholder="Enter percentage"
            />
          </div>

          <div>
            <Label htmlFor="startDate">Start Month & Year</Label>
            <Input
              id="startDate"
              type="month"
              value={newEducation.startDate || ''}
              onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Month & Year</Label>
            <Input
              id="endDate"
              type="month"
              value={newEducation.endDate || ''}
              onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
              placeholder="Leave empty if ongoing"
            />
          </div>
        </div>

        <Button onClick={handleAddEducation} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Education
        </Button>
      </div>

      <QRCodeScannerDialog
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanComplete={handleQRScanComplete}
        type="education"
      />
    </>
  );
};

export default AddEducationForm;