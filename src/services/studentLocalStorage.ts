
import { Student } from '@/types';
import { isLocalStudentId } from '@/integrations/supabase/client';

// Add student to local storage
export const saveStudentToLocalStorage = (student: Student): void => {
  const localStorageKey = `local_students_${student.classId}`;
  const existingStudentsStr = localStorage.getItem(localStorageKey);
  const existingStudents: Student[] = existingStudentsStr ? JSON.parse(existingStudentsStr) : [];
  
  // Check if student already exists
  const existingIndex = existingStudents.findIndex(s => s.id === student.id);
  
  if (existingIndex >= 0) {
    // Update existing student
    existingStudents[existingIndex] = student;
  } else {
    // Add new student
    existingStudents.push(student);
  }
  
  localStorage.setItem(localStorageKey, JSON.stringify(existingStudents));
};

// Get students from local storage for a specific class
export const getLocalStudents = (classId: string): Student[] => {
  const localStorageKey = `local_students_${classId}`;
  const localStudentsStr = localStorage.getItem(localStorageKey);
  return localStudentsStr ? JSON.parse(localStudentsStr) : [];
};

// Delete student from all local storage instances
export const deleteLocalStudent = (studentId: string): boolean => {
  let deleted = false;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('local_students_')) {
      const students = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
      const updatedStudents = students.filter(s => s.id !== studentId);
      
      if (updatedStudents.length !== students.length) {
        localStorage.setItem(key, JSON.stringify(updatedStudents));
        deleted = true;
      }
    }
  }
  
  // Also delete attendance records if student was deleted
  if (deleted) {
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
  }
  
  return deleted;
};

// Find a local student by ID
export const findLocalStudent = (studentId: string): Student | null => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('local_students_')) {
      const students = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
      const foundStudent = students.find(s => s.id === studentId);
      if (foundStudent) {
        return foundStudent;
      }
    }
  }
  return null;
};

// Update local student data
export const updateLocalStudent = (studentId: string, studentData: Partial<Student>): Student | null => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('local_students_')) {
      const students = JSON.parse(localStorage.getItem(key) || '[]') as Student[];
      const studentIndex = students.findIndex(s => s.id === studentId);
      
      if (studentIndex >= 0) {
        // Update the student
        students[studentIndex] = {
          ...students[studentIndex],
          ...(studentData.firstName && { firstName: studentData.firstName }),
          ...(studentData.lastName && { lastName: studentData.lastName }),
          ...(studentData.email && { email: studentData.email }),
          ...(studentData.classId && { classId: studentData.classId })
        };
        
        // Save back to localStorage
        localStorage.setItem(key, JSON.stringify(students));
        
        return students[studentIndex];
      }
    }
  }
  return null;
};
