
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types';

export const getStudents = async (classId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .order('first_name');

  if (error) throw error;
  return data as Student[];
};

export const getStudent = async (studentId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error) throw error;
  return data as Student;
};

export const createStudent = async (studentData: Omit<Student, 'id'>) => {
  const { data, error } = await supabase
    .from('students')
    .insert([studentData])
    .select()
    .single();

  if (error) throw error;
  return data as Student;
};

export const updateStudent = async (studentId: string, studentData: Partial<Student>) => {
  const { data, error } = await supabase
    .from('students')
    .update(studentData)
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw error;
  return data as Student;
};

export const deleteStudent = async (studentId: string) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  if (error) throw error;
  return true;
};
