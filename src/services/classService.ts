
import { supabase } from '@/integrations/supabase/client';
import { Class } from '@/types';
import { updateClassStudents } from '@/utils/studentUtils';

export const getClasses = async (userId: string) => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', userId)
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

// Update students in a mathematics class to match our standard list
export const updateMathematicsClassStudents = async () => {
  try {
    // Get all classes
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .eq('name', 'Mathematics 101');

    if (error) throw error;
    
    if (classes && classes.length > 0) {
      const mathClass = classes[0];
      console.log(`Found Mathematics class with ID: ${mathClass.id}`);
      
      // Update students for this class
      const updatedStudents = await updateClassStudents(mathClass.id);
      return updatedStudents;
    } else {
      console.error("Mathematics class not found");
      return null;
    }
  } catch (error) {
    console.error("Error updating Mathematics class students:", error);
    throw error;
  }
};

// Update students in a physics class to match our standard list
export const updatePhysicsClassStudents = async () => {
  try {
    // Get all classes
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .eq('name', 'Physics 201');

    if (error) throw error;
    
    if (classes && classes.length > 0) {
      const physicsClass = classes[0];
      console.log(`Found Physics class with ID: ${physicsClass.id}`);
      
      // Update students for this class
      const updatedStudents = await updateClassStudents(physicsClass.id);
      return updatedStudents;
    } else {
      console.error("Physics class not found");
      return null;
    }
  } catch (error) {
    console.error("Error updating Physics class students:", error);
    throw error;
  }
};

// Update students in a computer science class to match our standard list
export const updateComputerScienceClassStudents = async () => {
  try {
    // Get all classes
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .eq('name', 'Computer Science 301');

    if (error) throw error;
    
    if (classes && classes.length > 0) {
      const csClass = classes[0];
      console.log(`Found Computer Science class with ID: ${csClass.id}`);
      
      // Update students for this class
      const updatedStudents = await updateClassStudents(csClass.id);
      return updatedStudents;
    } else {
      console.error("Computer Science class not found");
      return null;
    }
  } catch (error) {
    console.error("Error updating Computer Science class students:", error);
    throw error;
  }
};
