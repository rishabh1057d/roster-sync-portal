
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
    
    // Simplified approach: first check if record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('date', date)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking existing attendance:", checkError);
      toast.error("Failed to update attendance. Please try again.");
      throw checkError;
    }
    
    let result;
    
    if (existingRecord) {
      // Update existing record if found
      result = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', existingRecord.id);
    } else {
      // Insert new record if not found
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
      console.error("Error marking attendance:", result.error);
      toast.error("Failed to update attendance. Please try again.");
      throw result.error;
    }
    
    // Log successful attendance update
    console.log(`Successfully marked attendance for student ${studentId}`);
    toast.success(`Attendance marked as ${status}`);
    
    // Fetch the updated record
    const { data: updatedRecord, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('date', date)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error fetching updated attendance:", fetchError);
      // Continue since the update/insert was successful
    }
    
    // Map database fields to our frontend model
    return {
      id: updatedRecord?.id || 'temp-id',
      studentId: studentId,
      classId: classId,
      date: date,
      status: status
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
