
import { supabase } from '@/integrations/supabase/client';
import { Class } from '@/types';

export const getClasses = async (userId: string) => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Class[];
};

export const getClass = async (classId: string) => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (error) throw error;
  return data as Class;
};

export const createClass = async (classData: Omit<Class, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('classes')
    .insert([classData])
    .select()
    .single();

  if (error) throw error;
  return data as Class;
};

export const updateClass = async (classId: string, classData: Partial<Class>) => {
  const { data, error } = await supabase
    .from('classes')
    .update(classData)
    .eq('id', classId)
    .select()
    .single();

  if (error) throw error;
  return data as Class;
};

export const deleteClass = async (classId: string) => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) throw error;
  return true;
};
