import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardSkeleton } from '@/components/ui/skeleton-loader';
import { 
  School, 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Activity,
  Database,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SchoolAdminManagement from '@/components/SchoolAdminManagement';
import SchoolManagement from '@/components/SchoolManagement';
import SystemSettings from '@/components/SystemSettings';
import AuditLogViewer from '@/components/AuditLogViewer';

interface School {
  id: string;
  name: string;
  name_bangla: string | null;
  school_type: 'bangla_medium' | 'english_medium' | 'madrasha';
  address: string;
  address_bangla: string | null;
  phone: string | null;
  email: string | null;
  eiin_number: string | null;
  established_year: number | null;
  is_active: boolean;
  created_at: string;
}

const SuperAdminDashboard = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    pendingApplications: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_bangla: '',
    school_type: 'bangla_medium' as 'bangla_medium' | 'english_medium' | 'madrasha',
    address: '',
    address_bangla: '',
    phone: '',
    email: '',
    eiin_number: '',
    established_year: new Date().getFullYear(),
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions
    const schoolsChannel = supabase
      .channel('schools_changes')
      .on('postgres_changes' as any, 
        { event: '*', schema: 'public', table: 'schools' }, 
        () => {
          console.log('School data changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to schools changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to schools changes');
        }
      });

    const studentsChannel = supabase
      .channel('students_changes') 
      .on('postgres_changes' as any, 
        { event: '*', schema: 'public', table: 'students' }, 
        () => {
          console.log('Student data changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to students changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to students changes');
        }
      });

    return () => {
      supabase.removeChannel(schoolsChannel);
      supabase.removeChannel(studentsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);

      // Fetch statistics
      const totalSchools = schoolsData?.length || 0;
      const activeSchools = schoolsData?.filter(school => school.is_active).length || 0;

      // Fetch total students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Fetch total teachers count
      const { count: teachersCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      // Fetch total classes count
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      // Fetch total subjects count
      const { count: subjectsCount } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true });

      // Fetch pending teacher applications count
      const { count: pendingApplicationsCount } = await supabase
        .from('teacher_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calculate monthly growth (simplified - comparing current month vs last month schools)
      const currentDate = new Date();
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const { count: lastMonthSchools } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', lastMonth.toISOString());

      const monthlyGrowth = lastMonthSchools 
        ? Math.round(((totalSchools - lastMonthSchools) / lastMonthSchools) * 100)
        : 0;

      setStats({
        totalSchools,
        activeSchools,
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalClasses: classesCount || 0,
        totalSubjects: subjectsCount || 0,
        pendingApplications: pendingApplicationsCount || 0,
        monthlyGrowth,
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSchoolTypeLabel = (type: string) => {
    switch (type) {
      case 'bangla_medium':
        return 'Bangla Medium';
      case 'english_medium':
        return 'English Medium';
      case 'madrasha':
        return 'Madrasha';
      default:
        return type;
    }
  };

  const getSchoolTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'bangla_medium':
        return 'bg-green-100 text-green-800';
      case 'english_medium':
        return 'bg-blue-100 text-blue-800';
      case 'madrasha':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateSchool = async () => {
    try {
      const { error } = await supabase
        .from('schools')
        .insert([{
          name: formData.name,
          name_bangla: formData.name_bangla || null,
          school_type: formData.school_type,
          address: formData.address,
          address_bangla: formData.address_bangla || null,
          phone: formData.phone || null,
          email: formData.email || null,
          eiin_number: formData.eiin_number || null,
          established_year: formData.established_year,
          is_active: formData.is_active,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'School created successfully',
      });

      setIsAddSchoolOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating school:', error);
      toast({
        title: 'Error',
        description: 'Failed to create school',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;

    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', schoolToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'School deleted successfully',
      });

      setIsDeleteDialogOpen(false);
      setSchoolToDelete(null);
    } catch (error: any) {
      console.error('Error deleting school:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete school',
        variant: 'destructive',
      });
    }
  };

  const openViewDialog = (school: School) => {
    setSelectedSchool(school);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (school: School) => {
    setSchoolToDelete(school);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_bangla: '',
      school_type: 'bangla_medium',
      address: '',
      address_bangla: '',
      phone: '',
      email: '',
      eiin_number: '',
      established_year: new Date().getFullYear(),
      is_active: true,
    });
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.school_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage all schools and platform overview</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="users">School Admins</TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="h-4 w-4 mr-2" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.totalSchools}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeSchools} active schools
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Across all schools
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.totalTeachers}</div>
                <p className="text-xs text-muted-foreground">
                  Active educators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">+{stats.monthlyGrowth}%</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground">
                  Active classes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubjects}</div>
                <p className="text-xs text-muted-foreground">
                  Available subjects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</div>
                <p className="text-xs text-muted-foreground">
                  Teacher applications
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Schools Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recent Schools
                </CardTitle>
                <Button 
                  onClick={() => setIsAddSchoolOpen(true)}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New School
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredSchools.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No schools found</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setIsAddSchoolOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First School
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {filteredSchools.slice(0, 5).map((school) => (
                      <div
                        key={school.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <School className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{school.name}</h3>
                              <Badge 
                                className={getSchoolTypeBadgeColor(school.school_type)}
                              >
                                {getSchoolTypeLabel(school.school_type)}
                              </Badge>
                              {!school.is_active && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            {school.name_bangla && (
                              <p className="text-sm text-muted-foreground">{school.name_bangla}</p>
                            )}
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground">{school.address}</span>
                              {school.eiin_number && (
                                <span className="text-xs text-muted-foreground">
                                  EIIN: {school.eiin_number}
                                </span>
                              )}
                              {school.established_year && (
                                <span className="text-xs text-muted-foreground">
                                  Est. {school.established_year}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openViewDialog(school)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setActiveTab('schools')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteDialog(school)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredSchools.length > 5 && (
                      <div className="text-center py-4">
                        <Button 
                          variant="outline"
                          onClick={() => setActiveTab('schools')}
                        >
                          View All Schools ({filteredSchools.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools">
          <SchoolManagement />
        </TabsContent>

        <TabsContent value="users">
          <SchoolAdminManagement />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>
      </Tabs>

      {/* Add School Dialog */}
      <Dialog open={isAddSchoolOpen} onOpenChange={setIsAddSchoolOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New School</DialogTitle>
            <DialogDescription>
              Create a new school in the platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">School Name (English) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_bangla">School Name (Bangla)</Label>
              <Input
                id="name_bangla"
                value={formData.name_bangla}
                onChange={(e) => setFormData({ ...formData, name_bangla: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school_type">School Type *</Label>
              <Select value={formData.school_type} onValueChange={(value: any) => setFormData({ ...formData, school_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="madrasha">Madrasha</SelectItem>
                  <SelectItem value="bangla_medium">Bangla Medium</SelectItem>
                  <SelectItem value="english_medium">English Medium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eiin_number">EIIN Number</Label>
              <Input
                id="eiin_number"
                value={formData.eiin_number}
                onChange={(e) => setFormData({ ...formData, eiin_number: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address (English) *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address_bangla">Address (Bangla)</Label>
              <Textarea
                id="address_bangla"
                value={formData.address_bangla}
                onChange={(e) => setFormData({ ...formData, address_bangla: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="established_year">Established Year</Label>
              <Input
                id="established_year"
                type="number"
                value={formData.established_year}
                onChange={(e) => setFormData({ ...formData, established_year: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="is_active">Active School</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSchoolOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchool}>
              Create School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View School Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>School Details</DialogTitle>
            <DialogDescription>
              View school information
            </DialogDescription>
          </DialogHeader>
          {selectedSchool && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">School Name</Label>
                  <p>{selectedSchool.name}</p>
                  {selectedSchool.name_bangla && (
                    <p className="text-sm text-muted-foreground">{selectedSchool.name_bangla}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p>
                    <Badge className={getSchoolTypeBadgeColor(selectedSchool.school_type)}>
                      {getSchoolTypeLabel(selectedSchool.school_type)}
                    </Badge>
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <p>{selectedSchool.address}</p>
                  {selectedSchool.address_bangla && (
                    <p className="text-sm text-muted-foreground">{selectedSchool.address_bangla}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p>{selectedSchool.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p>{selectedSchool.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">EIIN Number</Label>
                  <p>{selectedSchool.eiin_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Established Year</Label>
                  <p>{selectedSchool.established_year || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p>
                    <Badge variant={selectedSchool.is_active ? 'default' : 'secondary'}>
                      {selectedSchool.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p>{new Date(selectedSchool.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete School</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{schoolToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSchool}>
              Delete School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;