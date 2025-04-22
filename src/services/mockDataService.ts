
import { AttendanceStatus } from '@/types';
import { markAttendance } from './attendanceService';
import { createClass } from './classService';
import { createStudent } from './studentService';
import { supabase } from '@/integrations/supabase/client';

export const initializeMockData = async (userId: string) => {
  // Check if data already exists
  const { data: existingClasses } = await supabase
    .from('classes')
    .select('id')
    .eq('user_id', userId);
  
  if (existingClasses && existingClasses.length > 0) {
    return; // Data already exists
  }

  // Create mock classes
  const class1 = await createClass({
    name: 'Mathematics 101',
    description: 'Introduction to Calculus - NIET Engineering Department',
    schedule: 'MWF 9:00 AM - 10:30 AM',
    userId
  });

  const class2 = await createClass({
    name: 'Physics 201',
    description: 'Classical Mechanics - NIET Science Department',
    schedule: 'TTh 1:00 PM - 2:30 PM',
    userId
  });

  const class3 = await createClass({
    name: 'Computer Science 301',
    description: 'Data Structures and Algorithms - NIET Computer Science Department',
    schedule: 'MWF 2:00 PM - 3:30 PM',
    userId
  });

  // List of student names
  const studentNames = [
    { firstName: 'Aarav', lastName: 'Sharma' },
    { firstName: 'Priya', lastName: 'Nair' },
    { firstName: 'Rohan', lastName: 'Mehta' },
    { firstName: 'Ananya', lastName: 'Verma' },
    { firstName: 'Kunal', lastName: 'Iyer' }
  ];

  // Create students for each class
  const classes = [class1, class2, class3];
  for (const cls of classes) {
    for (const name of studentNames) {
      const student = await createStudent({
        firstName: name.firstName,
        lastName: name.lastName,
        email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@niet.ac.in`,
        classId: cls.id
      });

      // Create random attendance records for today
      const today = new Date().toISOString().split('T')[0];
      const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      await markAttendance(student.id, cls.id, today, randomStatus);
    }
  }
};
