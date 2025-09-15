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
import { useTranslation } from 'react-i18next';

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
  studentsPlaced: number;
  studentsWithProfiles: number;
  studentsApplied: number;
  studentsShortlisted: number;
}

const AdminDashboard = () => {
  const { t } = useTranslation("adminDashboard");
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


      const usersByRoleRes = await fetch(`${API_BASE_URL}/admin/users/by-role?type=both&page=1&role=seeker`, {

      
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


      const usersWithProfilesRes = await fetch(`${API_BASE_URL}/admin/users/with-profile?type=both&page=1`, {

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

      setUsersByRole(usersByRoleData.data?.users || []);
      setUsersByStatus(usersByStatusData.data?.users || []);
      setUsersWithApplications(usersWithJobAppsData.data?.users || []);
      setUsersWithProfiles(usersWithProfilesData.data?.users || []);

      const totalStudents = parseInt(usersByRoleData.data?.totalCount || '0', 10);
      const studentsPlaced = parseInt(usersByStatusData.data?.totalCount || '0', 10);
      const studentsApplied = parseInt(usersWithJobAppsData.data?.totalCount || '0', 10);
      const studentsWithProfiles = usersWithProfilesData.data?.totalProfiles || parseInt(usersWithProfilesData.data?.totalCount || '0', 10);
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
        title: t("adminDashboard.error.title"),
        description: t("adminDashboard.error.description"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }

  }, [toast, t]);

  }, [toast, orgSlug]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdminStats();
    setIsRefreshing(false);
    toast({
      title: t("adminDashboard.refresh.title"),
      description: t("adminDashboard.refresh.description"),
    });
  };

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("adminDashboard.authRequired.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("adminDashboard.authRequired.description")}</p>
            <Button onClick={() => navigate(buildSeekerUrl(orgSlug, 'discover'))} className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              {t("adminDashboard.authRequired.goHome")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAdminRole()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("adminDashboard.accessDenied.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("adminDashboard.accessDenied.description")}</p>
            <p className="text-sm text-muted-foreground mb-6">{t("adminDashboard.accessDenied.note")}</p>
            <Button onClick={() => navigate(buildSeekerUrl(orgSlug, 'discover'))} className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              {t("adminDashboard.accessDenied.goHome")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <p className="text-sm text-muted-foreground">{t("adminDashboard.noUsers")}</p>
          ) : (
            users.slice(0, 5).map((userId) => (
              <div key={userId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{t("adminDashboard.userId", { userId })}</p>
                  <p className="text-xs text-muted-foreground">{t("adminDashboard.userDetailsNA")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {t("adminDashboard.idOnly")}
                  </Badge>
                </div>
              </div>
            ))
          )}
          {users.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              {t("adminDashboard.moreUsers", { count: users.length - 5 })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">{t("adminDashboard.title")}</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("adminDashboard.subtitle")}
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="mt-4 sm:mt-0 w-full sm:w-auto py-3 touch-manipulation"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t("adminDashboard.refresh.button")}
        </Button>
      </div>


      className="space-y-4 sm:space-y-6">
          {/* Stats Cards */}
         <div className="space-y-4 sm:space-y-6">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Total Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("adminDashboard.stats.totalStudents")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {isLoading ? "..." : stats.totalStudents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("adminDashboard.stats.totalStudentsDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Students Placed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("adminDashboard.stats.studentsPlaced")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
              {isLoading ? "..." : stats.studentsPlaced.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("adminDashboard.stats.studentsPlacedDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Profiles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("adminDashboard.stats.profiles")}
            </CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
              {isLoading ? "..." : stats.studentsWithProfiles.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("adminDashboard.stats.profilesDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Students Applied */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("adminDashboard.stats.studentsApplied")}
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
              {isLoading ? "..." : stats.studentsApplied.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("adminDashboard.stats.studentsAppliedDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Shortlisted */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("adminDashboard.stats.studentsShortlisted")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
              {isLoading ? "..." : stats.studentsShortlisted.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("adminDashboard.stats.studentsShortlistedDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Placement Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("adminDashboard.stats.placementRate")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">
              {isLoading
                ? "..."
                : stats.totalStudents > 0
                ? `${(
                    (stats.studentsPlaced / stats.totalStudents) *
                    100
                  ).toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("adminDashboard.stats.placementRateDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile Tabs */}
        <div
          className={`sm:hidden transition-all duration-200 ${
            isMobileMenuOpen ? "block" : "hidden"
          }`}
        >
          <TabsList className="grid w-full grid-cols-1 gap-2">
            {["overview", "users", "profiles", "status", "applications"].map(
              (tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="text-sm py-4 px-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(`adminDashboard.tabs.${tab}`)}
                </TabsTrigger>
              )
            )}
          </TabsList>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:block">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              {t("adminDashboard.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="users">
              {t("adminDashboard.tabs.users")}
            </TabsTrigger>
            <TabsTrigger value="profiles">
              {t("adminDashboard.tabs.profiles")}
            </TabsTrigger>
            <TabsTrigger value="status">
              {t("adminDashboard.tabs.status")}
            </TabsTrigger>
            <TabsTrigger value="applications">
              {t("adminDashboard.tabs.applications")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Application Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Briefcase className="h-5 w-5" />
                  {t("adminDashboard.insights.applicationInsights")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>{t("adminDashboard.insights.profileCompletionRate")}</span>
                    <Badge variant="secondary">
                      {stats.totalStudents > 0
                        ? `${(
                            (stats.studentsWithProfiles / stats.totalStudents) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("adminDashboard.insights.applicationRate")}</span>
                    <Badge variant="secondary">
                      {stats.totalStudents > 0
                        ? `${(
                            (stats.studentsApplied / stats.totalStudents) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("adminDashboard.insights.shortlistRate")}</span>
                    <Badge variant="secondary">
                      {stats.studentsApplied > 0
                        ? `${(
                            (stats.studentsShortlisted / stats.studentsApplied) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </Badge>
                  </div>
                  <div className="pt-4 border-t text-xs text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    {t("adminDashboard.insights.comingSoon")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-5 w-5" />
                  {t("adminDashboard.quickActions.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("users")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t("adminDashboard.quickActions.viewAllStudents")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("profiles")}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t("adminDashboard.quickActions.viewProfiles")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("applications")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t("adminDashboard.quickActions.viewApplications")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("status")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("adminDashboard.quickActions.viewPlacements")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>
                <Users className="inline h-5 w-5 mr-2" />
                {t("adminDashboard.tabs.users")}
              </CardTitle>
            </CardHeader>
            <CardContent>{t("adminDashboard.placeholders.usersList")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>
                <UserPlus className="inline h-5 w-5 mr-2" />
                {t("adminDashboard.tabs.profiles")}
              </CardTitle>
            </CardHeader>
            <CardContent>{t("adminDashboard.placeholders.profilesList")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>
                <UserCheck className="inline h-5 w-5 mr-2" />
                {t("adminDashboard.tabs.status")}
              </CardTitle>
            </CardHeader>
            <CardContent>{t("adminDashboard.placeholders.statusList")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>
                <FileText className="inline h-5 w-5 mr-2" />
                {t("adminDashboard.tabs.applications")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {t("adminDashboard.placeholders.applicationsList")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
