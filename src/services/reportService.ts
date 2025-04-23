
import { AttendanceStatus } from '@/types';
import { getStudents } from './studentService';
import { getFromStorage } from './storageUtils';

export const exportAttendanceCsv = (classId: string): string => {
  const students = getStudents(classId);
  const attendance = getFromStorage('attendance', [])
    .filter((a: any) => a.classId === classId);
  
  if (students.length === 0 || attendance.length === 0) {
    return '';
  }
  
  // Group attendance by date
  const attendanceByDate = attendance.reduce((acc: any, curr: any) => {
    if (!acc[curr.date]) {
      acc[curr.date] = {};
    }
    acc[curr.date][curr.studentId] = curr.status;
    return acc;
  }, {});
  
  // Get all dates with attendance records
  const dates = Object.keys(attendanceByDate).sort();
  
  // Create CSV header
  let csv = 'Student ID,First Name,Last Name,Email,' + dates.join(',') + '\n';
  
  // Add data for each student
  students.forEach(student => {
    let row = `${student.id},${student.firstName},${student.lastName},${student.email},`;
    
    dates.forEach((date, index) => {
      const status = attendanceByDate[date][student.id] || '';
      row += status;
      if (index < dates.length - 1) {
        row += ',';
      }
    });
    
    csv += row + '\n';
  });
  
  return csv;
};
