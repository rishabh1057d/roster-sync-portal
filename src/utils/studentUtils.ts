
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
