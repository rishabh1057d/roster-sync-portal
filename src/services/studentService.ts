
import { Student } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { saveToStorage, getFromStorage } from './storageUtils';
import { deleteAttendanceByStudentId } from './attendanceService';

export const getStudents = (classId: string): Student[] => {
  return getFromStorage<Student[]>('students', []).filter(s => s.classId === classId);
};

export const getStudent = (studentId: string): Student | undefined => {
  return getFromStorage<Student[]>('students', []).find(s => s.id === studentId);
};

export const createStudent = (studentData: Omit<Student, 'id'>): Student => {
  const students = getFromStorage<Student[]>('students', []);
  const newStudent: Student = {
    ...studentData,
    id: uuidv4()
  };
  
  students.push(newStudent);
  saveToStorage('students', students);
  return newStudent;
};

export const updateStudent = (studentId: string, studentData: Partial<Student>): Student | undefined => {
  const students = getFromStorage<Student[]>('students', []);
  const index = students.findIndex(s => s.id === studentId);
  
  if (index !== -1) {
    students[index] = { ...students[index], ...studentData };
    saveToStorage('students', students);
    return students[index];
  }
  
  return undefined;
};

export const deleteStudent = (studentId: string): boolean => {
  const students = getFromStorage<Student[]>('students', []);
  const filteredStudents = students.filter(s => s.id !== studentId);
  
  if (filteredStudents.length !== students.length) {
    saveToStorage('students', filteredStudents);
    deleteAttendanceByStudentId(studentId);
    return true;
  }
  
  return false;
};

// Internal helper function used by classService
export const deleteStudentsByClassId = (classId: string): void => {
  const students = getFromStorage<Student[]>('students', []);
  const remainingStudents = students.filter(s => s.classId !== classId);
  saveToStorage('students', remainingStudents);
};
