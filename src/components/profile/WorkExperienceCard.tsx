import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Trash2, Shield } from 'lucide-react';
import { WorkExperience } from '@/types/profile';

interface WorkExperienceCardProps {
  experiences: WorkExperience[];
  onChange: (experiences: WorkExperience[]) => void;
}

const WorkExperienceCard: React.FC<WorkExperienceCardProps> = ({
  experiences,
  onChange
}) => {
  const [newExperience, setNewExperience] = useState<Partial<WorkExperience>>({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    isVerified: false
  });

  const handleAddExperience = () => {
    if (newExperience.company && newExperience.position) {
      const experience: WorkExperience = {
        id: Date.now().toString(),
        company: newExperience.company || '',
        position: newExperience.position || '',
        location: newExperience.location || '',
        startDate: newExperience.startDate || '',
        endDate: newExperience.endDate,
        description: newExperience.description || '',
        isVerified: newExperience.isVerified || false
      };
      
      onChange([...experiences, experience]);
      setNewExperience({
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
        isVerified: false
      });
    }
  };

  const handleRemoveExperience = (id: string) => {
    onChange(experiences.filter(exp => exp.id !== id));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + '-01');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Work Experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Experience List */}
        {experiences.map((exp) => (
          <Card key={exp.id} className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium">{exp.position}</h4>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {exp.location && `${exp.location} • `}
                    {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {exp.isVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveExperience(exp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Experience Form */}
        <div className="space-y-4 p-4 border-2 border-dashed border-gray-200 rounded-lg">
          <h4 className="font-medium">Add Work Experience</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={newExperience.company || ''}
                onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label htmlFor="position">Position/Role *</Label>
              <Input
                id="position"
                value={newExperience.position || ''}
                onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                placeholder="e.g., Industrial Tailor"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newExperience.location || ''}
                onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                placeholder="Work location"
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Month & Year (MM/YYYY) *</Label>
              <Input
                id="startDate"
                type="month"
                value={newExperience.startDate || ''}
                onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                placeholder="MM/YYYY"
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Month & Year (MM/YYYY)</Label>
              <Input
                id="endDate"
                type="month"
                value={newExperience.endDate || ''}
                onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                placeholder="MM/YYYY or leave empty if current job"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={newExperience.description || ''}
                onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                placeholder="Brief description of your role and responsibilities"
              />
            </div>
          </div>

          <Button onClick={handleAddExperience} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Experience
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkExperienceCard;
