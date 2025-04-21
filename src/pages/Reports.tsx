
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClasses, getStudents, getAttendanceByStudent, exportAttendanceCsv } from "@/services/dataService";
import { Class, Student, Attendance } from "@/types";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Calendar } from "lucide-react";
import AttendanceStatusBadge from "@/components/AttendanceStatusBadge";
import { toast } from "@/components/ui/sonner";

const Reports = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch classes
    const fetchedClasses = getClasses(user.id);
    setClasses(fetchedClasses);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (selectedClassId) {
      // Fetch students for the selected class
      const fetchedStudents = getStudents(selectedClassId);
      setStudents(fetchedStudents);
      setSelectedStudentId(""); // Reset student selection
      setAttendanceRecords([]); // Reset attendance records
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedStudentId) {
      // Fetch attendance for the selected student
      const records = getAttendanceByStudent(selectedStudentId);
      
      // Filter by date range if specified
      let filteredRecords = [...records];
      
      if (dateRange.startDate) {
        filteredRecords = filteredRecords.filter(
          (record) => record.date >= dateRange.startDate
        );
      }
      
      if (dateRange.endDate) {
        filteredRecords = filteredRecords.filter(
          (record) => record.date <= dateRange.endDate
        );
      }
      
      // Sort by date (newest first)
      filteredRecords.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setAttendanceRecords(filteredRecords);
    } else {
      setAttendanceRecords([]);
    }
  }, [selectedStudentId, dateRange]);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange({
      ...dateRange,
      [field]: value
    });
  };

  const handleExportCsv = () => {
    if (!selectedClassId) {
      toast.error("Please select a class to export");
      return;
    }
    
    const csvContent = exportAttendanceCsv(selectedClassId);
    if (!csvContent) {
      toast.error("No attendance data to export");
      return;
    }
    
    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    // Find class name
    const className = classes.find(c => c.id === selectedClassId)?.name || "attendance";
    link.setAttribute("download", `${className}_attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Attendance exported as CSV");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="NIET Attendance Reports"
        description="Comprehensive attendance tracking for NIET faculty"
      />

      {classes.length === 0 ? (
        <EmptyState
          title="No Classes Available"
          description="Create classes to generate attendance reports"
          icon={<FileText size={40} />}
          action={{
            label: "Go to Classes",
            onClick: () => window.location.href = "/classes",
          }}
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>
                Select a class and student to view attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select
                    value={selectedClassId}
                    onValueChange={setSelectedClassId}
                  >
                    <SelectTrigger id="class">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student">Student</Label>
                  <Select
                    value={selectedStudentId}
                    onValueChange={setSelectedStudentId}
                    disabled={!selectedClassId || students.length === 0}
                  >
                    <SelectTrigger id="student">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange("startDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange("endDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleExportCsv}
                  disabled={!selectedClassId}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedStudentId && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Attendance History
                  {students.find(s => s.id === selectedStudentId) && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      for {students.find(s => s.id === selectedStudentId)?.firstName} {students.find(s => s.id === selectedStudentId)?.lastName}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {attendanceRecords.length === 0 
                    ? "No records found for the selected period" 
                    : `${attendanceRecords.length} records found`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length === 0 ? (
                  <EmptyState
                    title="No Records Found"
                    description="There are no attendance records for the selected criteria"
                    icon={<Calendar size={32} />}
                  />
                ) : (
                  <div className="rounded-md border">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="border-b">
                          <tr className="border-b transition-colors">
                            <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Class</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.map((record) => {
                            const cls = classes.find(c => c.id === record.classId);
                            
                            return (
                              <tr key={record.id} className="border-b transition-colors">
                                <td className="p-4 align-middle">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="p-4 align-middle">
                                  {cls?.name || "Unknown"}
                                </td>
                                <td className="p-4 align-middle">
                                  <AttendanceStatusBadge status={record.status} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
