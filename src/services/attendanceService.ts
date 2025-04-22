
import { supabase } from '@/integrations/supabase/client';
import { Attendance, AttendanceStatus } from '@/types';

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
  const { data, error } = await supabase
    .from('attendance')
    .upsert({
      student_id: studentId,
      class_id: classId,
      date,
      status
    }, {
      onConflict: 'student_id,class_id,date'
    })
    .select()
    .single();

  if (error) throw error;
  
  // Map database fields to our frontend model
  return {
    id: data.id,
    studentId: data.student_id,
    classId: data.class_id,
    date: data.date,
    status: data.status as AttendanceStatus
  } as Attendance;
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
