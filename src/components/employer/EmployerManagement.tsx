import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth, EmployerProfile } from '@/contexts/AuthContext';
import EmployerCard from './EmployerCard';
import EmployerProfileDialog from './EmployerProfileDialog';

const EmployerManagement = () => {
  const { t } = useTranslation("employermanagement");
  const { user, selectEmployer, deleteEmployer, getSelectedEmployer } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<EmployerProfile | null>(null);
  const selectedEmployer = getSelectedEmployer();

  const handleSelectEmployer = (employerId: string) => {
    selectEmployer(employerId);
  };

  const handleEditEmployer = (employer: EmployerProfile) => {
    setEditingEmployer(employer);
  };

  const handleDeleteEmployer = (employerId: string) => {
    if (employerId === 'default-employer') {
      alert(t('employerManagement.cannotDeleteDefault'));
      return;
    }

    if (confirm(t('employerManagement.confirmDelete'))) {
      deleteEmployer(employerId);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingEmployer(null);
  };

  if (!user) return null;

  const sortedEmployers = [...user.managedEmployers].sort((a, b) => {
    if (a.id === 'default-employer') return -1;
    if (b.id === 'default-employer') return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('employerManagement.title')}</h2>
          <p className="text-muted-foreground">{t('employerManagement.subtitle')}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('employerManagement.addEmployer')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEmployers.map((employer) => (
          <EmployerCard
            key={employer.id}
            employer={employer}
            isSelected={selectedEmployer?.id === employer.id}
            onSelect={() => handleSelectEmployer(employer.id)}
            onEdit={() => handleEditEmployer(employer)}
            onDelete={() => handleDeleteEmployer(employer.id)}
            isDefault={employer.id === 'default-employer'}
          />
        ))}
      </div>

      <EmployerProfileDialog
        isOpen={showAddDialog || !!editingEmployer}
        onClose={handleCloseDialog}
        employer={editingEmployer || undefined}
      />
    </div>
  );
};

export default EmployerManagement;
