
import { Student } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to save data to localStorage
const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Helper to get data from localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

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
    return true;
  }
  
  return false;
};
