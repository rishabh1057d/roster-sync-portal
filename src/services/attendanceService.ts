
import { supabase } from '@/integrations/supabase/client';
import { Attendance, AttendanceStatus } from '@/types';
import { toast } from '@/components/ui/sonner';
import { getStudent } from '@/services/studentService';

export const getAttendanceByClassAndDate = async (classId: string, date: string) => {
  try {
    // First try to get attendance from Supabase
    const { data: supabaseData, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('date', date);

    if (error) throw error;
    
    // Map database fields to our frontend model
    const supabaseAttendance = supabaseData.map(item => ({
      id: item.id,
      studentId: item.student_id,
      classId: item.class_id,
      date: item.date,
      status: item.status as AttendanceStatus
    })) as Attendance[];
    
    // Get local attendance records for this class and date
    const localStorageKey = `attendance_${classId}_${date}`;
    const localAttendanceStr = localStorage.getItem(localStorageKey);
    const localAttendance = localAttendanceStr ? JSON.parse(localAttendanceStr) as Attendance[] : [];
    
    // Combine both sets of attendance records
    return [...supabaseAttendance, ...localAttendance];
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
};

export const getAttendanceByStudent = async (studentId: string) => {
  try {
    // First check if this is a local student ID
    if (studentId.includes('temp-id') || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      // For local students, fetch from localStorage
      const allAttendance: Attendance[] = [];
      
      // Scan through localStorage for any keys that match the pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('attendance_')) {
          const attendanceRecords = JSON.parse(localStorage.getItem(key) || '[]') as Attendance[];
          allAttendance.push(...attendanceRecords.filter(record => record.studentId === studentId));
        }
      }
      
      return allAttendance;
    }
    
    // For Supabase students, use the API
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) throw error;
    
    // Map database fields to our frontend model
    return data.map(item => ({
      id: item.id,
      studentId: item.student_id,
      classId: item.class_id,
      date: item.date,
      status: item.status as AttendanceStatus
    })) as Attendance[];
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return [];
  }
};

export const markAttendance = async (
  studentId: string, 
  classId: string, 
  date: string, 
  status: AttendanceStatus
) => {
  try {
    console.log(`Marking attendance for student ${studentId} in class ${classId} on ${date} with status ${status}`);
    
    // First, check if student exists locally by looking for non-UUID format or temp-id in the ID
    const isLocalStudent = studentId.includes('temp-id') || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    
    if (isLocalStudent) {
      console.log("Using local storage for attendance tracking");
      
      // For locally stored students, we use localStorage to track attendance
      const localStorageKey = `attendance_${classId}_${date}`;
      const existingRecordsStr = localStorage.getItem(localStorageKey);
      const existingRecords: Attendance[] = existingRecordsStr ? JSON.parse(existingRecordsStr) : [];
      
      // Check if we already have a record for this student
      const existingIndex = existingRecords.findIndex(record => record.studentId === studentId);
      
      if (existingIndex >= 0) {
        // Update existing record
        existingRecords[existingIndex].status = status;
      } else {
        // Create new record
        existingRecords.push({
          id: `local-${Date.now()}`,
          studentId,
          classId,
          date,
          status
        });
      }
      
      // Save back to localStorage
      localStorage.setItem(localStorageKey, JSON.stringify(existingRecords));
      
      toast.success(`Attendance marked as ${status}`);
      return {
        id: existingIndex >= 0 ? existingRecords[existingIndex].id : `local-${Date.now()}`,
        studentId,
        classId,
        date, 
        status
      };
    }
    
    // For Supabase students, let's first check if student exists
    try {
      const student = await getStudent(studentId);
      if (!student || !student.id) {
        toast.error("Cannot mark attendance: Student not found in database");
        return {
          id: 'error',
          studentId,
          classId,
          date,
          status
        };
      }
    } catch (error) {
      console.error("Error verifying student exists:", error);
      // If we can't verify the student exists (e.g., network error),
      // we'll still try to mark attendance but might get a foreign key error
    }
    
    // For actual Supabase students, proceed with regular flow
    // First try to find an existing record
    const { data: existingRecords, error: queryError } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('date', date);
    
    if (queryError) {
      console.error("Error querying attendance:", queryError);
      toast.error("Failed to check attendance record. Please try again.");
      throw queryError;
    }
    
    let result;
    
    if (existingRecords && existingRecords.length > 0) {
      // Update existing record
      console.log(`Found existing attendance record with ID: ${existingRecords[0].id}, updating status to ${status}`);
      result = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', existingRecords[0].id);
    } else {
      // Create new record
      console.log(`No existing attendance record found, creating new record with status ${status}`);
      result = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          class_id: classId,
          date,
          status
        });
    }
    
    if (result.error) {
      console.error("Error with attendance operation:", result.error);
      
      // If we got a foreign key violation, it means the student doesn't exist in Supabase
      if (result.error.code === '23503') {
        toast.error("Cannot mark attendance: Student not found in database");
        
        // Store this in localStorage instead as a fallback
        const localStorageKey = `attendance_${classId}_${date}`;
        const existingRecordsStr = localStorage.getItem(localStorageKey);
        const existingRecords: Attendance[] = existingRecordsStr ? JSON.parse(existingRecordsStr) : [];
        
        // Create new local record
        existingRecords.push({
          id: `local-${Date.now()}`,
          studentId,
          classId,
          date,
          status
        });
        
        // Save back to localStorage
        localStorage.setItem(localStorageKey, JSON.stringify(existingRecords));
        
        return {
          id: 'local-fallback',
          studentId,
          classId,
          date,
          status
        };
      }
      
      toast.error("Failed to update attendance. Please try again.");
      throw result.error;
    }
    
    console.log(`Successfully marked attendance for student ${studentId} as ${status}`);
    toast.success(`Attendance marked as ${status}`);
    
    return {
      id: existingRecords && existingRecords.length > 0 ? existingRecords[0].id : 'new-record',
      studentId,
      classId,
      date,
      status
    };
  } catch (error) {
    console.error("Unexpected error in markAttendance:", error);
    toast.error("An unexpected error occurred while updating attendance.");
    throw error;
  }
};

export const getAttendanceStats = async (classId: string) => {
  try {
    // First get Supabase attendance
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('class_id', classId);

    if (error) throw error;

    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };

    // Count Supabase attendance stats
    data.forEach(record => {
      stats[record.status as AttendanceStatus]++;
    });
    
    // Then get local attendance stats
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`attendance_${classId}`)) {
        const localRecords = JSON.parse(localStorage.getItem(key) || '[]') as Attendance[];
        localRecords.forEach(record => {
          stats[record.status]++;
        });
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting attendance stats:", error);
    return {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };
  }
};

export const exportAttendanceCsv = async (classId: string) => {
  try {
    // Get all attendance data for the class from both sources
    let allAttendance: {date: string, studentId: string, studentName: string, status: string}[] = [];
    
    // Get Supabase attendance
    const { data: supabaseData, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        status,
        students (
          id,
          first_name,
          last_name
        )
      `)
      .eq('class_id', classId)
      .order('date', { ascending: false });

    if (attendanceError) throw attendanceError;

    // Process Supabase data
    if (supabaseData && supabaseData.length > 0) {
      supabaseData.forEach(record => {
        if (record.students) {
          allAttendance.push({
            date: record.date,
            studentId: record.students.id,
            studentName: `${record.students.first_name} ${record.students.last_name}`,
            status: record.status
          });
        }
      });
    }
    
    // Get local attendance
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`attendance_${classId}`)) {
        const localRecords = JSON.parse(localStorage.getItem(key) || '[]') as Attendance[];
        
        // Get the date from the key (format: attendance_classId_date)
        const datePart = key.split('_')[2];
        
        for (const record of localRecords) {
          // Try to get student info from localStorage
          const studentFromLocalStorage = await getStudent(record.studentId);
          
          if (studentFromLocalStorage) {
            allAttendance.push({
              date: datePart || record.date,
              studentId: record.studentId,
              studentName: `${studentFromLocalStorage.firstName} ${studentFromLocalStorage.lastName}`,
              status: record.status
            });
          }
        }
      }
    }

    if (allAttendance.length === 0) {
      return null;
    }

    // Format data for CSV
    const headers = ['Date', 'Student', 'Status'];
    const rows = allAttendance.map(record => [
      record.date,
      record.studentName,
      record.status
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting attendance CSV:', error);
    return null;
  }
};
