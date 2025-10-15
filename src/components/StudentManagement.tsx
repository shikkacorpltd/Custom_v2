import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdvancedFilter, FilterField, FilterValue } from "@/components/AdvancedFilter";
import { useAdvancedFilter } from "@/hooks/useAdvancedFilter";
import { DataGridSkeleton } from "@/components/ui/skeleton-loader";
import { 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  User,
  Mail,
  Phone,
  Loader2
} from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  gender: string;
  date_of_birth: string;
  guardian_phone: string;
  guardian_email: string | null;
  address: string;
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  admission_date: string;
  class_id: string | null;
  classes?: {
    name: string;
    section: string;
  };
}

interface Class {
  id: string;
  name: string;
  section: string;
  class_level: string;
}

export function StudentManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<FilterValue[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const filterFields: FilterField[] = [
    { key: 'full_name', label: 'Student Name', type: 'text', placeholder: 'Enter name...' },
    { key: 'student_id', label: 'Student ID', type: 'text', placeholder: 'Enter ID...' },
    { key: 'gender', label: 'Gender', type: 'select', options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' }
    ]},
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'transferred', label: 'Transferred' },
      { value: 'graduated', label: 'Graduated' }
    ]},
    { key: 'class_name', label: 'Class', type: 'text', placeholder: 'Enter class...' },
    { key: 'guardian_phone', label: 'Guardian Phone', type: 'text', placeholder: 'Enter phone...' },
    { key: 'admission_date', label: 'Admission Date', type: 'date' },
  ];

  const studentSchema = z.object({
    full_name: z.string().min(1, "Full name is required"),
    student_id: z.string().min(1, "Student ID is required"),
    gender: z.string().min(1, "Gender is required"),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    guardian_phone: z.string().min(1, "Guardian phone is required"),
    guardian_email: z.string().email().optional().nullable(),
    address: z.string().min(1, "Address is required"),
    class_id: z.string().optional(),
    father_name: z.string().min(1, "Father's name is required"),
    mother_name: z.string().min(1, "Mother's name is required"),
    blood_group: z.string().optional()
  });

  type StudentFormData = z.infer<typeof studentSchema>;

  const form = useForm<StudentFormData>({
    defaultValues: {
      full_name: "",
      student_id: "",
      gender: "",
      date_of_birth: "",
      guardian_phone: "",
      guardian_email: "",
      address: "",
      class_id: "",
      father_name: "",
      mother_name: "",
      blood_group: ""
    }
  });

  // Restore fetchData function before useEffect
  const fetchData = useCallback(async () => {
    if (!profile?.school_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch students
      const { data: studentsData, error: studentsError } = await (supabase as any)
        .from('students')
        .select(`
          *,
          classes (
            name,
            section
          )
        `)
        .eq('school_id', profile.school_id)
        .order('admission_date', { ascending: false });

      if (studentsError) throw studentsError;

      // Fetch classes
      const { data: classesData, error: classesError } = await (supabase as any)
        .from('classes')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .order('name');

      if (classesError) throw classesError;

      setStudents(studentsData || []);
      setClasses(classesData || []);
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load students data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.school_id, toast]);

  

  useEffect(() => {
    if (profile?.school_id) {
      fetchData();
    }

    // Set up real-time subscriptions for students and classes
    const studentsChannel = supabase
      .channel('students_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        (payload) => {
          console.log('Student change detected:', payload);
          if (profile?.school_id) {
            fetchData();
          }
        }
      )
      .subscribe();

    const classesChannel = supabase
      .channel('students_classes_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes'
        },
        (payload) => {
          console.log('Class change detected in students view:', payload);
          if (profile?.school_id) {
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(classesChannel);
    };
  }, [profile, fetchData]);

  const handleAddStudent = async (values: StudentFormData) => {
    if (!profile?.school_id) {
      toast({
        title: "Error",
        description: "School ID not found. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    try {
      // Validate form data against schema
      const validationResult = studentSchema.safeParse(values);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors;
        const firstError = errors[0];
        
        toast({
          title: "Validation Error",
          description: firstError.message || "Please check all required fields",
          variant: "destructive",
        });
        return;
      }
      // Generate admission date as current date
      const admissionDate = new Date().toISOString().split('T')[0];

      // Filter out empty optional fields and add required fields
      const studentData = {
        full_name: values.full_name,
        student_id: values.student_id,
        date_of_birth: values.date_of_birth,
        gender: (values.gender || '').toLowerCase(),
        father_name: values.father_name,
        mother_name: values.mother_name,
        guardian_phone: values.guardian_phone,
        address: values.address,
        school_id: profile.school_id,
        class_id: values.class_id || null,
        guardian_email: values.guardian_email || null,
        blood_group: values.blood_group || null,
        status: 'active' as const,
        admission_date: admissionDate
      };

      console.log('Attempting to add student with data:', studentData);

      const { data, error } = await (supabase as any)
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Successfully added student:', data);

      toast({
        title: "Success",
        description: "Student added successfully",
      });

      setIsAddDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error: unknown) {
      console.error('Error adding student:', error);
      
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message || "Failed to add student",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add student",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditStudent = async (values: StudentFormData) => {
    if (!editingStudent) {
      toast({
        title: "Error",
        description: "No student selected for editing",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('students')
        .update(values)
        .eq('id', editingStudent.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student updated successfully",
      });

      setEditingStudent(null);
      form.reset();
      fetchData();
    } catch (error: unknown) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student deleted successfully",
      });

      fetchData();
    } catch (error: unknown) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  // Add class_name for filtering
  const studentsWithClassName = students.map(s => ({
    ...s,
    class_name: s.classes ? `${s.classes.name} ${s.classes.section}` : ''
  }));

  const filteredStudents = useAdvancedFilter(
    studentsWithClassName,
    advancedFilters,
    searchTerm,
    ['full_name', 'student_id', 'guardian_phone', 'guardian_email']
  );

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      full_name: student.full_name,
      student_id: student.student_id,
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      guardian_phone: student.guardian_phone,
      guardian_email: student.guardian_email || "",
      address: student.address,
      class_id: student.class_id || "",
      father_name: "",
      mother_name: "",
      blood_group: ""
    });
  };

  if (loading) {
    return <DataGridSkeleton />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Student Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage student records and information</p>
        </div>
        <Button 
          className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 touch-target"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Student
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold text-foreground">{students.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 md:h-5 md:w-5 text-success" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold text-foreground">{students.filter(s => s.status === 'active').length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 md:h-5 md:w-5 text-warning" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold text-foreground">
                  {students.filter(s => {
                    const admissionDate = new Date(s.admission_date);
                    const now = new Date();
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return admissionDate >= thirtyDaysAgo;
                  }).length}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">New</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold text-foreground">{students.filter(s => s.status === 'graduated').length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Graduated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <AdvancedFilter
                fields={filterFields}
                onFilterChange={setAdvancedFilters}
                onSearch={setSearchTerm}
                searchPlaceholder="Search students by name, ID, phone, or email..."
              />
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto touch-target">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="shadow-soft">
        <CardHeader className="p-3 md:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl">Students List ({filteredStudents.length})</CardTitle>
            <Button 
              size="sm"
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Students
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] px-3 md:px-6">
            <div className="space-y-3 md:space-y-4 py-3 md:py-4">
              {filteredStudents.map((student) => (
              <div key={student.id} className="border border-border rounded-lg p-3 md:p-4 hover:shadow-soft transition-shadow duration-200">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm md:text-lg font-semibold text-accent-foreground">
                        {student.full_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{student.full_name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        ID: {student.student_id} • {student.classes?.name ? `${student.classes.name} - ${student.classes.section}` : 'No Class'}
                      </p>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{student.guardian_email || 'No email'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {student.guardian_phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Badge variant={
                        student.status === 'active' ? 'default' :
                        student.status === 'graduated' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {student.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}</span> • 
                        <span className="ml-1">DOB: {new Date(student.date_of_birth).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 touch-target">
                        <Eye className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 touch-target"
                        onClick={() => openEditDialog(student)}
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive touch-target"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      {/* Add/Edit Student Dialog */}
      <Dialog open={isAddDialogOpen || !!editingStudent} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingStudent(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingStudent ? handleEditStudent : handleAddStudent)} className="space-y-4">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter student ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name} - {classItem.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="father_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter father's name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mother_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother's Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter mother's name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guardian_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardian_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter email address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter full address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingStudent(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                  {editingStudent ? 'Update' : 'Add'} Student
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}