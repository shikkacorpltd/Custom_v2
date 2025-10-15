import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Users, Eye, Shield } from 'lucide-react';

interface SchoolAdmin {
  id: string;
  user_id: string;
  full_name: string;
  role: 'school_admin' | 'super_admin' | 'teacher';
  approval_status: string;
  is_active: boolean;
  phone: string | null;
  school_id: string | null;
  created_at: string;
  schools?: { name: string; school_type: string };
}

const SchoolAdminManagement = () => {
  const { toast } = useToast();
  const [schoolAdmins, setSchoolAdmins] = useState<SchoolAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<SchoolAdmin | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    approval_status: 'pending',
    is_active: true,
    phone: '',
    school_id: '',
  });

  useEffect(() => {
    fetchSchoolAdmins();
    
    // Set up real-time subscription for user_profiles changes
    const channel = supabase
      .channel('school_admins_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        (payload) => {
          console.log('School admin profile change detected:', payload);
          fetchSchoolAdmins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSchoolAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          schools (name, school_type)
        `)
        .eq('role', 'school_admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching school admins:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch school admins',
          variant: 'destructive',
        });
        return;
      }

      setSchoolAdmins(data || []);
    } catch (error) {
      console.error('Error in fetchSchoolAdmins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          approval_status: formData.approval_status,
          is_active: formData.is_active,
          phone: formData.phone,
          school_id: formData.school_id || null,
        })
        .eq('id', selectedAdmin.id);

      if (error) {
        console.error('Error updating school admin:', error);
        toast({
          title: 'Error',
          description: 'Failed to update school admin',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'School admin updated successfully',
      });

      setIsEditDialogOpen(false);
      fetchSchoolAdmins();
    } catch (error) {
      console.error('Error in handleUpdateAdmin:', error);
    }
  };

  const handleDeactivateAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', adminId);

      if (error) {
        console.error('Error deactivating school admin:', error);
        toast({
          title: 'Error',
          description: 'Failed to deactivate school admin',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'School admin deactivated successfully',
      });

      fetchSchoolAdmins();
    } catch (error) {
      console.error('Error in handleDeactivateAdmin:', error);
    }
  };

  const openEditDialog = async (admin: SchoolAdmin) => {
    setSelectedAdmin(admin);
    setFormData({
      full_name: admin.full_name,
      approval_status: admin.approval_status,
      is_active: admin.is_active,
      phone: admin.phone || '',
      school_id: admin.school_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (admin: SchoolAdmin) => {
    setSelectedAdmin(admin);
    setIsViewDialogOpen(true);
  };

  const getStatusBadgeColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
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

  const filteredAdmins = schoolAdmins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.schools?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">School Admin Management</h2>
          <p className="text-muted-foreground">Manage school administrators and their permissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            School Administrators
          </CardTitle>
          <CardDescription>
            View and manage all school administrators in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search school admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>School Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No school administrators found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.full_name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeColor(admin.approval_status)}>
                          {admin.approval_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{admin.schools?.name || 'Not assigned'}</TableCell>
                      <TableCell>
                        {admin.schools?.school_type ? (
                          <Badge className={getSchoolTypeBadgeColor(admin.schools.school_type)}>
                            {admin.schools.school_type.replace('_', ' ')}
                          </Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>{admin.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewDialog(admin)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(admin)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {admin.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivateAdmin(admin.id)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>School Admin Details</DialogTitle>
            <DialogDescription>
              View school administrator information
            </DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedAdmin.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedAdmin.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">School</Label>
                  <p className="text-sm text-muted-foreground">{selectedAdmin.schools?.name || 'Not assigned'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusBadgeColor(selectedAdmin.approval_status)}>
                    {selectedAdmin.approval_status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Active</Label>
                  <Badge variant={selectedAdmin.is_active ? 'default' : 'secondary'}>
                    {selectedAdmin.is_active ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAdmin.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit School Admin</DialogTitle>
            <DialogDescription>
              Update school administrator information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval_status">Approval Status</Label>
              <Select value={formData.approval_status} onValueChange={(value) => setFormData({ ...formData, approval_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="is_active">Active User</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin}>
              Update Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolAdminManagement;