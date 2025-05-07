
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types';
import { toast } from '@/components/ui/sonner';
import { logDataMismatch } from '@/utils/studentUtils';

// Get students from Supabase for a specific class
export const getSupabaseStudents = async (classId: string): Promise<Student[]> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('first_name');

    if (error) {
      console.error("Supabase error fetching students:", error);
      throw error;
    }
    
    // Map database fields to our frontend model
    const supabaseStudents = data.map(item => ({
      id: item.id,
      firstName: item.first_name,
      lastName: item.last_name,
      email: item.email,
      classId: item.class_id
    })) as Student[];
    
    logDataMismatch('Supabase', supabaseStudents);
    return supabaseStudents;
  } catch (error) {
    console.error("Error fetching Supabase students:", error);
    throw error;
  }
};

// Get a student from Supabase by ID
export const getSupabaseStudent = async (studentId: string): Promise<Student | null> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        console.log(`Student with ID ${studentId} not found in Supabase`);
        return null;
      }
      console.error("Supabase error fetching student:", error);
      throw error;
    }
    
    // Map database fields to our frontend model
    const student = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      classId: data.class_id
    } as Student;
    
    console.log("Found Supabase student:", student);
    return student;
  } catch (error) {
    console.error("Error fetching student from Supabase:", error);
    return null;
  }
};

// Create a student in Supabase
export const createSupabaseStudent = async (studentData: Omit<Student, 'id'>): Promise<Student | null> => {
  try {
    // Try to create in Supabase
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

    if (error) {
      console.error("Error creating student in Supabase:", error);
      
      // Check if this student already exists in Supabase
      if (studentData.email) {
        const { data: existingData } = await supabase
          .from('students')
          .select('*')
          .eq('email', studentData.email)
          .eq('class_id', studentData.classId)
          .maybeSingle();
          
        if (existingData) {
          console.log("Student already exists in Supabase:", existingData);
          toast.warning("Student with this email already exists");
          
          // Return the existing student
          return {
            id: existingData.id,
            firstName: existingData.first_name,
            lastName: existingData.last_name,
            email: existingData.email,
            classId: existingData.class_id
          } as Student;
        }
      }

      // Also check by name
      const { data: existingByName } = await supabase
        .from('students')
        .select('*')
        .eq('first_name', studentData.firstName)
        .eq('last_name', studentData.lastName)
        .eq('class_id', studentData.classId)
        .maybeSingle();
        
      if (existingByName) {
        console.log("Student already exists in Supabase by name:", existingByName);
        toast.warning("Student with this name already exists");
        
        // Return the existing student
        return {
          id: existingByName.id,
          firstName: existingByName.first_name,
          lastName: existingByName.last_name,
          email: existingByName.email,
          classId: existingByName.class_id
        } as Student;
      }
      
      throw error;
    }
    
    // Map database fields to our frontend model
    const createdStudent = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      classId: data.class_id
    } as Student;
    
    console.log("Created student in Supabase:", createdStudent);
    return createdStudent;
  } catch (error) {
    console.error("Unexpected error creating student in Supabase:", error);
    return null;
  }
};

// Update a student in Supabase
export const updateSupabaseStudent = async (studentId: string, studentData: Partial<Student>): Promise<Student | null> => {
  try {
    console.log("Updating Supabase student");
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

    if (error) {
      console.error("Supabase error updating student:", error);
      throw error;
    }
    
    // Map database fields to our frontend model
    const updatedStudent = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      classId: data.class_id
    } as Student;
    
    console.log("Updated Supabase student:", updatedStudent);
    return updatedStudent;
  } catch (error) {
    console.error("Error updating student in Supabase:", error);
    return null;
  }
};

// Delete a student from Supabase
export const deleteSupabaseStudent = async (studentId: string): Promise<boolean> => {
  try {
    console.log("Deleting Supabase student");
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) {
      console.error("Supabase error deleting student:", error);
      throw error;
    }
    
    console.log("Deleted Supabase student successfully");
    return true;
  } catch (error) {
    console.error("Error deleting student from Supabase:", error);
    return false;
  }
};
