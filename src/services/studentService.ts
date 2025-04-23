
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types';

export const getStudents = async (classId: string) => {
  try {
    // First get students from Supabase
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('first_name');

    if (error) throw error;
    
    // Map database fields to our frontend model
    const supabaseStudents = data.map(item => ({
      id: item.id,
      firstName: item.first_name,
      lastName: item.last_name,
      email: item.email,
      classId: item.class_id
    })) as Student[];
    
    // Get locally stored students for this class
    const localStorageKey = `local_students_${classId}`;
    const localStudentsStr = localStorage.getItem(localStorageKey);
    const localStudents: Student[] = localStudentsStr ? JSON.parse(localStudentsStr) : [];
    
    // Combine both sources
    return [...supabaseStudents, ...localStudents];
  } catch (error) {
    console.error("Error fetching students:", error);
    
    // Fallback to local students only
    const localStorageKey = `local_students_${classId}`;
    const localStudentsStr = localStorage.getItem(localStorageKey);
    return localStudentsStr ? JSON.parse(localStudentsStr) : [];
  }
};

export const getStudent = async (studentId: string) => {
  try {
    // First check if this is a local student ID
    if (studentId.includes('temp-id') || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      // Look for this student in localStorage across all classes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('local_students_')) {
          const students = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
          const foundStudent = students.find(s => s.id === studentId);
          if (foundStudent) return foundStudent;
        }
      }
      return null;
    }
    
    // For Supabase students, query the database
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        return null;
      }
      throw error;
    }
    
    // Map database fields to our frontend model
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      classId: data.class_id
    } as Student;
  } catch (error) {
    console.error("Error fetching student:", error);
    return null;
  }
};

export const createStudent = async (studentData: Omit<Student, 'id'>) => {
  try {
    console.log("Creating student:", studentData);
    // Try to create in Supabase first
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
      
      // Fall back to localStorage
      const localId = `temp-id-${Date.now()}`;
      const newStudent: Student = {
        id: localId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email,
        classId: studentData.classId
      };
      
      // Save to localStorage
      const localStorageKey = `local_students_${studentData.classId}`;
      const existingStudentsStr = localStorage.getItem(localStorageKey);
      const existingStudents: Student[] = existingStudentsStr ? JSON.parse(existingStudentsStr) : [];
      
      existingStudents.push(newStudent);
      localStorage.setItem(localStorageKey, JSON.stringify(existingStudents));
      
      console.log("Created student in localStorage:", newStudent);
      return newStudent;
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
    console.error("Unexpected error creating student:", error);
    throw error;
  }
};

export const updateStudent = async (studentId: string, studentData: Partial<Student>) => {
  try {
    // Check if this is a local student
    if (studentId.includes('temp-id') || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      // Update in localStorage
      const classId = studentData.classId || '';
      
      // Find which local storage key contains this student
      let foundKey = null;
      let foundStudents = null;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('local_students_')) {
          const students = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
          const studentIndex = students.findIndex(s => s.id === studentId);
          
          if (studentIndex >= 0) {
            foundKey = key;
            foundStudents = students;
            
            // Update the student
            foundStudents[studentIndex] = {
              ...foundStudents[studentIndex],
              ...(studentData.firstName && { firstName: studentData.firstName }),
              ...(studentData.lastName && { lastName: studentData.lastName }),
              ...(studentData.email && { email: studentData.email }),
              ...(studentData.classId && { classId: studentData.classId })
            };
            
            // Save back to localStorage
            localStorage.setItem(foundKey, JSON.stringify(foundStudents));
            
            return foundStudents[studentIndex];
          }
        }
      }
      
      throw new Error("Local student not found");
    }
    
    // For Supabase students
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
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

export const deleteStudent = async (studentId: string) => {
  try {
    // Check if this is a local student
    if (studentId.includes('temp-id') || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      // Delete from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('local_students_')) {
          const students = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
          const updatedStudents = students.filter(s => s.id !== studentId);
          
          if (updatedStudents.length !== students.length) {
            localStorage.setItem(key, JSON.stringify(updatedStudents));
            
            // Also delete attendance records
            for (let j = 0; j < localStorage.length; j++) {
              const attendanceKey = localStorage.key(j);
              if (attendanceKey && attendanceKey.startsWith('attendance_')) {
                const records = JSON.parse(localStorage.getItem(attendanceKey) || '[]') as any[];
                const updatedRecords = records.filter(r => r.studentId !== studentId);
                
                if (updatedRecords.length !== records.length) {
                  localStorage.setItem(attendanceKey, JSON.stringify(updatedRecords));
                }
              }
            }
            
            return true;
          }
        }
      }
      
      return false;
    }
    
    // For Supabase students
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};
