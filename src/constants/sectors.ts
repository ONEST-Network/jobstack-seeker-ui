import { jobSectorsConfig } from '@/schemas';

// Helper function to get sector for a role
export const getSectorForRole = (role: string): string => {
  for (const [sectorName, sectorData] of Object.entries(jobSectorsConfig.sectors)) {
    if (sectorData.roles.includes(role)) {
      return sectorName;
    }
  }
  return 'Other';
};

// Helper function to get all roles grouped by sector
export const getRolesBySector = () => {
  return jobSectorsConfig.sectors;
};

// Helper function to get all available roles
export const getAllAvailableRoles = (): string[] => {
  const allRoles: string[] = [];
  Object.values(jobSectorsConfig.sectors).forEach(sector => {
    allRoles.push(...sector.roles);
  });
  return allRoles;
};

// Export the sector configuration
export const SECTORS_CONFIG = jobSectorsConfig.sectors;
