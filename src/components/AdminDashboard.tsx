import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
  AlertCircle,
  RefreshCw,
  Shield,
  Home
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { buildSeekerUrl } from '@/lib/utils';



interface AdminApiResponse {
  statusCode: number;
  message: string;
  data: {
    totalCount: string;
    totalProfiles?: number;
    users: string[];
  };
}

interface AdminStats {
  totalStudents: number;
  totalProfiles: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalProfiles: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, hasAdminRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug?: string }>();



  const fetchAdminStats = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
      
      // Fetch users by role (total members of the organization)
      const usersByRoleUrl = `${API_BASE_URL}/admin/users/by-role?${orgSlug ? `organizationSlug=${orgSlug}&` : ''}type=both&limit=50000&page=1&role=seeker`;
      const usersByRoleRes = await fetch(usersByRoleUrl, {
        headers: {
          'Authorization': `Bearer ${apiClient['authToken']}`,
          'Content-Type': 'application/json',
        },
      });
      const usersByRoleData: AdminApiResponse = usersByRoleRes.ok ? await usersByRoleRes.json() : { 
        statusCode: 200, 
        message: "No data", 
        data: { totalCount: "0", users: [] } 
      };

      // Fetch users with profiles
      const usersWithProfilesUrl = `${API_BASE_URL}/admin/users/with-profile?${orgSlug ? `organizationSlug=${orgSlug}&` : ''}type=both&limit=50000&page=1`;
      const usersWithProfilesRes = await fetch(usersWithProfilesUrl, {
        headers: {
          'Authorization': `Bearer ${apiClient['authToken']}`,
          'Content-Type': 'application/json',
        },
      });
      const usersWithProfilesData: AdminApiResponse = usersWithProfilesRes.ok ? await usersWithProfilesRes.json() : { 
        statusCode: 200, 
        message: "No data", 
        data: { totalCount: "0", totalProfiles: 0, users: [] } 
      };

      // Calculate stats from API responses
      const totalStudents = parseInt(usersByRoleData.data?.totalCount || '0', 10);
      const totalProfiles = usersWithProfilesData.data?.totalProfiles || parseInt(usersWithProfilesData.data?.totalCount || '0', 10);

      setStats({
        totalStudents,
        totalProfiles
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, orgSlug]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdminStats();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Admin statistics have been updated.",
    });
  };

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  // If user is not logged in, show authentication required message
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to access the admin dashboard.
            </p>
            <Button onClick={() => navigate(buildSeekerUrl(orgSlug, 'discover'))} className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not admin, show access denied message
  if (!hasAdminRole()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin dashboard.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Contact your administrator if you believe this is an error.
            </p>
            <Button onClick={() => navigate(buildSeekerUrl(orgSlug, 'discover'))} className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Overview of student statistics
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="mt-4 sm:mt-0 w-full sm:w-auto py-3 touch-manipulation"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Number of Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {isLoading ? '...' : stats.totalStudents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Students who have created accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Number of Profiles</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
              {isLoading ? '...' : stats.totalProfiles.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Profiles Created by all Students
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
