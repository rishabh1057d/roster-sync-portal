
import { Class } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { saveToStorage, getFromStorage } from './storageUtils';
import { deleteStudentsByClassId } from './studentService';
import { deleteAttendanceByClassId } from './attendanceService';

export const getClasses = (userId: string): Class[] => {
  return getFromStorage<Class[]>('classes', []).filter(c => c.userId === userId);
};

export const getClass = (classId: string): Class | undefined => {
  return getFromStorage<Class[]>('classes', []).find(c => c.id === classId);
};

export const createClass = (classData: Omit<Class, 'id' | 'createdAt'>): Class => {
  const classes = getFromStorage<Class[]>('classes', []);
  const newClass: Class = {
    ...classData,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  
  classes.push(newClass);
  saveToStorage('classes', classes);
  return newClass;
};

export const updateClass = (classId: string, classData: Partial<Class>): Class | undefined => {
  const classes = getFromStorage<Class[]>('classes', []);
  const index = classes.findIndex(c => c.id === classId);
  
  if (index !== -1) {
    classes[index] = { ...classes[index], ...classData };
    saveToStorage('classes', classes);
    return classes[index];
  }
  
  return undefined;
};

export const deleteClass = (classId: string): boolean => {
  const classes = getFromStorage<Class[]>('classes', []);
  const filteredClasses = classes.filter(c => c.id !== classId);
  
  if (filteredClasses.length !== classes.length) {
    saveToStorage('classes', filteredClasses);
    
    // Delete related data
    deleteStudentsByClassId(classId);
    deleteAttendanceByClassId(classId);
    
    return true;
  }
  
  return false;
};
