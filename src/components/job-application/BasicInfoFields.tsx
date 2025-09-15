
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BasicInfoFieldsProps {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({ formData, setFormData }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <Label htmlFor="name" className="text-base mb-2 block">Full Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="bg-green-50 h-12 text-base"
        />
      </div>
      <div>
        <Label htmlFor="email" className="text-base mb-2 block">Email</Label>
        <Input
          id="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="bg-green-50 h-12 text-base"
        />
      </div>
      <div>
        <Label htmlFor="phone" className="text-base mb-2 block">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="bg-green-50 h-12 text-base"
        />
      </div>
    </div>
  );
};

export default BasicInfoFields;
