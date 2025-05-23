import { Class, Student, Attendance, AttendanceStatus } from '@/types';
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

// Class methods
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
    
    // Also delete all students in this class
    const students = getFromStorage<Student[]>('students', []);
    const remainingStudents = students.filter(s => s.classId !== classId);
    saveToStorage('students', remainingStudents);
    
    // And delete all attendance records for this class
    const attendance = getFromStorage<Attendance[]>('attendance', []);
    const remainingAttendance = attendance.filter(a => a.classId !== classId);
    saveToStorage('attendance', remainingAttendance);
    
    return true;
  }
  
  return false;
};

// Student methods
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
    
    // Also delete all attendance records for this student
    const attendance = getFromStorage<Attendance[]>('attendance', []);
    const remainingAttendance = attendance.filter(a => a.studentId !== studentId);
    saveToStorage('attendance', remainingAttendance);
    
    return true;
  }
  
  return false;
};

// Attendance methods
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

// Statistics and reporting
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

export const exportAttendanceCsv = (classId: string): string => {
  const students = getStudents(classId);
  const attendance = getFromStorage<Attendance[]>('attendance', [])
    .filter(a => a.classId === classId);
  
  if (students.length === 0 || attendance.length === 0) {
    return '';
  }
  
  // Group attendance by date
  const attendanceByDate = attendance.reduce((acc, curr) => {
    if (!acc[curr.date]) {
      acc[curr.date] = {};
    }
    acc[curr.date][curr.studentId] = curr.status;
    return acc;
  }, {} as Record<string, Record<string, AttendanceStatus>>);
  
  // Get all dates with attendance records
  const dates = Object.keys(attendanceByDate).sort();
  
  // Create CSV header
  let csv = 'Student ID,First Name,Last Name,Email,' + dates.join(',') + '\n';
  
  // Add data for each student
  students.forEach(student => {
    let row = `${student.id},${student.firstName},${student.lastName},${student.email},`;
    
    // Add attendance status for each date
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

// Initialize with mock data for demonstration
export const initializeMockData = (userId: string) => {
  // Only initialize if no data exists
  if (getFromStorage<Class[]>('classes', []).length === 0) {
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
    
    // Get all students
    const allMathStudents = getStudents(class1.id);
    const allPhysicsStudents = getStudents(class2.id);
    const allCsStudents = getStudents(class3.id);
    
    // Mark attendance for math class
    allMathStudents.forEach((student, index) => {
      let status: AttendanceStatus;
      if (index < 5) status = 'present';
      else if (index === 5) status = 'late';
      else status = 'absent';
      
      markAttendance(student.id, class1.id, today, status);
    });
    
    // Mark attendance for physics class
    allPhysicsStudents.forEach((student, index) => {
      let status: AttendanceStatus;
      if (index < 4) status = 'present';
      else if (index === 4) status = 'excused';
      else if (index === 5) status = 'late';
      else status = 'present';
      
      markAttendance(student.id, class2.id, today, status);
    });

    // Mark attendance for CS class
    allCsStudents.forEach((student, index) => {
      let status: AttendanceStatus;
      if (index < 6) status = 'present';
      else if (index === 6) status = 'late';
      else status = 'excused';
      
      markAttendance(student.id, class3.id, today, status);
    });
  }
};
