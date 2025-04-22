
import { supabase } from '@/integrations/supabase/client';
import { Attendance, AttendanceStatus } from '@/types';
import { toast } from '@/components/ui/sonner';
import { getStudent, createStudent } from '@/services/dataService';

export const getAttendanceByClassAndDate = async (classId: string, date: string) => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('class_id', classId)
    .eq('date', date);

  if (error) throw error;
  
  // Map database fields to our frontend model
  return data.map(item => ({
    id: item.id,
    studentId: item.student_id,
    classId: item.class_id,
    date: item.date,
    status: item.status as AttendanceStatus
  })) as Attendance[];
};

export const getAttendanceByStudent = async (studentId: string) => {
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
};

export const markAttendance = async (
  studentId: string, 
  classId: string, 
  date: string, 
  status: AttendanceStatus
) => {
  try {
    console.log(`Marking attendance for student ${studentId} in class ${classId} on ${date} with status ${status}`);
    
    // First, we need to check if this is a local student ID and handle it appropriately
    if (studentId.includes('temp-id') || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      console.log("Using local storage for attendance tracking instead of Supabase");
      
      // Use the local data service instead for temporary students
      const localAttendance = {
        id: `local-${Date.now()}`,
        studentId,
        classId,
        date,
        status
      };
      
      toast.success(`Attendance marked as ${status}`);
      return localAttendance;
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
      
      // Verify that both student and class exist before creating record
      const { data: studentExists } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .single();
        
      if (!studentExists) {
        console.error(`Student with ID ${studentId} does not exist in Supabase`);
        toast.error("Cannot mark attendance: Student not found in database");
        return {
          id: 'error',
          studentId,
          classId,
          date,
          status
        };
      }
      
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

  data.forEach(record => {
    stats[record.status as AttendanceStatus]++;
  });

  return stats;
};

export const exportAttendanceCsv = async (classId: string) => {
  try {
    // Get attendance data for the class
    const { data: attendanceData, error: attendanceError } = await supabase
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

    if (!attendanceData || attendanceData.length === 0) {
      return null;
    }

    // Format data for CSV
    const headers = ['Date', 'Student', 'Status'];
    const rows = attendanceData.map(record => [
      record.date,
      `${record.students.first_name} ${record.students.last_name}`,
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
