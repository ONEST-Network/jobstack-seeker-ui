import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Calendar, 
  Star, 
  Award, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Briefcase,
  FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  appliedFor: string;
  applicationDate: string;
  status: 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  trustScore: number;
  matchScore: number;
  experience: string;
  skills: string[];
  avatar?: string;
}

interface CandidateDetailDialogProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateDetailDialog: React.FC<CandidateDetailDialogProps> = ({
  candidate,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { t } = useTranslation('candidateDetail');

  const mockApplicationResponses = [
    { question: t('application.responses.q1'), answer: t('application.responses.a1') },
    { question: t('application.responses.q2'), answer: t('application.responses.a2') },
    { question: t('application.responses.q3'), answer: t('application.responses.a3') }
  ];

  const mockDocuments = [
    { name: 'Resume.pdf', type: t('documents.types.resume'), verified: true },
    { name: 'Electrical_Certificate.pdf', type: t('documents.types.certificate'), verified: true },
    { name: 'Experience_Letter.pdf', type: t('documents.types.experience'), verified: false }
  ];

  const getStatusLabel = (status: string) => t(`status.${status}`);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-lg">
                {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-xl">{candidate.name}</DialogTitle>
                <p className="text-muted-foreground">{candidate.appliedFor}</p>
              </div>
            </div>
            <Badge className={getStatusColor(candidate.status)}>
              {getStatusLabel(candidate.status)}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
            <TabsTrigger value="application">{t('tabs.application')}</TabsTrigger>
            <TabsTrigger value="documents">{t('tabs.documents')}</TabsTrigger>
            <TabsTrigger value="actions">{t('tabs.actions')}</TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('profile.personalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {t('profile.experience', { exp: candidate.experience })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    {t('profile.scores')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('profile.trustScore')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-yellow-500 rounded-full" style={{ width: `0%` }} />
                      </div>
                      <span className="text-sm font-medium">0/10</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('profile.matchScore')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{ width: `${candidate.matchScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{candidate.matchScore}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {t('profile.skills')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Application */}
          <TabsContent value="application" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('application.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {t('application.appliedOn', { date: new Date(candidate.applicationDate).toLocaleDateString() })}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">{t('application.responses.title')}</h4>
                  {mockApplicationResponses.map((response, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <p className="font-medium text-sm mb-2">{response.question}</p>
                      <p className="text-sm text-muted-foreground">{response.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('documents.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.verified ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <Button variant="outline" size="sm">
                          {t('documents.view')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions */}
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('actions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('actions.shortlist')}
                  </Button>
                  <Button variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('actions.reject')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetailDialog;
