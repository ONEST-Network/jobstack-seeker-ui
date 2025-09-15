import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { FileUploadField } from '@/components/ui/file-upload-field';

interface ApplicationQuestionsProps {
  formData: {
    experience: string;
    whyJoin: string;
    previousWork: string;
    taskVideo?: string;
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
  const { t } = useTranslation("applicationquestions");

  return (
    <div className="space-y-6">
      {/* Experience */}
      <div>
        <Label htmlFor="experience" className="text-base mb-2 block">
          {t('applicationQuestions.experience.label')}
        </Label>
        <div className="flex gap-3">
          <Input
            id="experience"
            value={formData.experience}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                experience: e.target.value
              }))
            }
            placeholder={t('applicationQuestions.experience.placeholder')}
            className="h-12 text-base"
          />
        </div>
      </div>

      {/* Why Join */}
      <div>
        <Label htmlFor="whyJoin" className="text-base mb-2 block">
          {t('applicationQuestions.whyJoin.label')}
        </Label>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Textarea
              id="whyJoin"
              value={formData.whyJoin}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  whyJoin: e.target.value
                }))
              }
              placeholder={t('applicationQuestions.whyJoin.placeholder')}
              rows={4}
              className="text-base"
            />
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleVoiceInput('whyJoin')}
              className={`px-4 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
            >
              {isRecording ? (
                <Square className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </div>
          {isRecording && (
            <div className="text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-md">
              <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
              {t('applicationQuestions.recordingMessage')}
            </div>
          )}
        </div>
      </div>

      {/* Previous Work */}
      <div>
        <Label htmlFor="previousWork" className="text-base mb-2 block">
          {t('applicationQuestions.previousWork.label')}
        </Label>
        <div className="flex gap-3">
          <Textarea
            id="previousWork"
            value={formData.previousWork}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                previousWork: e.target.value
              }))
            }
            placeholder={t('applicationQuestions.previousWork.placeholder')}
            rows={4}
            className="text-base"
          />
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleVoiceInput('previousWork')}
            className={`px-4 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
          >
            {isRecording ? (
              <Square className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Task Video */}
      <div>
        <Label className="text-base mb-2 block">
          {t('applicationQuestions.taskVideo.label')}
        </Label>
        <FileUploadField
          label=""
          description={t('applicationQuestions.taskVideo.description')}
          accept="video/*"
          fileType="video"
          value={formData.taskVideo}
          onChange={(file) =>
            setFormData((prev) => ({
              ...prev,
              taskVideo: file
            }))
          }
          usePresignedUrl={true}
          objectKeyPrefix="application"
        />
      </div>
    </div>
  );
};

export default ApplicationQuestions;
