
import { createClass } from './classService';
import { createStudent } from './studentService';
import { markAttendance } from './attendanceService';
import { AttendanceStatus } from '@/types';
import { getFromStorage } from './storageUtils';

export const initializeMockData = (userId: string) => {
  // Only initialize if no data exists
  if (getFromStorage<any[]>('classes', []).length === 0) {
    // Create mock classes with NIET branding
    const class1 = createClass({
      name: 'Mathematics 101',
      description: 'Introduction to Calculus - NIET Engineering Department',
      schedule: 'MWF 9:00 AM - 10:30 AM',
      userId
    });
    
    const class2 = createClass({
      name: 'Physics 201',
      description: 'Classical Mechanics - NIET Science Department',
      schedule: 'TTh 1:00 PM - 2:30 PM',
      userId
    });

    const class3 = createClass({
      name: 'Computer Science 301',
      description: 'Data Structures and Algorithms - NIET Computer Science Department',
      schedule: 'MWF 2:00 PM - 3:30 PM',
      userId
    });
    
    // Create mock students with Indian names for Mathematics
    const mathStudents = [
      { firstName: 'Aditya', lastName: 'Sharma', email: 'aditya.sharma@niet.ac.in', classId: class1.id },
      { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@niet.ac.in', classId: class1.id },
      { firstName: 'Rahul', lastName: 'Kumar', email: 'rahul.kumar@niet.ac.in', classId: class1.id },
      { firstName: 'Neha', lastName: 'Gupta', email: 'neha.gupta@niet.ac.in', classId: class1.id },
      { firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@niet.ac.in', classId: class1.id },
      { firstName: 'Aarav', lastName: 'Verma', email: 'aarav.verma@niet.ac.in', classId: class1.id },
      { firstName: 'Ishaan', lastName: 'Malhotra', email: 'ishaan.m@niet.ac.in', classId: class1.id },
      { firstName: 'Riya', lastName: 'Kapoor', email: 'riya.k@niet.ac.in', classId: class1.id }
    ];
    
    // Create mock students with Indian names for Physics
    const physicsStudents = [
      { firstName: 'Ananya', lastName: 'Reddy', email: 'ananya.reddy@niet.ac.in', classId: class2.id },
      { firstName: 'Rohan', lastName: 'Mehta', email: 'rohan.mehta@niet.ac.in', classId: class2.id },
      { firstName: 'Shreya', lastName: 'Joshi', email: 'shreya.joshi@niet.ac.in', classId: class2.id },
      { firstName: 'Arjun', lastName: 'Malhotra', email: 'arjun.malhotra@niet.ac.in', classId: class2.id },
      { firstName: 'Divya', lastName: 'Krishnamurthy', email: 'divya.k@niet.ac.in', classId: class2.id },
      { firstName: 'Kabir', lastName: 'Choudhury', email: 'kabir.c@niet.ac.in', classId: class2.id },
      { firstName: 'Zara', lastName: 'Khan', email: 'zara.khan@niet.ac.in', classId: class2.id },
      { firstName: 'Ved', lastName: 'Iyer', email: 'ved.iyer@niet.ac.in', classId: class2.id }
    ];

    // Create mock students with Indian names for Computer Science
    const csStudents = [
      { firstName: 'Aditi', lastName: 'Bhattacharya', email: 'aditi.b@niet.ac.in', classId: class3.id },
      { firstName: 'Arnav', lastName: 'Desai', email: 'arnav.d@niet.ac.in', classId: class3.id },
      { firstName: 'Tanvi', lastName: 'Sharma', email: 'tanvi.s@niet.ac.in', classId: class3.id },
      { firstName: 'Vivaan', lastName: 'Nair', email: 'vivaan.n@niet.ac.in', classId: class3.id },
      { firstName: 'Diya', lastName: 'Rao', email: 'diya.rao@niet.ac.in', classId: class3.id },
      { firstName: 'Reyansh', lastName: 'Mehra', email: 'reyansh.m@niet.ac.in', classId: class3.id },
      { firstName: 'Saanvi', lastName: 'Agarwal', email: 'saanvi.a@niet.ac.in', classId: class3.id },
      { firstName: 'Krishna', lastName: 'Trivedi', email: 'krishna.t@niet.ac.in', classId: class3.id }
    ];
    
    [...mathStudents, ...physicsStudents, ...csStudents].forEach(student => createStudent(student));
    
    // Create mock attendance for today
    const today = new Date().toISOString().split('T')[0];
    
    // Mark attendance for math class
    mathStudents.forEach((student, index) => {
      let status: AttendanceStatus;
      if (index < 5) status = 'present';
      else if (index === 5) status = 'late';
      else status = 'absent';
      
      markAttendance(student.id, class1.id, today, status);
    });
    
    // Mark attendance for physics class
    physicsStudents.forEach((student, index) => {
      let status: AttendanceStatus;
      if (index < 4) status = 'present';
      else if (index === 4) status = 'excused';
      else if (index === 5) status = 'late';
      else status = 'present';
      
      markAttendance(student.id, class2.id, today, status);
    });

    // Mark attendance for CS class
    csStudents.forEach((student, index) => {
      let status: AttendanceStatus;
      if (index < 6) status = 'present';
      else if (index === 6) status = 'late';
      else status = 'excused';
      
      markAttendance(student.id, class3.id, today, status);
    });
  }
};
