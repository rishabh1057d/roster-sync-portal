
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types';
import { toast } from '@/components/ui/sonner';

// Helper function to log data mismatches for debugging
const logDataMismatch = (source: string, data: any) => {
  console.log(`Data from ${source}:`, data);
};

export const getStudents = async (classId: string) => {
  try {
    console.log(`Fetching students for class ${classId}`);
    
    // First get students from Supabase
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
    
    // Get locally stored students for this class
    const localStorageKey = `local_students_${classId}`;
    const localStudentsStr = localStorage.getItem(localStorageKey);
    const localStudents: Student[] = localStudentsStr ? JSON.parse(localStudentsStr) : [];
    
    logDataMismatch('localStorage', localStudents);
    
    // We need to ensure students with the same email don't appear twice
    // This can happen if a student was created locally then later synced to Supabase
    const combinedStudents = [...supabaseStudents];
    
    // Only add local students that don't exist in Supabase
    localStudents.forEach(localStudent => {
      const duplicateInSupabase = supabaseStudents.some(
        s => s.email === localStudent.email && localStudent.email !== ''
      );
      
      if (!duplicateInSupabase) {
        combinedStudents.push(localStudent);
      } else {
        console.log(`Skipping local student ${localStudent.firstName} ${localStudent.lastName} as they exist in Supabase`);
      }
    });
    
    console.log("Final combined students:", combinedStudents);
    return combinedStudents;
  } catch (error) {
    console.error("Error fetching students:", error);
    
    // Fallback to local students only
    const localStorageKey = `local_students_${classId}`;
    const localStudentsStr = localStorage.getItem(localStorageKey);
    const localStudents = localStudentsStr ? JSON.parse(localStudentsStr) : [];
    
    console.log("Falling back to local students only:", localStudents);
    return localStudents;
  }
};

export const getStudent = async (studentId: string) => {
  try {
    console.log(`Fetching student with ID: ${studentId}`);
    
    // First check if this is a local student ID
    if (studentId.includes('temp-id') || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      console.log("Looking for local student");
      // Look for this student in localStorage across all classes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('local_students_')) {
          const students = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
          const foundStudent = students.find(s => s.id === studentId);
          if (foundStudent) {
            console.log("Found local student:", foundStudent);
            return foundStudent;
          }
        }
      }
      console.log("Local student not found");
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
    
    // Remove any local duplicates with the same email
    if (createdStudent.email) {
      const localStorageKey = `local_students_${createdStudent.classId}`;
      const existingStudentsStr = localStorage.getItem(localStorageKey);
      
      if (existingStudentsStr) {
        const existingStudents: Student[] = JSON.parse(existingStudentsStr);
        const filteredStudents = existingStudents.filter(
          s => s.email !== createdStudent.email || s.email === ''
        );
        
        if (filteredStudents.length !== existingStudents.length) {
          console.log("Removed local duplicate students with same email");
          localStorage.setItem(localStorageKey, JSON.stringify(filteredStudents));
        }
      }
    }
    
    return createdStudent;
  } catch (error) {
    console.error("Unexpected error creating student:", error);
    throw error;
  }
};

export const updateStudent = async (studentId: string, studentData: Partial<Student>) => {
  try {
    console.log(`Updating student ${studentId}:`, studentData);
    
    // Check if this is a local student
    if (studentId.includes('temp-id') || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      console.log("Updating local student");
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
            
            console.log("Updated local student:", foundStudents[studentIndex]);
            return foundStudents[studentIndex];
          }
        }
      }
      
      throw new Error("Local student not found");
    }
    
    // For Supabase students
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
    console.error("Error updating student:", error);
    throw error;
  }
};

export const deleteStudent = async (studentId: string) => {
  try {
    console.log(`Deleting student ${studentId}`);
    
    // Check if this is a local student
    if (studentId.includes('temp-id') || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      console.log("Deleting local student");
      // Delete from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('local_students_')) {
          const students = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
          const updatedStudents = students.filter(s => s.id !== studentId);
          
          if (updatedStudents.length !== students.length) {
            localStorage.setItem(key, JSON.stringify(updatedStudents));
            console.log("Deleted local student successfully");
            
            // Also delete attendance records
            for (let j = 0; j < localStorage.length; j++) {
              const attendanceKey = localStorage.key(j);
              if (attendanceKey && attendanceKey.startsWith('attendance_')) {
                const records = JSON.parse(localStorage.getItem(attendanceKey) || '[]') as any[];
                const updatedRecords = records.filter(r => r.studentId !== studentId);
                
                if (updatedRecords.length !== records.length) {
                  localStorage.setItem(attendanceKey, JSON.stringify(updatedRecords));
                  console.log("Deleted local attendance records for student");
                }
              }
            }
            
            return true;
          }
        }
      }
      
      console.log("Local student not found for deletion");
      return false;
    }
    
    // For Supabase students
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
    console.error("Error deleting student:", error);
    throw error;
  }
};
