import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useOrgDetails } from '@/hooks/useOrgDetails';
import { SECTORS_CONFIG, getAllAvailableRoles } from '@/constants/sectors';

export interface ProfileRestriction {
  type: 'sector' | 'role';
  value: string;
}

export interface UseProfileRestrictionsReturn {
  profileRestrictions: ProfileRestriction[];
  allowedSectors: string[];
  allowedRoles: string[];
  isRoleAllowed: (role: string) => boolean;
  isSectorAllowed: (sector: string) => boolean;
  hasRestrictions: boolean;
  loading: boolean;
}

export const useProfileRestrictions = (): UseProfileRestrictionsReturn => {
  const [profileRestrictions, setProfileRestrictions] = useState<ProfileRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { data: orgDetails, isLoading: orgLoading } = useOrgDetails(orgSlug || null);

  useEffect(() => {
    setLoading(orgLoading);
    
    // Default: no org filter or default org '0' -> no restrictions
    if (!orgSlug || orgSlug === '0') {
      setProfileRestrictions([]);
      setLoading(false);
      return;
    }

    if (orgLoading) return;

    try {
      const rawMeta = orgDetails?.data?.metadata ?? null;
      let meta: any = null;
      if (typeof rawMeta === 'string') {
        try { meta = JSON.parse(rawMeta); } catch { meta = null; }
      } else if (rawMeta && typeof rawMeta === 'object') {
        meta = rawMeta;
      }

      const restrictions: ProfileRestriction[] = [];
      const profileRestrictionsArray = meta?.profile_restriction;

      if (Array.isArray(profileRestrictionsArray)) {
        profileRestrictionsArray.forEach((restriction: string) => {
          if (typeof restriction === 'string' && restriction.trim().length > 0) {
            const trimmedRestriction = restriction.trim();
            
            // Check if it's a sector
            if (SECTORS_CONFIG[trimmedRestriction]) {
              restrictions.push({
                type: 'sector',
                value: trimmedRestriction
              });
            } else {
              // Check if it's a role
              const allRoles = getAllAvailableRoles();
              if (allRoles.includes(trimmedRestriction)) {
                restrictions.push({
                  type: 'role',
                  value: trimmedRestriction
                });
              } else {
                console.warn(`Profile restriction "${trimmedRestriction}" is neither a valid sector nor role`);
              }
            }
          }
        });
        
        console.log(`🔒 Profile restrictions processed:`, restrictions);
      }

      setProfileRestrictions(restrictions);
    } catch (error) {
      console.error('Error processing profile restrictions:', error);
      setProfileRestrictions([]);
    } finally {
      setLoading(false);
    }
  }, [orgSlug, orgLoading, orgDetails?.data?.metadata]);

  // Derive allowed sectors and roles from restrictions
  const allowedSectors = profileRestrictions
    .filter(r => r.type === 'sector')
    .map(r => r.value);

  const allowedRoles = profileRestrictions
    .filter(r => r.type === 'role')
    .map(r => r.value);

  // Add roles from allowed sectors
  const rolesFromSectors: string[] = [];
  allowedSectors.forEach(sector => {
    if (SECTORS_CONFIG[sector]) {
      rolesFromSectors.push(...SECTORS_CONFIG[sector].roles);
    }
  });

  const finalAllowedRoles = [...new Set([...allowedRoles, ...rolesFromSectors])];

  // Helper functions
  const isRoleAllowed = (role: string): boolean => {
    if (!profileRestrictions.length) return true; // No restrictions means all allowed
    return finalAllowedRoles.includes(role);
  };

  const isSectorAllowed = (sector: string): boolean => {
    if (!profileRestrictions.length) return true; // No restrictions means all allowed
    
    // Allow sector if:
    // 1. It's explicitly in allowed sectors, OR
    // 2. At least one of its roles is explicitly allowed
    if (allowedSectors.includes(sector)) return true;
    
    const sectorRoles = SECTORS_CONFIG[sector]?.roles || [];
    return sectorRoles.some(role => allowedRoles.includes(role));
  };

  const hasRestrictions = profileRestrictions.length > 0;

  return {
    profileRestrictions,
    allowedSectors,
    allowedRoles: finalAllowedRoles,
    isRoleAllowed,
    isSectorAllowed,
    hasRestrictions,
    loading
  };
};