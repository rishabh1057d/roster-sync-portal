
import { Attendance, AttendanceStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { saveToStorage, getFromStorage } from './storageUtils';

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
  
  const existingIndex = attendance.findIndex(
    a => a.studentId === studentId && a.classId === classId && a.date === date
  );
  
  if (existingIndex !== -1) {
    attendance[existingIndex].status = status;
    saveToStorage('attendance', attendance);
    return attendance[existingIndex];
  } else {
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

// Internal helper functions used by other services
export const deleteAttendanceByClassId = (classId: string): void => {
  const attendance = getFromStorage<Attendance[]>('attendance', []);
  const remainingAttendance = attendance.filter(a => a.classId !== classId);
  saveToStorage('attendance', remainingAttendance);
};

export const deleteAttendanceByStudentId = (studentId: string): void => {
  const attendance = getFromStorage<Attendance[]>('attendance', []);
  const remainingAttendance = attendance.filter(a => a.studentId !== studentId);
  saveToStorage('attendance', remainingAttendance);
};
