
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types';

export const getStudents = async (classId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .order('first_name');

  if (error) throw error;
  
  // Map database fields to our frontend model
  return data.map(item => ({
    id: item.id,
    firstName: item.first_name,
    lastName: item.last_name,
    email: item.email,
    classId: item.class_id
  })) as Student[];
};

export const getStudent = async (studentId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error) throw error;
  
  // Map database fields to our frontend model
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    classId: data.class_id
  } as Student;
};

export const createStudent = async (studentData: Omit<Student, 'id'>) => {
  const { data, error } = await supabase
    .from('students')
    .insert([{
      first_name: studentData.firstName,
      last_name: studentData.lastName,
      email: studentData.email,
      class_id: studentData.classId
    }])
    .select()
    .single();

  if (error) throw error;
  
  // Map database fields to our frontend model
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    classId: data.class_id
  } as Student;
};

export const updateStudent = async (studentId: string, studentData: Partial<Student>) => {
  const { data, error } = await supabase
    .from('students')
    .update({
      first_name: studentData.firstName,
      last_name: studentData.lastName,
      email: studentData.email,
      class_id: studentData.classId
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw error;
  
  // Map database fields to our frontend model
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    classId: data.class_id
  } as Student;
};

export const deleteStudent = async (studentId: string) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  if (error) throw error;
  return true;
};
