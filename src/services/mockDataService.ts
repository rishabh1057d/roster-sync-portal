
import { AttendanceStatus } from '@/types';
import { markAttendance } from './attendanceService';
import { createClass } from './classService';
import { createStudent } from './studentService';
import { supabase } from '@/integrations/supabase/client';

export const initializeMockData = async (userId: string) => {
  try {
    console.log("Initializing mock data for user:", userId);
    
    // Check if data already exists
    const { data: existingClasses, error } = await supabase
      .from('classes')
      .select('id')
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error checking for existing classes:", error);
      throw error;
    }
    
    if (existingClasses && existingClasses.length > 0) {
      console.log("Mock data already exists. Skipping initialization.");
      return; // Data already exists
    }

    console.log("No existing classes found. Creating mock data...");

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

    console.log("Created mock classes successfully");

    // Updated list of student names from the image
    const studentNames = [
      { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@niet.ac.in' },
      { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@niet.ac.in' },
      { firstName: 'Rahul', lastName: 'Kumar', email: 'rahul.kumar@niet.ac.in' },
      { firstName: 'Ananya', lastName: 'Verma', email: 'ananya.verma@niet.ac.in' },
      { firstName: 'Kunal', lastName: 'Mehra', email: 'kunal.mehra@niet.ac.in' },
      { firstName: 'Ishita', lastName: 'Singh', email: 'ishita.singh@niet.ac.in' },
      { firstName: 'Arjun', lastName: 'Reddy', email: 'arjun.reddy@niet.ac.in' },
      { firstName: 'Neha', lastName: 'Gupta', email: 'neha.gupta@niet.ac.in' },
      { firstName: 'Rohan', lastName: 'Joshi', email: 'rohan.joshi@niet.ac.in' }
    ];

    // Create students for each class
    const classes = [class1, class2, class3];
    for (const cls of classes) {
      console.log(`Creating students for class: ${cls.name}`);
      
      for (const student of studentNames) {
        try {
          const createdStudent = await createStudent({
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            classId: cls.id
          });

          console.log(`Created student: ${createdStudent.firstName} ${createdStudent.lastName}`);

          // Create random attendance records for today
          const today = new Date().toISOString().split('T')[0];
          const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          await markAttendance(createdStudent.id, cls.id, today, randomStatus);
          console.log(`Marked attendance for ${createdStudent.firstName} as ${randomStatus}`);
        } catch (error) {
          console.error("Error creating student or attendance:", error);
        }
      }
    }
    
    console.log("Mock data initialization completed successfully");
  } catch (error) {
    console.error("Error initializing mock data:", error);
    throw error;
  }
};
