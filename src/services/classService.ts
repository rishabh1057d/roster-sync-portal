import { supabase } from '@/integrations/supabase/client';
import { Class } from '@/types';
import { updateClassStudents } from '@/utils/studentUtils';

export const getClasses = async (userId: string) => {
  // Check if userId is a valid UUID (Supabase expects UUIDs)
  // For testing or demo purposes, we'll return mock data if the userId isn't a valid UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  
  try {
    if (isUUID) {
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
    } else {
      // For demo/development purposes when using non-UUID user IDs
      console.log("Using mock classes data for non-UUID user ID");
      
      // Return mock data for demonstration
      return [
        {
          id: '6fea0f4c-feff-47da-8ad1-e3bdb1a1200a',
          name: 'Mathematics 101',
          description: 'Introduction to Calculus - NIET Engineering Department',
          schedule: 'MWF 9:00 AM - 10:30 AM',
          userId,
          createdAt: new Date().toISOString()
        },
        {
          id: '7cea0f4c-feff-47da-8ad1-e3bdb1a1200b',
          name: 'Physics 201',
          description: 'Classical Mechanics - NIET Science Department',
          schedule: 'TTh 1:00 PM - 2:30 PM',
          userId,
          createdAt: new Date().toISOString()
        },
        {
          id: '8dea0f4c-feff-47da-8ad1-e3bdb1a1200c',
          name: 'Computer Science 301',
          description: 'Data Structures and Algorithms - NIET Computer Science Department',
          schedule: 'MWF 2:00 PM - 3:30 PM',
          userId,
          createdAt: new Date().toISOString()
        }
      ];
    }
  } catch (error) {
    console.error("Error fetching classes:", error);
    
    // Return mock data as fallback in case of error
    return [
      {
        id: '6fea0f4c-feff-47da-8ad1-e3bdb1a1200a',
        name: 'Mathematics 101',
        description: 'Introduction to Calculus - NIET Engineering Department',
        schedule: 'MWF 9:00 AM - 10:30 AM',
        userId,
        createdAt: new Date().toISOString()
      },
      {
        id: '7cea0f4c-feff-47da-8ad1-e3bdb1a1200b',
        name: 'Physics 201',
        description: 'Classical Mechanics - NIET Science Department',
        schedule: 'TTh 1:00 PM - 2:30 PM',
        userId,
        createdAt: new Date().toISOString()
      },
      {
        id: '8dea0f4c-feff-47da-8ad1-e3bdb1a1200c',
        name: 'Computer Science 301',
        description: 'Data Structures and Algorithms - NIET Computer Science Department',
        schedule: 'MWF 2:00 PM - 3:30 PM',
        userId,
        createdAt: new Date().toISOString()
      }
    ];
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

// Update students in a class by subject
const updateSubjectClassStudents = async (subjectName: string) => {
  try {
    // Get all classes
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .eq('name', subjectName);

    if (error) throw error;
    
    if (classes && classes.length > 0) {
      const targetClass = classes[0];
      console.log(`Found ${subjectName} class with ID: ${targetClass.id}`);
      
      // Update students for this class
      const updatedStudents = await updateClassStudents(targetClass.id);
      return updatedStudents || [];
    } else {
      console.error(`${subjectName} class not found`);
      return [];
    }
  } catch (error) {
    console.error(`Error updating ${subjectName} class students:`, error);
    throw error;
  }
};

// Update students in a mathematics class to match our standard list
export const updateMathematicsClassStudents = async () => {
  return updateSubjectClassStudents('Mathematics 101');
};

// Update students in a physics class to match our standard list
export const updatePhysicsClassStudents = async () => {
  return updateSubjectClassStudents('Physics 201');
};

// Update students in a computer science class to match our standard list
export const updateComputerScienceClassStudents = async () => {
  return updateSubjectClassStudents('Computer Science 301');
};
