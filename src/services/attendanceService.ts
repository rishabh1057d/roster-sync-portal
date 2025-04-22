
import { Attendance, AttendanceStatus } from '@/types';
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

export const getAttendanceByClassAndDate = (classId: string, date: string): Attendance[] => {
  return getFromStorage<Attendance[]>('attendance', [])
    .filter(a => a.classId === classId && a.date === date);
};

export const getAttendanceByStudent = (studentId: string): Attendance[] => {
  return getFromStorage<Attendance[]>('attendance', [])
    .filter(a => a.studentId === studentId);
};

export const markAttendance = (studentId: string, classId: string, date: string, status: AttendanceStatus): Attendance => {
  const attendance = getFromStorage<Attendance[]>('attendance', []);
  
  // Check if attendance already exists for this student, class, and date
  const existingIndex = attendance.findIndex(
    a => a.studentId === studentId && a.classId === classId && a.date === date
  );
  
  if (existingIndex !== -1) {
    // Update existing record
    attendance[existingIndex].status = status;
    saveToStorage('attendance', attendance);
    return attendance[existingIndex];
  } else {
    // Create new record
    const newAttendance: Attendance = {
      id: uuidv4(),
      studentId,
      classId,
      date,
      status
    };
    
    attendance.push(newAttendance);
    saveToStorage('attendance', attendance);
    return newAttendance;
  }
};

export const getAttendanceStats = (classId: string): Record<AttendanceStatus, number> => {
  const allAttendance = getFromStorage<Attendance[]>('attendance', [])
    .filter(a => a.classId === classId);
  
  return {
    present: allAttendance.filter(a => a.status === 'present').length,
    absent: allAttendance.filter(a => a.status === 'absent').length,
    late: allAttendance.filter(a => a.status === 'late').length,
    excused: allAttendance.filter(a => a.status === 'excused').length
  };
};
