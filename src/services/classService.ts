import { supabase } from '@/integrations/supabase/client';
import { Class } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const getClasses = async (userId: string) => {
  try {
    // For production Supabase, userId should be a valid UUID
    // For development/mock, we'll use local storage
    
    // Try fetching from Supabase first
    try {
      // Ensure we have a valid UUID format for Supabase queries
      const validUserId = userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) 
        ? userId 
        : uuidv4(); // Use a valid UUID if the provided ID is not in UUID format
        
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', validUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to our frontend model
      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        schedule: item.schedule,
        userId: item.user_id,
        createdAt: item.created_at
      })) as Class[];
    } catch (error) {
      console.warn('Error fetching from Supabase, trying local fallback', error);
      // If Supabase fails, fall back to local storage
    }
    
    // Fallback to local storage
    const localClassesStr = localStorage.getItem('local_classes') || '[]';
    const localClasses = JSON.parse(localClassesStr) as Class[];
    return localClasses.filter(cls => cls.userId === userId);
  } catch (error) {
    console.error('Error getting classes:', error);
    return [];
  }
};

export const getClass = async (classId: string) => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (error) throw error;
  
  // Map database fields to our frontend model
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    schedule: data.schedule,
    userId: data.user_id,
    createdAt: data.created_at
  } as Class;
};

export const createClass = async (classData: Omit<Class, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('classes')
    .insert([{
      name: classData.name,
      description: classData.description,
      schedule: classData.schedule,
      user_id: classData.userId
    }])
    .select()
    .single();

  if (error) throw error;
  
  // Map database fields to our frontend model
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    schedule: data.schedule,
    userId: data.user_id,
    createdAt: data.created_at
  } as Class;
};

export const updateClass = async (classId: string, classData: Partial<Class>) => {
  const { data, error } = await supabase
    .from('classes')
    .update({
      name: classData.name,
      description: classData.description,
      schedule: classData.schedule
    })
    .eq('id', classId)
    .select()
    .single();

  if (error) throw error;
  
  // Map database fields to our frontend model
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    schedule: data.schedule,
    userId: data.user_id,
    createdAt: data.created_at
  } as Class;
};

export const deleteClass = async (classId: string) => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) throw error;
  return true;
};
