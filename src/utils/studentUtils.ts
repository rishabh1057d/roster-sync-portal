
import { Student } from '@/types';

// Helper function to log data mismatches for debugging
export const logDataMismatch = (source: string, data: any) => {
  console.log(`Data from ${source}:`, data);
};

// Get all local students across all classes
export const getAllLocalStudents = (): Student[] => {
  const allLocalStudents: Student[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('local_students_')) {
      try {
        const classStudents = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
        allLocalStudents.push(...classStudents);
      } catch (error) {
        console.error(`Error parsing local students from ${key}:`, error);
      }
    }
  }
  
  return allLocalStudents;
};

// Ensure student exists in all classes with the same details
export const syncStudentAcrossClasses = (student: Student) => {
  // Get all class keys from localStorage
  const classKeys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('local_students_') && key !== `local_students_${student.classId}`) {
      classKeys.push(key);
    }
  }
  
  // Sync this student to all other classes
  classKeys.forEach(classKey => {
    try {
      const classId = classKey.replace('local_students_', '');
      const classStudents = JSON.parse(localStorage.getItem(classKey) || '[]') as Student[];
      
      // Check if a similar student already exists in this class
      const existingStudent = classStudents.find(s => 
        (s.firstName === student.firstName && s.lastName === student.lastName) ||
        (student.email && s.email === student.email && student.email !== '')
      );
      
      if (!existingStudent) {
        // Add student to this class
        classStudents.push({
          ...student,
          id: student.id, // Keep the same student ID across classes
          classId // Update class ID for this instance
        });
        
        localStorage.setItem(classKey, JSON.stringify(classStudents));
        console.log(`Synced student ${student.firstName} ${student.lastName} to class ${classId}`);
      }
    } catch (error) {
      console.error(`Error syncing student to class ${classKey}:`, error);
    }
  });
};
