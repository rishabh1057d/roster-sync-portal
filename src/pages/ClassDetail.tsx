import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  getClass, 
  getStudents, 
  deleteStudent,
  createStudent
} from "@/services/dataService";
import { 
  getAttendanceByClassAndDate,
  markAttendance,
  exportAttendanceCsv
} from "@/services/attendanceService";
import { Class, Student, AttendanceStatus } from "@/types";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Edit,
  Plus,
  UserPlus,
  Download,
  Calendar,
  Users,
  Trash2,
  MoreVertical
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import AttendanceStatusBadge from "@/components/AttendanceStatusBadge";
import { toast } from "@/components/ui/sonner";
import { updateClassStudents } from "@/utils/studentUtils";

const ClassDetail = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [classDetails, setClassDetails] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });
  
  const [activeTab, setActiveTab] = useState("attendance");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [updatingStudents, setUpdatingStudents] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!classId) return;
      setIsLoading(true);

      try {
        const fetchedClass = await getClass(classId);
        if (fetchedClass) {
          setClassDetails(fetchedClass);
          
          const fetchedStudents = await getStudents(classId);
          setStudents(fetchedStudents);
          
          await loadAttendanceForDate(selectedDate);
          
          // If this is one of the special classes, update the students list automatically
          if (fetchedClass.name.includes("Mathematics") || 
              fetchedClass.name.includes("Physics") || 
              fetchedClass.name.includes("Computer Science")) {
            try {
              const updatedStudents = await updateClassStudents(classId);
              if (updatedStudents) {
                setStudents(updatedStudents);
                toast.success("Students list updated to standard list");
              }
            } catch (error) {
              console.error("Error updating students list:", error);
            }
          }
        } else {
          toast.error("Class not found");
          navigate("/classes");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load class data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId, navigate]);

  const loadAttendanceForDate = async (date: string) => {
    if (!classId) return;
    
    try {
      const attendanceRecords = await getAttendanceByClassAndDate(classId, date);
      const newAttendanceMap: Record<string, AttendanceStatus> = {};
      
      attendanceRecords.forEach((record) => {
        newAttendanceMap[record.studentId] = record.status;
      });
      
      setAttendanceMap(newAttendanceMap);
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast.error("Failed to load attendance data");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    loadAttendanceForDate(newDate);
  };

  const handleAttendanceChange = async (studentId: string, status: AttendanceStatus) => {
    if (!classId) return;
    
    try {
      const result = await markAttendance(studentId, classId, selectedDate, status);
      
      if (result.id !== 'error') {
        setAttendanceMap((prev) => ({
          ...prev,
          [studentId]: status
        }));
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const handleAddStudent = async () => {
    if (!classId) return;
    
    try {
      if (!newStudent.firstName.trim() || !newStudent.lastName.trim()) {
        toast.error("First name and last name are required");
        return;
      }
      
      const createdStudent = await createStudent({
        ...newStudent,
        classId
      });
      
      setStudents([...students, createdStudent]);
      
      setNewStudent({
        firstName: "",
        lastName: "",
        email: ""
      });
      setIsAddingStudent(false);
      
      toast.success("Student added successfully");
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Failed to add student");
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      await deleteStudent(studentToDelete);
      setStudents(students.filter((student) => student.id !== studentToDelete));
      toast.success("Student deleted successfully");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    } finally {
      setStudentToDelete(null);
    }
  };
  
  const handleUpdateStudentsList = async () => {
    if (!classId) return;
    
    setUpdatingStudents(true);
    try {
      const updatedStudents = await updateClassStudents(classId);
      setStudents(updatedStudents);
      toast.success("Students list updated to standard list");
    } catch (error) {
      console.error("Error updating students list:", error);
      toast.error("Failed to update students list");
    } finally {
      setUpdatingStudents(false);
    }
  };

  const handleExportCsv = async () => {
    if (!classId || !classDetails) return;
    
    try {
      const csvContent = await exportAttendanceCsv(classId);
      if (!csvContent) {
        toast.error("No attendance data to export");
        return;
      }
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${classDetails.name}_attendance.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Attendance exported as CSV");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export attendance data");
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!classDetails) {
    return (
      <EmptyState
        title="Class Not Found"
        description="The class you are looking for could not be found."
        action={{
          label: "Go Back",
          onClick: () => navigate("/classes"),
        }}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={classDetails.name}
        description={classDetails.description}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/classes")}>
              <ChevronLeft size={16} className="mr-2" />
              Back
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/classes/${classId}/edit`)}
            >
              <Edit size={16} className="mr-2" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-4 mt-4 mb-6">
        <Badge variant="outline" className="px-3 py-1">
          <Calendar size={14} className="mr-1" />
          {classDetails.schedule}
        </Badge>
        <Badge variant="outline" className="px-3 py-1">
          <Users size={14} className="mr-1" />
          {students.length} Students
        </Badge>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Daily Attendance</CardTitle>
                  <CardDescription>
                    Mark attendance for {selectedDate}
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={handleDateChange}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="mt-7"
                    onClick={handleExportCsv}
                  >
                    <Download size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <EmptyState
                  title="No Students Yet"
                  description="Add students to start tracking attendance"
                  icon={<Users size={32} />}
                  action={{
                    label: "Add Student",
                    onClick: () => setIsAddingStudent(true),
                  }}
                />
              ) : (
                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="border-b">
                        <tr className="border-b transition-colors">
                          <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                          <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">Email</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b transition-colors">
                            <td className="p-4 align-middle font-medium">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="p-4 align-middle hidden md:table-cell">
                              {student.email}
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant={attendanceMap[student.id] === "present" ? "default" : "outline"}
                                  className={attendanceMap[student.id] === "present" ? "bg-status-present hover:bg-status-present/80" : ""}
                                  onClick={() => handleAttendanceChange(student.id, "present")}
                                >
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant={attendanceMap[student.id] === "absent" ? "default" : "outline"}
                                  className={attendanceMap[student.id] === "absent" ? "bg-status-absent hover:bg-status-absent/80" : ""}
                                  onClick={() => handleAttendanceChange(student.id, "absent")}
                                >
                                  Absent
                                </Button>
                                <Button
                                  size="sm"
                                  variant={attendanceMap[student.id] === "late" ? "default" : "outline"}
                                  className={attendanceMap[student.id] === "late" ? "bg-status-late hover:bg-status-late/80" : ""}
                                  onClick={() => handleAttendanceChange(student.id, "late")}
                                >
                                  Late
                                </Button>
                                <Button
                                  size="sm"
                                  variant={attendanceMap[student.id] === "excused" ? "default" : "outline"}
                                  className={attendanceMap[student.id] === "excused" ? "bg-status-excused hover:bg-status-excused/80" : ""}
                                  onClick={() => handleAttendanceChange(student.id, "excused")}
                                >
                                  Excused
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>
                    Manage students in this class
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {(classDetails.name.includes("Mathematics") || 
                    classDetails.name.includes("Physics") || 
                    classDetails.name.includes("Computer Science")) && (
                    <Button 
                      variant="secondary"
                      onClick={handleUpdateStudentsList}
                      disabled={updatingStudents}
                    >
                      {updatingStudents ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Users size={16} className="mr-2" />
                      )}
                      Update Students List
                    </Button>
                  )}
                  <Button onClick={() => setIsAddingStudent(true)}>
                    <UserPlus size={16} className="mr-2" />
                    Add Student
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <EmptyState
                  title="No Students Yet"
                  description="Add students to start tracking attendance"
                  icon={<Users size={32} />}
                  action={{
                    label: "Add Student",
                    onClick: () => setIsAddingStudent(true),
                  }}
                />
              ) : (
                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="border-b">
                        <tr className="border-b transition-colors">
                          <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                          <th className="h-12 px-4 text-right align-middle font-medium w-[70px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b transition-colors">
                            <td className="p-4 align-middle font-medium">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="p-4 align-middle">
                              {student.email}
                            </td>
                            <td className="p-4 align-middle text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setStudentToDelete(student.id)}
                                  >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Add a student to {classDetails.name} class
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newStudent.firstName}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newStudent.lastName}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newStudent.email}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, email: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingStudent(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent}>
              <Plus size={16} className="mr-2" />
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student and all their attendance records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStudent}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClassDetail;
