import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
interface ApplicationQuestionsProps {
  formData: {
    experience: string;
    whyJoin: string;
    previousWork: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isRecording: boolean;
  handleVoiceInput: (field: string) => void;
}
const ApplicationQuestions: React.FC<ApplicationQuestionsProps> = ({
  formData,
  setFormData,
  isRecording,
  handleVoiceInput
}) => {
  return <div className="space-y-6">
      <div>
        <Label htmlFor="experience" className="text-base mb-2 block">
          Years of Experience in this field
        </Label>
        <div className="flex gap-3">
          <Input id="experience" value={formData.experience} onChange={e => setFormData(prev => ({
          ...prev,
          experience: e.target.value
        }))} placeholder="Example: 2 years" className="h-12 text-base" />
          
        </div>
      </div>

      <div>
        <Label htmlFor="whyJoin" className="text-base mb-2 block">
          Why do you want to join this company?
        </Label>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Textarea id="whyJoin" value={formData.whyJoin} onChange={e => setFormData(prev => ({
            ...prev,
            whyJoin: e.target.value
          }))} placeholder="Tell us why you're interested in this role..." rows={4} className="text-base" />
            <Button variant="outline" size="lg" onClick={() => handleVoiceInput('whyJoin')} className={`px-4 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}>
              {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </div>
          {isRecording && <div className="text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-md">
              <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
              Recording... Click stop when done
            </div>}
        </div>
      </div>

      <div>
        <Label htmlFor="previousWork" className="text-base mb-2 block">
          Describe your previous work experience
        </Label>
        <div className="flex gap-3">
          <Textarea id="previousWork" value={formData.previousWork} onChange={e => setFormData(prev => ({
          ...prev,
          previousWork: e.target.value
        }))} placeholder="Describe your previous work experience..." rows={4} className="text-base" />
          <Button variant="outline" size="lg" onClick={() => handleVoiceInput('previousWork')} className={`px-4 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}>
            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>;
};
export default ApplicationQuestions;