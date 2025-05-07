
import { v4 as uuidv4 } from 'uuid';
import { Class } from '@/types';
import { replaceAllStudentsWithStandardList } from './studentSyncService';

// Initialize mock data for development
export const initializeMockData = async (userId: string) => {
  try {
    console.log(`Initializing mock data for user: ${userId}`);
    
    // Check if we already have mock data
    const hasExistingClasses = localStorage.getItem('local_classes') !== null;
    if (hasExistingClasses) {
      console.log('Mock data already initialized');
      return;
    }
    
    // Create mock classes
    const mockClasses: Class[] = [
      {
        id: uuidv4(),
        name: 'Mathematics',
        description: 'Advanced Calculus and Linear Algebra',
        schedule: 'Monday, Wednesday, Friday - 9:00 AM to 10:30 AM',
        userId: userId,
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Physics',
        description: 'Classical Mechanics and Thermodynamics',
        schedule: 'Tuesday, Thursday - 1:00 PM to 3:00 PM',
        userId: userId, 
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Computer Science',
        description: 'Algorithms and Data Structures',
        schedule: 'Monday, Friday - 3:30 PM to 5:00 PM',
        userId: userId,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Save mock classes
    localStorage.setItem('local_classes', JSON.stringify(mockClasses));
    
    // Add standard students to each class
    for (const cls of mockClasses) {
      await replaceAllStudentsWithStandardList(cls.id);
    }
    
    console.log('Mock data initialized successfully');
    
    return mockClasses;
    
  } catch (error) {
    console.error('Error initializing mock data:', error);
    throw error;
  }
};
