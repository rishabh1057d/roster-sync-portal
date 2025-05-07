
import { supabase, isLocalStudentId } from '@/integrations/supabase/client';
import { Attendance, AttendanceStatus, Student } from '@/types';
import { toast } from '@/components/ui/sonner';
import { getStudent, createStudent } from '@/services/studentService';

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
    if (isLocalStudentId(studentId)) {
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

// Try to find or create student in Supabase
const findOrCreateStudentInSupabase = async (studentId: string, classId: string): Promise<Student | null> => {
  try {
    // First try to get the student
    const student = await getStudent(studentId);
    
    if (student) {
      return student;
    }
    
    // If no student found, check if we can get details from local storage
    const localStudent = await findLocalStudentById(studentId);
    
    if (localStudent) {
      // Try to create this student in Supabase
      try {
        const { data, error } = await supabase
          .from('students')
          .insert({
            first_name: localStudent.firstName,
            last_name: localStudent.lastName,
            email: localStudent.email,
            class_id: classId
          })
          .select()
          .single();
          
        if (!error && data) {
          console.log("Successfully created student in Supabase from local data:", data);
          
          // Return student with Supabase ID
          return {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            classId: data.class_id
          };
        }
      } catch (createError) {
        console.error("Error creating student in Supabase from local data:", createError);
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in findOrCreateStudentInSupabase:", error);
    return null;
  }
};

// Helper to find a local student by ID
const findLocalStudentById = async (studentId: string): Promise<Student | null> => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('local_students_')) {
      try {
        const students = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
        const student = students.find(s => s.id === studentId);
        if (student) {
          return student;
        }
      } catch (error) {
        console.error("Error checking local storage for student:", error);
      }
    }
  }
  return null;
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
    const isLocalStudent = isLocalStudentId(studentId);
    
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
      // Try to find the student in Supabase
      const supabaseStudent = await findOrCreateStudentInSupabase(studentId, classId);
      
      if (!supabaseStudent) {
        // Create a placeholder student in localStorage
        console.log("Student not found in database, creating a new student record");
        
        const newStudent = await createStudent({
          firstName: "Unknown",
          lastName: `Student-${studentId.substring(0, 8)}`,
          email: "",
          classId
        });
        
        // If the new student has a temporary ID, use localStorage for attendance
        if (isLocalStudentId(newStudent.id)) {
          console.log("New student was created in localStorage, using localStorage for attendance too");
          return markAttendance(newStudent.id, classId, date, status);
        }
        
        // If we successfully created a student in Supabase, use that ID
        studentId = newStudent.id;
      } else {
        // Use the Supabase student ID
        studentId = supabaseStudent.id;
      }
    } catch (error) {
      console.error("Error verifying student exists:", error);
      // Fallback to localStorage
      const localId = `temp-id-${Date.now()}`;
      const localStorageKey = `attendance_${classId}_${date}`;
      const existingRecordsStr = localStorage.getItem(localStorageKey);
      const existingRecords: Attendance[] = existingRecordsStr ? JSON.parse(existingRecordsStr) : [];
      
      existingRecords.push({
        id: `local-${Date.now()}`,
        studentId: localId,
        classId,
        date,
        status
      });
      
      localStorage.setItem(localStorageKey, JSON.stringify(existingRecords));
      toast.warning("Stored attendance locally (offline mode)");
      return {
        id: `local-${Date.now()}`,
        studentId: localId,
        classId,
        date,
        status
      };
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
      if (result.error.code === '23503' || result.error.code === '42501') {
        // Store this in localStorage as a fallback since we couldn't add it to Supabase
        console.log("Foreign key violation or RLS issue - falling back to localStorage for attendance");
        const localStorageKey = `attendance_${classId}_${date}`;
        const existingRecordsStr = localStorage.getItem(localStorageKey);
        const existingRecords: Attendance[] = existingRecordsStr ? JSON.parse(existingRecordsStr) : [];
        
        // Create new local record
        const localId = `local-${Date.now()}`;
        existingRecords.push({
          id: localId,
          studentId,
          classId,
          date,
          status
        });
        
        // Save back to localStorage
        localStorage.setItem(localStorageKey, JSON.stringify(existingRecords));
        
        toast.warning("Stored attendance locally (offline mode)");
        return {
          id: localId,
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
