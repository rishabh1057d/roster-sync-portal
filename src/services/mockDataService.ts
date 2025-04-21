
import { Class, Student, Attendance, AttendanceStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { markAttendance } from './attendanceService';
import { createClass } from './classService';
import { createStudent } from './studentService';

export const initializeMockData = (userId: string) => {
  // Only initialize if no data exists
  const existingClasses = JSON.parse(localStorage.getItem('classes') || '[]');
  if (existingClasses.length === 0) {
    // Create mock classes
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

    const class4 = createClass({
      name: 'Java Programming',
      description: 'Advanced Java Programming and Design Patterns - NIET Computer Science Department',
      schedule: 'TTh 10:00 AM - 11:30 AM',
      userId
    });

    const class5 = createClass({
      name: 'Python Programming',
      description: 'Python Programming with Data Science - NIET Computer Science Department',
      schedule: 'MWF 11:00 AM - 12:30 PM',
      userId
    });

    const class6 = createClass({
      name: 'Design Thinking',
      description: 'Innovation and Design Thinking - NIET Design Department',
      schedule: 'TTh 3:00 PM - 4:30 PM',
      userId
    });

    // List of student names
    const studentNames = [
      { firstName: 'Aarav', lastName: 'Sharma' },
      { firstName: 'Priya', lastName: 'Nair' },
      { firstName: 'Rohan', lastName: 'Mehta' },
      { firstName: 'Ananya', lastName: 'Verma' },
      { firstName: 'Kunal', lastName: 'Iyer' },
      { firstName: 'Sneha', lastName: 'Reddy' },
      { firstName: 'Arjun', lastName: 'Patel' },
      { firstName: 'Meera', lastName: 'Das' },
      { firstName: 'Rahul', lastName: 'Chauhan' },
      { firstName: 'Isha', lastName: 'Gupta' },
      { firstName: 'Devansh', lastName: 'Malhotra' },
      { firstName: 'Neha', lastName: 'Joshi' },
      { firstName: 'Siddharth', lastName: 'Rao' },
      { firstName: 'Kavya', lastName: 'Bansal' },
      { firstName: 'Manish', lastName: 'Kulkarni' }
    ];

    // Create students for each class
    const classes = [class1, class2, class3, class4, class5, class6];
    classes.forEach(cls => {
      // Assign 15 students to each class
      studentNames.forEach(name => {
        const student = createStudent({
          firstName: name.firstName,
          lastName: name.lastName,
          email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@niet.ac.in`,
          classId: cls.id
        });

        // Create random attendance records for today
        const today = new Date().toISOString().split('T')[0];
        const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        markAttendance(student.id, cls.id, today, randomStatus);
      });
    });
  }
};
