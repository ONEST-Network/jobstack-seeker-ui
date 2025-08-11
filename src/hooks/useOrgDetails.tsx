import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface OrgDetails {
  name: string;
  slug: string;
  logo: string | null;
  metadata: any | null;
}

interface OrgDetailsResponse {
  statusCode: number;
  message: string;
  data: OrgDetails;
}

export const useOrgDetails = (orgSlug: string | null) => {
  return useQuery({
    queryKey: ['orgDetails', orgSlug],
    queryFn: async (): Promise<OrgDetailsResponse> => {
      if (!orgSlug || orgSlug === '0') {
        throw new Error('No organization slug provided');
      }
      return apiClient.getOrgDetails(orgSlug);
    },
    enabled: !!orgSlug && orgSlug !== '0',
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
