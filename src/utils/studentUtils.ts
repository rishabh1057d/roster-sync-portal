
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
      } else {
        // Update existing student to ensure consistent information
        const updatedStudent = {
          ...existingStudent,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email
        };
        
        // Replace existing student with updated data
        const updatedStudents = classStudents.map(s => 
          s.id === existingStudent.id ? updatedStudent : s
        );
        
        localStorage.setItem(classKey, JSON.stringify(updatedStudents));
        console.log(`Updated student ${student.firstName} ${student.lastName} in class ${classId}`);
      }
    } catch (error) {
      console.error(`Error syncing student to class ${classKey}:`, error);
    }
  });
};

// Function to clear all existing students and replace with new ones
export const replaceAllStudentsWithStandardList = async (classId: string): Promise<void> => {
  // Standard list of students to use across all classes
  const standardStudents = [
    { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@niet.ac.in' },
    { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@niet.ac.in' },
    { firstName: 'Rahul', lastName: 'Kumar', email: 'rahul.kumar@niet.ac.in' },
    { firstName: 'Ananya', lastName: 'Verma', email: 'ananya.verma@niet.ac.in' },
    { firstName: 'Kunal', lastName: 'Mehra', email: 'kunal.mehra@niet.ac.in' },
    { firstName: 'Ishita', lastName: 'Singh', email: 'ishita.singh@niet.ac.in' },
    { firstName: 'Arjun', lastName: 'Reddy', email: 'arjun.reddy@niet.ac.in' },
    { firstName: 'Neha', lastName: 'Gupta', email: 'neha.gupta@niet.ac.in' },
    { firstName: 'Rohan', lastName: 'Joshi', email: 'rohan.joshi@niet.ac.in' }
  ];
  
  try {
    // Clear existing students for this class in localStorage
    localStorage.setItem(`local_students_${classId}`, '[]');
    
    // Import required function here to avoid circular dependencies
    const { createStudent } = await import('../services/studentService');
    
    // Add all standard students
    for (const student of standardStudents) {
      await createStudent({
        ...student,
        classId
      });
    }
    
    console.log(`Successfully replaced students in class ${classId} with standard list`);
  } catch (error) {
    console.error(`Error replacing students in class ${classId}:`, error);
    throw error;
  }
};
