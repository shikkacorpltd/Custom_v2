import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { UserCheck, Users, Calendar as CalendarIcon, FileText, CheckSquare, AlertCircle, X, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class_id: string;
  classes?: {
    id: string;
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

interface AttendanceRecord {
  id?: string;
  student_id: string;
  class_id: string;
  date: string;
  is_present: boolean;
  remarks?: string;
  student?: Student;
}

export function AttendanceManagement() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("mark");

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadAttendance();
    }
  }, [selectedClass, selectedDate]);

  const loadClasses = async () => {
    try {
      let query = supabase
        .from('classes')
        .select('*')
        .eq('is_active', true);

      // Filter by school_id
      if (profile?.school_id) {
        query = query.eq('school_id', profile.school_id);
      }

      // For teachers, only show classes they teach
      if (profile?.role === 'teacher') {
        // Get teacher record
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', profile.user_id)
          .single();

        if (teacherData) {
          // Get classes from timetable
          const { data: timetableData } = await supabase
            .from('timetable')
            .select('class_id')
            .eq('teacher_id', teacherData.id);

          const classIds = [...new Set(timetableData?.map(t => t.class_id) || [])];
          
          if (classIds.length > 0) {
            query = query.in('id', classIds);
          } else {
            // Teacher has no assigned classes
            setClasses([]);
            return;
          }
        }
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes:class_id (
            id,
            name,
            section
          )
        `)
        .eq('class_id', selectedClass)
        .eq('status', 'active')
        .order('student_id');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          students:student_id (
            id,
            student_id,
            full_name
          )
        `)
        .eq('class_id', selectedClass)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'))
        .order('student_id');

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast.error('Failed to load attendance');
    }
  };

  const handleAttendanceChange = (studentId: string, isPresent: boolean, remarks?: string) => {
    setAttendance(prev => {
      const existing = prev.find(a => a.student_id === studentId);
      if (existing) {
        return prev.map(a => 
          a.student_id === studentId 
            ? { ...a, is_present: isPresent, remarks }
            : a
        );
      } else {
        return [...prev, {
          student_id: studentId,
          class_id: selectedClass,
          date: format(selectedDate, 'yyyy-MM-dd'),
          is_present: isPresent,
          remarks
        }];
      }
    });
  };

  const saveAttendance = async () => {
    if (!selectedClass || attendance.length === 0) {
      toast.error('Please select a class and mark attendance');
      return;
    }

    setLoading(true);
    try {
      // First, delete existing attendance for this date and class
      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', selectedClass)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'));

      // Then insert new attendance records
      const attendanceData = attendance.map(a => ({
        school_id: profile?.school_id,
        student_id: a.student_id,
        class_id: a.class_id,
        date: a.date,
        is_present: a.is_present,
        remarks: a.remarks || null
      }));

      const { error } = await supabase
        .from('attendance')
        .insert(attendanceData);

      if (error) throw error;

      toast.success('Attendance saved successfully');
      loadAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = () => {
    students.forEach(student => {
      handleAttendanceChange(student.id, true);
    });
  };

  const markAllAbsent = () => {
    students.forEach(student => {
      handleAttendanceChange(student.id, false);
    });
  };

  const setQuickStatus = (studentId: string, status: 'present' | 'absent') => {
    const isPresent = status === 'present';
    handleAttendanceChange(studentId, isPresent, '');
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const marked = attendance.length;
    const present = attendance.filter(a => a.is_present).length;
    const absent = attendance.filter(a => !a.is_present).length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
    const completionPercentage = total > 0 ? ((marked / total) * 100) : 0;

    return { total, marked, present, absent, percentage, completionPercentage };
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Mark and track student attendance across classes
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="mark" className="flex items-center gap-1 md:gap-2 py-2 px-2 md:px-4 text-xs md:text-sm">
            <UserCheck className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Mark Attendance</span>
            <span className="sm:hidden">Mark</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1 md:gap-2 py-2 px-2 md:px-4 text-xs md:text-sm">
            <FileText className="h-3 w-3 md:h-4 md:w-4" />
            <span>Reports</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 md:gap-2 py-2 px-2 md:px-4 text-xs md:text-sm">
            <CalendarIcon className="h-3 w-3 md:h-4 md:w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="space-y-4 md:space-y-6">
          <div className="grid gap-4 md:gap-6 lg:grid-cols-4">
            <Card className="lg:col-span-3">
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <UserCheck className="h-5 w-5" />
                  Daily Attendance
                </CardTitle>
                <CardDescription className="text-sm">
                  Select a class and date to mark attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-3 md:p-6">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Select Class</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="h-11 touch-target">
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - Section {cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:w-64">
                    <label className="text-sm font-medium mb-2 block">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-11 touch-target",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {selectedClass && (
                  <>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Attendance Progress</span>
                        <span className="font-medium">{stats.marked} / {stats.total} students</span>
                      </div>
                      <Progress value={stats.completionPercentage} className="h-2" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={markAllPresent}
                          variant="outline" 
                          size="sm"
                          className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50 touch-target flex-1 sm:flex-none"
                        >
                          <CheckSquare className="h-4 w-4 mr-1.5" />
                          All Present
                        </Button>
                        <Button 
                          onClick={markAllAbsent}
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 touch-target flex-1 sm:flex-none"
                        >
                          <AlertCircle className="h-4 w-4 mr-1.5" />
                          All Absent
                        </Button>
                      </div>
                      <Button 
                        onClick={saveAttendance}
                        disabled={loading || stats.marked === 0}
                        size="sm"
                        className="w-full sm:w-auto touch-target h-10"
                      >
                        {loading ? 'Saving...' : `Save Attendance (${stats.marked})`}
                      </Button>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {students.map((student) => {
                        const attendanceRecord = attendance.find(a => a.student_id === student.id);
                        const isPresent = attendanceRecord?.is_present ?? null;
                        const isMarked = attendanceRecord !== undefined;
                        
                        return (
                          <Card 
                            key={student.id} 
                            className={cn(
                              "p-4 transition-all",
                              isMarked && isPresent && "bg-green-50 border-green-200",
                              isMarked && !isPresent && "bg-red-50 border-red-200"
                            )}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-base truncate">{student.full_name}</h3>
                                    {isMarked && (
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-xs",
                                          isPresent ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"
                                        )}
                                      >
                                        {isPresent ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                                        {isPresent ? "Present" : "Absent"}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
                                </div>
                              </div>

                              {/* Quick Action Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  variant={isPresent === true ? "default" : "outline"}
                                  onClick={() => setQuickStatus(student.id, 'present')}
                                  className={cn(
                                    "touch-target h-11",
                                    isPresent === true && "bg-green-600 hover:bg-green-700"
                                  )}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant={isPresent === false ? "default" : "outline"}
                                  onClick={() => setQuickStatus(student.id, 'absent')}
                                  className={cn(
                                    "touch-target h-11",
                                    isPresent === false && "bg-red-600 hover:bg-red-700"
                                  )}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Absent
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead className="text-center">Present</TableHead>
                            <TableHead className="text-center">Absent</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => {
                            const attendanceRecord = attendance.find(a => a.student_id === student.id);
                            const isPresent = attendanceRecord?.is_present ?? true;
                            
                            return (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.student_id}</TableCell>
                                <TableCell>{student.full_name}</TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={isPresent}
                                    onCheckedChange={(checked) => 
                                      handleAttendanceChange(student.id, !!checked, attendanceRecord?.remarks)
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={!isPresent}
                                    onCheckedChange={(checked) => 
                                      handleAttendanceChange(student.id, !checked, attendanceRecord?.remarks)
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Textarea
                                    placeholder="Optional remarks..."
                                    value={attendanceRecord?.remarks || ''}
                                    onChange={(e) => 
                                      handleAttendanceChange(student.id, isPresent, e.target.value)
                                    }
                                    className="min-h-8"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Users className="h-5 w-5" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stats.percentage}%</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Attendance Rate</div>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Marked</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {stats.marked} / {stats.total}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Present</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {stats.present}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Absent</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {stats.absent}
                    </Badge>
                  </div>
                </div>

                <div className="hidden lg:block pt-4 border-t">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reports</CardTitle>
              <CardDescription>
                Generate detailed attendance reports for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Attendance reports feature coming soon...</p>
                <p className="text-sm">Generate monthly, weekly, and custom date range reports</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Analytics</CardTitle>
              <CardDescription>
                View attendance trends and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Attendance analytics feature coming soon...</p>
                <p className="text-sm">Track trends, identify patterns, and generate insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}