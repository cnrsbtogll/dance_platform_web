// src/types/index.ts

export type DanceStyle = 'salsa' | 'bachata' | 'kizomba' | 'zouk' | 'tango' | 'other';

export type DanceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export type UserRole = 'student' | 'instructor' | 'school' | 'school_admin' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  level?: DanceLevel;
  phoneNumber?: string;
  danceStyles?: DanceStyle[];
  gender?: string;
  age?: number;
  city?: string;
  height?: number;
  weight?: number;
  availableTimes?: string[];
  isPartnerSearchActive?: boolean;
  role: UserRole;  // Artık zorunlu ve tekil
  createdAt?: Date;
  updatedAt?: Date;
  schoolId?: string;  // Kullanıcının bağlı olduğu okul ID'si
  instructorId?: string; // Öğrencinin bağlı olduğu eğitmen ID'si
}

export interface UserWithProfile extends User {
  bio?: string;
}

export interface Instructor {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole;
  specialties: string[];
  experience: number;
  bio: string;
  level: DanceLevel;
  schoolId?: string;
  schoolName?: string;
  availability?: {
    days: string[];
    hours: string[];
  };
  rating?: number;
  reviewCount?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  danceStyle: DanceStyle;
  level: DanceLevel;
  criteria: string;
  requiredClasses?: number;
  requiredEvents?: number;
  iconUrl?: string;
}

export interface PartnerPreference {
  userId: string;
  danceStyles: DanceStyle[];
  level: DanceLevel;
  location: {
    latitude: number;
    longitude: number;
  };
  availability: Record<string, { start: string; end: string }[]>;
  ageRange: {
    min: number;
    max: number;
  };
  gender: 'male' | 'female' | 'any';
}

export interface PartnerMatch {
  id: string;
  user1Id: string;
  user2Id: string;
  matchScore: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface DanceClass {
  id: string;
  name: string;
  danceStyle: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  price: number;
  currency: 'TRY' | 'USD' | 'EUR';
  imageUrl?: string;
  instructorName: string;
  instructorId: string;
  schoolName?: string;
  schoolId?: string;
  description?: string;
  currentParticipants: number;
  maxParticipants: number;
  recurring: boolean;
  daysOfWeek?: string[];
  date?: Date;
  time?: string;
  duration: number;
  status: 'active' | 'inactive' | 'cancelled';
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
  highlights?: string[];
  tags?: string[];
  phoneNumber?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DanceSchool {
  id: string;
  displayName: string;
  name?: string;
  description: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  website?: string;
  photoURL?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  danceStyles?: string[];
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
  courseCount?: number;
  rating?: number;
}

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  danceStyle: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  capacity: number;
  price: number;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  location: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface FirebaseUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole; // Artık sadece tekil string
  level?: DanceLevel;
  instructorId?: string | null;
  instructorName?: string | null;
  schoolId?: string | null;
  schoolName?: string | null;
  danceStyles?: DanceStyle[];
  createdAt: any;
  updatedAt: any;
  isPartnerSearchActive?: boolean;
  // Additional fields for instructor
  specialties?: string[];
  experience?: number;
  bio?: string;
  availability?: {
    days: string[];
    hours: string[];
  };
  // Additional fields for school
  address?: string;
  city?: string;
  district?: string;
  description?: string;
  facilities?: string[];
  contactPerson?: string;
  website?: string;
}

// Update the invitation data type
export interface InvitationData {
  displayName: string;
  role: UserRole; // Artık tekil string
  level?: DanceLevel;
  schoolId?: string;
  schoolName?: string;
  instructorId?: string;
  instructorName?: string;
}

export interface BaseFormData {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL: string;
  role: UserRole;
}

export interface StudentFormData extends BaseFormData {
  level: DanceLevel;
  instructorId: string;
  schoolId: string;
  danceStyles: DanceStyle[];
}

export interface InstructorFormData extends BaseFormData {
  level: DanceLevel;
  specialties: string[];
  experience: number;
  bio: string;
  schoolId: string;
  availability: {
    days: string[];
    hours: string[];
  };
}

export interface SchoolFormData extends BaseFormData {
  address: string;
  city: string;
  district: string;
  description: string;
  facilities: string[];
  contactPerson: string;
  website: string;
  level?: never; // Schools don't have a level
  instructorId?: never; // Schools don't have an instructor
  schoolId?: never; // Schools don't have a school
}

export type FormDataType = StudentFormData | InstructorFormData | SchoolFormData;

// Type guard functions
export const isStudentForm = (data: FormDataType): data is StudentFormData => {
  return data.role === 'student';
};

export const isInstructorForm = (data: FormDataType): data is InstructorFormData => {
  return data.role === 'instructor';
};

export const isSchoolForm = (data: FormDataType): data is SchoolFormData => {
  return data.role === 'school';
};

// Helper type for form data updates
export type FormDataUpdate<T extends FormDataType> = Partial<T> & { role?: never };

export interface School {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  description?: string;
  iban?: string;
  recipientName?: string;
  [key: string]: any;
}