
import { supabase } from '@/integrations/supabase/client';
import { Attendance, AttendanceStatus } from '@/types';
import { toast } from '@/components/ui/sonner';

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
    
    // Perform the upsert operation without returning data
    const { error } = await supabase
      .from('attendance')
      .upsert({
        student_id: studentId,
        class_id: classId,
        date,
        status
      }, {
        onConflict: 'student_id,class_id,date'
      });

    if (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to update attendance. Please try again.");
      throw error;
    }
    
    // Log successful attendance update
    console.log(`Successfully marked attendance for student ${studentId}`);
    toast.success(`Attendance marked as ${status}`);
    
    // After successful upsert, fetch the updated record
    const { data: fetchedData, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('date', date)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error fetching updated attendance:", fetchError);
      // Continue since the upsert was successful
    }
    
    // Create the response object using fetched data or fallback to input parameters
    const responseData = fetchedData || {
      id: 'generated', // This won't be used by the frontend in a meaningful way
      student_id: studentId,
      class_id: classId,
      date,
      status
    };
    
    // Map database fields to our frontend model
    return {
      id: responseData.id,
      studentId: responseData.student_id,
      classId: responseData.class_id,
      date: responseData.date,
      status: responseData.status as AttendanceStatus
    } as Attendance;
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
