
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { Experience } from '@/contexts/AuthContext';
import { useProfileForm } from '../ProfileFormProvider';

const ExperienceStep: React.FC = () => {
  const { profile, setProfile, newExperience, setNewExperience } = useProfileForm();

  const addExperience = () => {
    if (newExperience.designation && newExperience.company) {
      const experience: Experience = {
        id: Date.now().toString(),
        designation: newExperience.designation!,
        company: newExperience.company!,
        location: newExperience.location || '',
        duration: newExperience.duration || '',
        workType: newExperience.workType as Experience['workType'] || 'full-time',
        description: newExperience.description || ''
      };
      
      setProfile({
        ...profile,
        experience: [...(profile.experience || []), experience]
      });
      
      setNewExperience({
        designation: '',
        company: '',
        location: '',
        duration: '',
        workType: 'full-time',
        description: ''
      });
    }
  };

  const removeExperience = (id: string) => {
    setProfile({
      ...profile,
      experience: (profile.experience || []).filter(exp => exp.id !== id)
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Work Experience</h3>
      
      {profile.experience && profile.experience.length > 0 && (
        <div className="space-y-2">
          {profile.experience.map((exp) => (
            <Card key={exp.id} className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{exp.designation}</h4>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  <p className="text-xs text-muted-foreground">{exp.duration}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExperience(exp.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4">
        <h4 className="font-medium mb-3">Add Experience</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Designation"
              value={newExperience.designation || profile.interestedRole || ''}
              onChange={(e) => setNewExperience({ ...newExperience, designation: e.target.value })}
            />
            <Input
              placeholder="Company"
              value={newExperience.company || ''}
              onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Location"
              value={newExperience.location || ''}
              onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
            />
            <Input
              placeholder="Duration (e.g., 2 years)"
              value={newExperience.duration || ''}
              onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="Job description"
            value={newExperience.description || ''}
            onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
          />
          <Button onClick={addExperience} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Experience
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ExperienceStep;
