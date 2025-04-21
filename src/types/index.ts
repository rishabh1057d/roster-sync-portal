
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Class = {
  id: string;
  name: string;
  description: string;
  schedule: string;
  userId: string;
  createdAt: string;
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classId: string;
};

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type Attendance = {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
