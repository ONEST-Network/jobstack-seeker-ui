import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Building2,
  Briefcase,
  Shield,
  Home,
  Menu
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
    totalProfiles?: number; // New field for profiles count
    users: string[];
  };
}

interface AdminStats {
  totalStudents: number;
  studentsPlaced: number;
  studentsWithProfiles: number;
  studentsApplied: number;
  studentsShortlisted: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    studentsPlaced: 0,
    studentsWithProfiles: 0,
    studentsApplied: 0,
    studentsShortlisted: 0
  });
  const [usersByRole, setUsersByRole] = useState<string[]>([]);
  const [usersByStatus, setUsersByStatus] = useState<string[]>([]);
  const [usersWithApplications, setUsersWithApplications] = useState<string[]>([]);
  const [usersWithProfiles, setUsersWithProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      
      // Fetch users by status
      const usersByStatusRes = await fetch(`${API_BASE_URL}/admin/users/by-status?type=both&page=1`, {
        headers: {
          'Authorization': `Bearer ${apiClient['authToken']}`,
          'Content-Type': 'application/json',
        },
      });
      const usersByStatusData: AdminApiResponse = usersByStatusRes.ok ? await usersByStatusRes.json() : { 
        statusCode: 200, 
        message: "No data", 
        data: { totalCount: "0", users: [] } 
      };
      
      // Fetch users with job applications
      const usersWithJobAppsRes = await fetch(`${API_BASE_URL}/admin/users/with-job-applications?type=both&page=1`, {
        headers: {
          'Authorization': `Bearer ${apiClient['authToken']}`,
          'Content-Type': 'application/json',
        },
      });
      const usersWithJobAppsData: AdminApiResponse = usersWithJobAppsRes.ok ? await usersWithJobAppsRes.json() : { 
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

      // Store the detailed user data (these are now just user IDs from the API)
      setUsersByRole(usersByRoleData.data?.users || []);
      setUsersByStatus(usersByStatusData.data?.users || []);
      setUsersWithApplications(usersWithJobAppsData.data?.users || []);
      setUsersWithProfiles(usersWithProfilesData.data?.users || []);

      // Calculate stats from API responses using totalCount and totalProfiles
      const totalStudents = parseInt(usersByRoleData.data?.totalCount || '0', 10);
      const studentsPlaced = parseInt(usersByStatusData.data?.totalCount || '0', 10);
      const studentsApplied = parseInt(usersWithJobAppsData.data?.totalCount || '0', 10);
      // Use totalProfiles if available, otherwise fall back to totalCount for backward compatibility
      const studentsWithProfiles = usersWithProfilesData.data?.totalProfiles || parseInt(usersWithProfilesData.data?.totalCount || '0', 10);
      
      // For now, we'll set this to 0 since the API doesn't provide this data yet
      // This can be updated when additional APIs are available
      const studentsShortlisted = 0;

      setStats({
        totalStudents,
        studentsPlaced,
        studentsWithProfiles,
        studentsApplied,
        studentsShortlisted
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

  // User List Component
  const UserListCard = ({ 
    title, 
    users, 
    icon: Icon 
  }: { 
    title: string; 
    users: string[]; 
    icon: React.ElementType;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found</p>
          ) : (
            users.slice(0, 5).map((userId) => (
              <div key={userId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">User ID: {userId}</p>
                  <p className="text-xs text-muted-foreground">User details not available</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    ID Only
                  </Badge>
                </div>
              </div>
            ))
          )}
          {users.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{users.length - 5} more users
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
            Overview of student engagement and placement statistics
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

      {/* Mobile Menu Toggle */}
      <div className="sm:hidden mb-4">
        <Button
          variant={isMobileMenuOpen ? "default" : "outline"}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full justify-between"
        >
          <span>{isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}</span>
          <Menu className={`h-4 w-4 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`} />
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile-friendly tabs */}
        <div className={`sm:hidden transition-all duration-200 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <TabsList className="grid w-full grid-cols-1 gap-2">
            <TabsTrigger 
              value="overview" 
              className="text-sm py-4 px-4 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="text-sm py-4 px-4 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              All Users
            </TabsTrigger>
            <TabsTrigger 
              value="profiles" 
              className="text-sm py-4 px-4 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              With Profiles
            </TabsTrigger>
            <TabsTrigger 
              value="status" 
              className="text-sm py-4 px-4 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              By Status
            </TabsTrigger>
            <TabsTrigger 
              value="applications" 
              className="text-sm py-4 px-4 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              With Applications
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Desktop tabs */}
        <div className="hidden sm:block">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="profiles">With Profiles</TabsTrigger>
            <TabsTrigger value="status">By Status</TabsTrigger>
            <TabsTrigger value="applications">With Applications</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
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
                <CardTitle className="text-xs sm:text-sm font-medium">Students Placed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {isLoading ? '...' : stats.studentsPlaced.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Students accepted by jobs
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
                  {isLoading ? '...' : stats.studentsWithProfiles.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Profiles Created by all Students
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Students Applied</CardTitle>
                <FileText className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                  {isLoading ? '...' : stats.studentsApplied.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Students who have applied to at least one job
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Students Shortlisted</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                  {isLoading ? '...' : stats.studentsShortlisted.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Students shortlisted for at least one job
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Placement Rate</CardTitle>
                <Building2 className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">
                  {isLoading ? '...' : stats.totalStudents > 0 
                    ? `${((stats.studentsPlaced / stats.totalStudents) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage of students placed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Briefcase className="h-5 w-5" />
                  Application Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Profile Completion Rate</span>
                    <Badge variant="secondary">
                      {stats.totalStudents > 0 
                        ? `${((stats.studentsWithProfiles / stats.totalStudents) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Application Rate</span>
                    <Badge variant="secondary">
                      {stats.totalStudents > 0 
                        ? `${((stats.studentsApplied / stats.totalStudents) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Shortlist Rate</span>
                    <Badge variant="secondary">
                      {stats.studentsApplied > 0 
                        ? `${((stats.studentsShortlisted / stats.studentsApplied) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </Badge>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span>More detailed insights and analytics coming soon</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm py-3 touch-manipulation"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View All Students
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm py-3 touch-manipulation"
                    onClick={() => setActiveTab('profiles')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    View Profiles
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm py-3 touch-manipulation"
                    onClick={() => setActiveTab('applications')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View All Applications
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm py-3 touch-manipulation"
                    onClick={() => setActiveTab('status')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Placements
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Users Tab */}
        <TabsContent value="users">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-5 w-5" />
                  All Organization Members
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col items-center gap-4 py-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center px-2">
                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed break-words">
                      Currently showing user IDs only. Detailed user information coming soon.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <UserListCard 
              title="User IDs (Limited View)"
              users={usersByRole}
              icon={Users}
            />
          </div>
        </TabsContent>

        {/* With Profiles Tab */}
        <TabsContent value="profiles">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <UserPlus className="h-5 w-5" />
                  Users with Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col items-center gap-4 py-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center px-2">
                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed break-words">
                      Currently showing user IDs only. Detailed profile information coming soon.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <UserListCard 
              title="User IDs (Limited View)"
              users={usersWithProfiles}
              icon={UserPlus}
            />
          </div>
        </TabsContent>

        {/* By Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserCheck className="h-5 w-5" />
                Users by Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                <div className="px-2 sm:px-0">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Feature Coming Soon</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
                    Detailed user status tracking and placement analytics will be available soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* With Applications Tab */}
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-5 w-5" />
                Users with Job Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                <div className="px-2 sm:px-0">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Feature Coming Soon</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
                    Detailed job application tracking and candidate management will be available soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
