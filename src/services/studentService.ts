
import { supabase, isLocalStudentId } from '@/integrations/supabase/client';
import { Student } from '@/types';
import { toast } from '@/components/ui/sonner';
import { logDataMismatch, getAllLocalStudents, syncStudentAcrossClasses } from '@/utils/studentUtils';
import { 
  getLocalStudents, 
  saveStudentToLocalStorage, 
  deleteLocalStudent, 
  findLocalStudent, 
  updateLocalStudent 
} from './studentLocalStorage';
import {
  getSupabaseStudents,
  getSupabaseStudent,
  createSupabaseStudent,
  updateSupabaseStudent,
  deleteSupabaseStudent
} from './studentSupabaseService';

export const getStudents = async (classId: string) => {
  try {
    console.log(`Fetching students for class ${classId}`);
    
    // First get students from Supabase
    let supabaseStudents: Student[] = [];
    try {
      supabaseStudents = await getSupabaseStudents(classId);
    } catch (error) {
      console.error("Failed to fetch students from Supabase:", error);
    }
    
    // Get locally stored students for this class
    const localStudents = getLocalStudents(classId);
    
    // We need to ensure students with the same name/email don't appear twice
    const combinedStudents = [...supabaseStudents];
    
    // Only add local students that don't exist in Supabase
    localStudents.forEach(localStudent => {
      const duplicateInSupabase = supabaseStudents.some(
        s => (s.firstName === localStudent.firstName && s.lastName === localStudent.lastName) ||
             (s.email === localStudent.email && localStudent.email !== '')
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
    const localStudents = getLocalStudents(classId);
    console.log("Falling back to local students only:", localStudents);
    return localStudents;
  }
};

export const getStudent = async (studentId: string) => {
  try {
    console.log(`Fetching student with ID: ${studentId}`);
    
    // First check if this is a local student ID
    if (isLocalStudentId(studentId)) {
      console.log("Looking for local student");
      const localStudent = findLocalStudent(studentId);
      if (localStudent) {
        console.log("Found local student:", localStudent);
        return localStudent;
      }
      console.log("Local student not found");
      return null;
    }
    
    // For Supabase students, query the database
    const student = await getSupabaseStudent(studentId);
    return student;
  } catch (error) {
    console.error("Error fetching student:", error);
    return null;
  }
};

export const createStudent = async (studentData: Omit<Student, 'id'>) => {
  try {
    console.log("Creating student:", studentData);
    
    // First check if a similar student already exists locally in any class
    const allLocalStudents = getAllLocalStudents();
    const existingLocalStudent = allLocalStudents.find(s => 
      (s.firstName === studentData.firstName && s.lastName === studentData.lastName) ||
      (studentData.email && s.email === studentData.email && studentData.email !== '')
    );
    
    if (existingLocalStudent) {
      console.log("Similar student already exists locally:", existingLocalStudent);
      
      // Sync this student to the current class
      const localId = existingLocalStudent.id;
      const updatedStudent: Student = {
        ...existingLocalStudent,
        classId: studentData.classId // Update to current class
      };
      
      // Add to current class if not already there
      saveStudentToLocalStorage(updatedStudent);
      
      return updatedStudent;
    }
    
    // Try to create in Supabase
    try {
      const createdStudent = await createSupabaseStudent(studentData);
      if (createdStudent) {
        // Remove any local duplicates with the same email or name
        const localStudents = getLocalStudents(createdStudent.classId);
        const filteredStudents = localStudents.filter(
          s => (s.firstName !== createdStudent.firstName || s.lastName !== createdStudent.lastName) &&
              (s.email !== createdStudent.email || s.email === '')
        );
        
        if (filteredStudents.length !== localStudents.length) {
          console.log("Removed local duplicate students");
          localStorage.setItem(`local_students_${createdStudent.classId}`, JSON.stringify(filteredStudents));
        }
        
        return createdStudent;
      }
    } catch (error) {
      console.error("Failed to create student in Supabase:", error);
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
    saveStudentToLocalStorage(newStudent);
    console.log("Created student in localStorage:", newStudent);
    
    // Sync this student to all other classes
    syncStudentAcrossClasses(newStudent);
    
    return newStudent;
  } catch (error) {
    console.error("Unexpected error creating student:", error);
    throw error;
  }
};

export const updateStudent = async (studentId: string, studentData: Partial<Student>) => {
  try {
    console.log(`Updating student ${studentId}:`, studentData);
    
    // Check if this is a local student
    if (isLocalStudentId(studentId)) {
      console.log("Updating local student");
      const updatedStudent = updateLocalStudent(studentId, studentData);
      if (!updatedStudent) {
        throw new Error("Local student not found");
      }
      return updatedStudent;
    }
    
    // For Supabase students
    const updatedStudent = await updateSupabaseStudent(studentId, studentData);
    if (!updatedStudent) {
      throw new Error("Failed to update student in Supabase");
    }
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
    if (isLocalStudentId(studentId)) {
      console.log("Deleting local student");
      const deleted = deleteLocalStudent(studentId);
      if (!deleted) {
        console.log("Local student not found for deletion");
        return false;
      }
      return true;
    }
    
    // For Supabase students
    const deleted = await deleteSupabaseStudent(studentId);
    return deleted;
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};
