
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth, EmployerProfile } from '@/contexts/AuthContext';
import EmployerCard from './EmployerCard';
import EmployerProfileDialog from './EmployerProfileDialog';

const EmployerManagement = () => {
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
    // Prevent deletion of default employer
    if (employerId === 'default-employer') {
      alert('Cannot delete the default employer profile. This represents your organization.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this employer profile?')) {
      deleteEmployer(employerId);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingEmployer(null);
  };

  if (!user) return null;

  // Sort employers to show default employer first
  const sortedEmployers = [...user.managedEmployers].sort((a, b) => {
    if (a.id === 'default-employer') return -1;
    if (b.id === 'default-employer') return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employer Management</h2>
          <p className="text-muted-foreground">
            Manage employer profiles and switch between different companies
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employer
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
