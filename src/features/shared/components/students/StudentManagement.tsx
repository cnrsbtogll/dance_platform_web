import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  Timestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  deleteUser,
  getAuth,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from '../../../../api/firebase/firebase';
import { motion } from 'framer-motion';
import { User, UserRole, DanceLevel, DanceStyle } from '../../../../types';
import { useAuth } from '../../../../contexts/AuthContext';
import { resizeImageFromBase64 } from '../../../../api/services/userService';
import { generateInitialsAvatar } from '../../../../common/utils/imageUtils';
import ImageUploader from '../../../../common/components/ui/ImageUploader';
import CustomInput from '../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../common/components/ui/CustomPhoneInput';
import { Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, TextField } from '@mui/material';
import { SchoolProfile } from '../../../school/components/SchoolProfile/SchoolProfile';

// Default placeholder image for students
const DEFAULT_STUDENT_IMAGE = '/assets/placeholders/default-student.png';

// Student interface with instructor and school
interface Student {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  level: DanceLevel;
  photoURL: string;
  instructorId?: string;
  instructorName?: string;
  schoolId?: string;
  schoolName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Form data interface
interface FormData {
  displayName: string;
  email: string;
  phone: string;
  password?: string; // New field
  level: DanceLevel;
  photoURL: string;
  instructorId: string;
  schoolId: string;
  courseIds: string[];
}

// Define Firebase user type
interface FirebaseUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber: string;
  role: UserRole | UserRole[];
  level: DanceLevel;
  instructorId?: string | null;
  instructorName?: string | null;
  schoolId?: string | null;
  schoolName?: string | null;
  danceStyles?: DanceStyle[];
  courseIds?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Instructor type
interface Instructor {
  id: string;
  displayName: string;
  email: string;
}

// School type
interface School {
  id: string;
  displayName: string;
  email: string;
}

// Photo Modal Component
interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoURL: string;
  studentName: string;
  defaultImagePath: string;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ isOpen, onClose, photoURL, studentName, defaultImagePath }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">{studentName} - Fotoğraf</h3>
          <button
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 flex justify-center">
          <img
            src={photoURL}
            alt={`${studentName} fotoğrafı`}
            className="max-h-[70vh] max-w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImagePath;
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Student Photo Uploader Component
interface StudentPhotoUploaderProps {
  currentPhotoURL?: string;
  onImageChange: (base64Image: string | null) => void;
}

const StudentPhotoUploader: React.FC<StudentPhotoUploaderProps> = ({
  currentPhotoURL,
  onImageChange
}) => {
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 5; // Maximum file size in MB

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      // Check file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Dosya boyutu çok büyük. Lütfen ${MAX_FILE_SIZE_MB}MB'dan küçük bir görsel seçin.`);
        setIsUploading(false);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Lütfen geçerli bir görsel dosyası seçin (JPEG, PNG, GIF, vs.)');
        setIsUploading(false);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreviewURL(result);
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Fotoğraf yüklenirken bir hata oluştu.');
      console.error('Fotoğraf yükleme hatası:', err);
      setIsUploading(false);
    }
  };

  const confirmUpload = () => {
    if (previewURL) {
      onImageChange(previewURL);
    }
  };

  const cancelUpload = () => {
    setPreviewURL(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveCurrentPhoto = () => {
    onImageChange(DEFAULT_STUDENT_IMAGE);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Öğrenci Fotoğrafı
      </label>

      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
      />

      <div className="relative mb-3">
        {/* Image preview area */}
        <div
          className="relative w-32 h-32 rounded-full overflow-hidden shadow-md cursor-pointer border-2 border-brand-pink hover:border-brand-pink transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Current or preview image */}
          <img
            src={previewURL || currentPhotoURL || DEFAULT_STUDENT_IMAGE}
            alt="Öğrenci fotoğrafı"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_STUDENT_IMAGE;
            }}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Delete button */}
        {currentPhotoURL && currentPhotoURL !== DEFAULT_STUDENT_IMAGE && !previewURL && (
          <button
            type="button"
            onClick={handleRemoveCurrentPhoto}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Preview controls */}
      {previewURL && (
        <div className="flex flex-col items-center gap-2 mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Seçilen fotoğrafı kaydetmek için onaylayın veya iptal edin.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmUpload}
              className="px-3 py-1 bg-brand-pink text-white text-sm rounded hover:bg-rose-700 transition-colors"
              disabled={isUploading}
            >
              Onayla
            </button>

            <button
              type="button"
              onClick={cancelUpload}
              className="px-3 py-1 bg-gray-200 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 transition-colors"
              disabled={isUploading}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 mt-1">
          {error}
        </p>
      )}

      {/* Loading indicator */}
      {isUploading && (
        <div className="flex justify-center mt-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-pink"></div>
        </div>
      )}

      {/* Help text */}
      {!previewURL && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Fotoğraf yüklemek için yukarıdaki alana tıklayın.
        </p>
      )}
    </div>
  );
};

interface StudentManagementProps {
  isAdmin?: boolean;
  colorVariant?: 'instructor' | 'school';
}

// Add Course interface
interface Course {
  id: string;
  name: string;
  schoolId: string;
  instructorId: string;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ isAdmin = false, colorVariant = 'instructor' }) => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<FirebaseUser[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<FirebaseUser[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<FirebaseUser | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  // Photo modal state
  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string, name: string } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    email: '',
    phone: '',
    password: '', // Initialize password
    level: 'beginner',
    photoURL: '',
    instructorId: '',
    schoolId: '',
    courseIds: []
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  // Check if current user is super admin
  useEffect(() => {
    const checkIfSuperAdmin = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          let roles = userData.role || [];

          if (!Array.isArray(roles)) {
            roles = [roles];
          }

          setIsSuperAdmin(roles.includes('admin'));
        }
      } catch (err) {
        console.error('Süper admin kontrolü yapılırken hata oluştu:', err);
      }
    };

    checkIfSuperAdmin();
  }, []);

  // Fetch all users (students, instructors, schools) from Firestore
  const fetchAllUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get students
      const usersRef = collection(db, 'users');

      // Initialize with a default query that returns no results
      let studentsQuery = query(
        usersRef,
        where('role', '==', 'non-existent-role')
      );

      // Get current user's role
      const userRef = doc(db, 'users', currentUser?.uid || '');
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const userRole = userData?.role || '';

      if (isAdmin) {
        console.log('Admin mode: fetching all students');
        studentsQuery = query(
          usersRef,
          where('role', '==', 'student'),
          orderBy('createdAt', 'desc')
        );
      } else if (userRole === 'school') {
        console.log('School mode: fetching students for school', currentUser?.uid);
        studentsQuery = query(
          usersRef,
          where('schoolId', '==', currentUser?.uid),
          where('role', '==', 'student')
        );
      } else if (userRole === 'instructor') {
        console.log('Instructor mode: fetching students for instructor', currentUser?.uid);
        studentsQuery = query(
          usersRef,
          where('instructorId', '==', currentUser?.uid),
          where('role', '==', 'student')
        );
      }

      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData: FirebaseUser[] = studentsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as FirebaseUser))
        .filter(student => student.role === 'student');

      console.log('Students data:', studentsData);
      setStudents(studentsData);
      setFilteredStudents(studentsData);

      // Fetch instructors separately
      await fetchInstructors();

      // Get schools if admin
      if (isAdmin) {
        const schoolsQuery = query(
          usersRef,
          where('role', '==', 'school'),
          orderBy('displayName', 'asc')
        );
        const schoolsSnapshot = await getDocs(schoolsQuery);
        const schoolsData: School[] = schoolsSnapshot.docs.map(doc => ({
          id: doc.id,
          displayName: doc.data().displayName || 'İsimsiz Okul',
          email: doc.data().email || ''
        }));

        setSchools(schoolsData);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError(`Error loading users: ${err instanceof Error ? err.message : 'Unknown error'}. Please refresh the page.`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students, instructors and schools on initial load
  useEffect(() => {
    if (currentUser?.uid) {
      console.log('Fetching users with currentUser:', currentUser.uid);
      fetchAllUsers();
    }
  }, [currentUser]);

  // Update filtered students when search term changes
  useEffect(() => {
    filterStudents();
  }, [searchTerm, students]);

  // Filter students based on search term
  const filterStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.displayName.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term)
      );
    }

    setFilteredStudents(filtered);
  };

  // Edit student
  const editStudent = (student: FirebaseUser): void => {
    setSelectedStudent(student);
    setFormData({
      displayName: student.displayName,
      email: student.email,
      phone: student.phoneNumber || '',
      password: '', // Reset password when editing
      level: student.level || 'beginner',
      photoURL: student.photoURL || '',
      instructorId: student.instructorId || '',
      schoolId: student.schoolId || '',
      courseIds: student.courseIds || []
    });
    setEditMode(true);
  };

  // Add new student
  const addNewStudent = (): void => {
    setSelectedStudent(null);
    setFormData({
      displayName: '',
      email: '',
      phone: '',
      password: '', // Initialize password
      level: 'beginner',
      photoURL: generateInitialsAvatar('?', 'student'),
      instructorId: isAdmin ? '' : currentUser?.uid || '',
      schoolId: '',
      courseIds: []
    });
    setEditMode(true);
  };

  // Update handleInputChange function
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } } | string,
    fieldName?: string
  ): void => {
    if (typeof e === 'string' && fieldName) {
      // Handle direct value changes (from CustomSelect)
      setFormData(prev => ({
        ...prev,
        [fieldName]: e
      }));
    } else if (typeof e === 'object' && 'target' in e) {
      // Handle event-based changes
      const target = e.target as { name: string; value: any; type?: string; checked?: boolean };
      setFormData(prev => ({
        ...prev,
        [target.name]: target.type === 'checkbox' ? !!target.checked : target.value
      }));
    }
  };

  // Open Photo Modal
  const openPhotoModal = (photoURL: string, studentName: string) => {
    setSelectedPhoto({
      url: photoURL || DEFAULT_STUDENT_IMAGE,
      name: studentName
    });
    setPhotoModalOpen(true);
  };

  // Handle photo change
  const handlePhotoChange = async (base64Image: string | null): Promise<void> => {
    try {
      if (base64Image === null) {
        // If photo is removed, set to default
        setFormData(prev => ({
          ...prev,
          photoURL: DEFAULT_STUDENT_IMAGE
        }));
        return;
      }

      // Resize image to reduce size
      const resizedImage = await resizeImageFromBase64(base64Image, 400, 400, 0.75);

      // Update form state
      setFormData(prev => ({
        ...prev,
        photoURL: resizedImage
      }));
    } catch (err) {
      console.error('Fotoğraf işlenirken hata oluştu:', err);
      setError('Fotoğraf işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Davetiye e-postası gönderme fonksiyonu
  const sendInvitationEmail = async (email: string, invitationData: {
    displayName: string;
    level?: DanceLevel;
    phoneNumber?: string;
    password?: string; // Add password here
    instructorId?: string;
    instructorName?: string;
    schoolId?: string;
    schoolName?: string;
    photoURL?: string;
    courseIds: string[];
  }) => {
    try {
      // Benzersiz bir davet kodu oluştur
      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Remove undefined values from invitationData
      const cleanedInvitationData = Object.fromEntries(
        Object.entries({
          email,
          ...invitationData,
          status: 'pending',
          type: 'student',
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 gün geçerli
        }).filter(([_, value]) => value !== undefined)
      );

      // Davet bilgilerini Firestore'a kaydet
      await setDoc(doc(db, 'pendingUsers', invitationId), cleanedInvitationData);

      // Kullanıcıyı users koleksiyonuna ekle
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Timestamp.now();

      const userData = {
        id: userId,
        email,
        displayName: invitationData.displayName,
        role: 'student',
        level: invitationData.level || 'beginner',
        photoURL: invitationData.photoURL || DEFAULT_STUDENT_IMAGE,
        phoneNumber: invitationData.phoneNumber || '',
        instructorId: invitationData.instructorId || null,
        instructorName: invitationData.instructorName || null,
        schoolId: invitationData.schoolId || null,
        schoolName: invitationData.schoolName || null,
        courseIds: invitationData.courseIds || [],
        createdAt: now,
        updatedAt: now,
        status: 'pending'
      };

      await setDoc(doc(db, 'users', userId), {
        ...userData,
        password: invitationData.password || null, // Temporarily store password for easier rollout
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Öğrenci listesini güncelle
      setStudents(prevStudents => [
        userData as FirebaseUser,
        ...prevStudents
      ]);

      return true;
    } catch (error) {
      console.error('Davet gönderilirken hata oluştu:', error);
      throw error;
    }
  };

  // Add useEffect to fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.uid) return;

      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const role = userData?.role || '';
      console.log('Current user role:', role);
      setUserRole(role);
    };

    fetchUserRole();
  }, [currentUser]);

  // Add function to fetch courses
  const fetchCourses = async () => {
    if (!currentUser?.uid) return;

    try {
      const coursesRef = collection(db, 'courses');

      // First, get all courses to check the data
      const allCoursesSnapshot = await getDocs(coursesRef);
      console.log('All courses in collection:', allCoursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

      // Get current user's role
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const userRole = userData?.role || '';
      console.log('Current user role:', userRole);

      // Query oluştur
      let q = query(coursesRef, orderBy('createdAt', 'desc')); // Default query for admin

      if (!isAdmin) {
        if (userRole === 'school') {
          console.log('School: Okula ait kurslar getiriliyor -', currentUser.uid);
          q = query(
            coursesRef,
            where('schoolId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
        } else if (userRole === 'instructor') {
          console.log('Instructor: Eğitmene ait kurslar getiriliyor -', currentUser.uid);
          q = query(
            coursesRef,
            where('instructorId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
        }
      } else {
        console.log('Admin: Tüm kurslar getiriliyor');
      }

      console.log('Ana query oluşturuldu:', q);

      console.log('Veriler çekiliyor...');
      const snapshot = await getDocs(q);
      console.log('Course query snapshot:', {
        empty: snapshot.empty,
        size: snapshot.size,
        docs: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      });

      const coursesData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Raw course data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          name: data.name || 'İsimsiz Kurs',
          schoolId: data.schoolId || '',
          instructorId: data.instructorId
        } as Course;
      });

      console.log('Processed courses:', coursesData);
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  // Call fetchCourses when userRole changes
  useEffect(() => {
    if (userRole.length > 0) {
      fetchCourses();
    }
  }, [userRole]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Form submission - Current user role:', userRole);
      console.log('Form data:', formData);
      console.log('Selected courses:', courses.filter(c => formData.courseIds.includes(c.id)));

      if (selectedStudent) {
        // Update existing student
        const userRef = doc(db, 'users', selectedStudent.id);

        // Get instructor name if an instructor is selected
        let instructorName = '';
        if (formData.instructorId) {
          const selectedInstructor = instructors.find(i => i.id === formData.instructorId);
          instructorName = selectedInstructor?.displayName || '';
        }

        // Use current user's ID as schoolId for school users
        const schoolId = userRole.includes('school') ? currentUser?.uid : formData.schoolId;
        console.log('Using schoolId:', schoolId);

        // Get school name
        let schoolName = '';
        if (schoolId) {
          const selectedSchool = schools.find(s => s.id === schoolId);
          schoolName = selectedSchool?.displayName || '';
        }

        const updateData = {
          displayName: formData.displayName,
          phone: formData.phone,
          level: formData.level,
          instructorId: formData.instructorId || null,
          instructorName: instructorName || null,
          schoolId: schoolId || null,
          schoolName: schoolName || null,
          photoURL: formData.photoURL || DEFAULT_STUDENT_IMAGE,
          courseIds: formData.courseIds || [],
          updatedAt: serverTimestamp()
        };

        console.log('Updating student with data:', updateData);
        await updateDoc(userRef, updateData);
        console.log('Öğrenci güncellendi:', selectedStudent.id);

        // Update the students array
        const updatedStudents = students.map(student =>
          student.id === selectedStudent.id
            ? {
              ...student,
              displayName: formData.displayName,
              phone: formData.phone,
              level: formData.level,
              instructorId: formData.instructorId || null,
              instructorName: instructorName || null,
              schoolId: formData.schoolId || null,
              schoolName: schoolName || null,
              photoURL: formData.photoURL || DEFAULT_STUDENT_IMAGE,
              courseIds: formData.courseIds || [],
              updatedAt: serverTimestamp() as Timestamp
            }
            : student
        );

        setStudents(updatedStudents);
        setSuccess('Öğrenci bilgileri başarıyla güncellendi.');
      } else {
        // Create new student
        if (!formData.email || !formData.displayName) {
          throw new Error('E-posta ve ad soyad alanları zorunludur.');
        }

        // Check if email already exists
        const emailQuery = query(
          collection(db, 'users'),
          where('email', '==', formData.email)
        );
        const emailCheckSnapshot = await getDocs(emailQuery);

        if (!emailCheckSnapshot.empty) {
          throw new Error('Bu e-posta adresi zaten kullanılıyor.');
        }

        // Get instructor name if an instructor is selected
        let instructorName = '';
        if (formData.instructorId) {
          const selectedInstructor = instructors.find(i => i.id === formData.instructorId);
          instructorName = selectedInstructor?.displayName || '';
        }

        // Get school name if a school is selected
        let schoolName = '';
        if (formData.schoolId) {
          const selectedSchool = schools.find(s => s.id === formData.schoolId);
          schoolName = selectedSchool?.displayName || '';
        }

        // Davet gönder
        await sendInvitationEmail(formData.email, {
          displayName: formData.displayName,
          level: formData.level,
          phoneNumber: formData.phone,
          instructorId: formData.instructorId,
          instructorName: instructorName,
          schoolId: userRole.includes('school') ? currentUser?.uid : formData.schoolId,
          schoolName: schoolName,
          photoURL: formData.photoURL,
          courseIds: formData.courseIds,
          password: formData.password // Pass the password from form
        });

        setSuccess('Öğrenci başarıyla eklendi ve davet e-postası gönderildi.');
      }

      // Close the form
      setEditMode(false);
      setSelectedStudent(null);

    } catch (err: any) {
      console.error('Error in form submission:', err);
      setError('İşlem sırasında bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const deleteStudentHandler = async (studentId: string): Promise<void> => {
    if (!window.confirm('Bu öğrenciyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', studentId));

      // Remove from state
      const updatedStudents = students.filter(student => student.id !== studentId);
      setStudents(updatedStudents);
      setSuccess('Öğrenci başarıyla silindi.');

      // Note: Deleting the auth user would require admin SDK or reauthentication,
      // so we're only deleting the Firestore document here.
    } catch (err) {
      console.error('Öğrenci silinirken hata oluştu:', err);
      setError('Öğrenci silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Render student row
  const renderStudent = (student: FirebaseUser) => {
    return (
      <motion.tr
        key={student.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`hover:bg-gray-50 ${colorVariant === 'school' ? 'dark:hover:bg-[#493322]/30' : 'dark:hover:bg-slate-800'}`}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 relative bg-green-100 rounded-full overflow-hidden">
              {student.photoURL ? (
                <img
                  className="h-10 w-10 rounded-full object-cover absolute inset-0"
                  src={student.photoURL}
                  alt={student.displayName}
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = generateInitialsAvatar(student.displayName, 'student');
                  }}
                />
              ) : (
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={generateInitialsAvatar(student.displayName, 'student')}
                  alt={student.displayName}
                />
              )}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{student.displayName}</div>
              {student.phoneNumber && (
                <div className="text-sm text-gray-500 dark:text-gray-400">{student.phoneNumber}</div>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-white max-w-[200px] truncate" title={student.email}>
            {student.email}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-white">
            {student.level === 'beginner' && 'Başlangıç'}
            {student.level === 'intermediate' && 'Orta'}
            {student.level === 'advanced' && 'İleri'}
            {student.level === 'professional' && 'Profesyonel'}
            {!student.level && '-'}
          </div>
        </td>
        {userRole !== 'instructor' && (
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900 dark:text-white">
              {student.instructorName || '-'}
            </div>
          </td>
        )}
        {userRole !== 'school' && (
          <td className="px-6 py-4 whitespace-nowrap">
            <SchoolProfile
              school={{
                id: student.schoolId || '',
                displayName: student.schoolName || '',
                email: ''
              }}
            />
          </td>
        )}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-white">
            {student.courseIds && student.courseIds.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {student.courseIds.map(courseId => {
                  const course = courses.find(c => c.id === courseId);
                  return course ? (
                    <span key={courseId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-indigo-800">
                      {course.name}
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">-</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[140px]">
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => editStudent(student)}
              className={colorVariant === 'school' ? 'text-school hover:text-school-dark dark:text-school-light dark:hover:text-school-lighter' : 'text-instructor hover:text-instructor-dark dark:text-instructor-light dark:hover:text-instructor-lighter'}
            >
              Düzenle
            </button>
            <button
              onClick={() => deleteStudentHandler(student.id)}
              className="text-red-600 hover:text-red-900"
            >
              Sil
            </button>
          </div>
        </td>
      </motion.tr>
    );
  };

  const handleSelectChange = (value: string, fieldName: string): void => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Get instructors
  const fetchInstructors = async () => {
    try {
      console.log('Fetching instructors...');
      const instructorsRef = collection(db, 'instructors');

      // Get current user's role
      const userRef = doc(db, 'users', currentUser?.uid || '');
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const currentUserRole = userData?.role || '';
      console.log('Current user role:', currentUserRole);

      // Default query for no results
      let q = query(
        instructorsRef,
        where('status', '==', 'inactive') // This ensures no results by default
      );

      if (isAdmin) {
        console.log('Admin: fetching all active instructors');
        q = query(
          instructorsRef,
          where('status', '==', 'active'),
          orderBy('displayName', 'asc')
        );
      } else if (currentUserRole === 'school') {
        console.log('School: fetching instructors for school', currentUser?.uid);
        q = query(
          instructorsRef,
          where('schoolId', '==', currentUser?.uid),
          where('status', '==', 'active'),
          orderBy('displayName', 'asc')
        );
      } else {
        console.log('No permission to fetch instructors');
        setInstructors([]);
        return;
      }

      const querySnapshot = await getDocs(q);
      console.log('Query results:', {
        empty: querySnapshot.empty,
        size: querySnapshot.size,
        docs: querySnapshot.docs.map(doc => ({
          id: doc.id,
          displayName: doc.data().displayName,
          email: doc.data().email
        }))
      });

      const instructorsData = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || data.email || 'İsimsiz Eğitmen',
            email: data.email || ''
          };
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      console.log('Processed instructors:', instructorsData);
      setInstructors(instructorsData);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setInstructors([]);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${colorVariant === 'school' ? 'border-school' : 'border-instructor'}`}></div>
        <span className="ml-3 text-gray-700 dark:text-gray-300">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}

      {/* Üst Başlık ve Arama Bölümü */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Öğrenci Yönetimi</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Öğrencilerinizi ekleyin, düzenleyin ve yönetin</p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-64">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Ad veya e-posta ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent ${colorVariant === 'school' ? 'border-gray-300 dark:border-[#493322] bg-white dark:bg-[#1a120b] placeholder-gray-400 dark:placeholder-[#cba990]/50 focus:ring-school dark:focus:ring-school-light' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-instructor dark:focus:ring-instructor-light'}`}
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          {!editMode && (
            <button
              onClick={addNewStudent}
              className={`w-full px-4 py-2 text-white rounded-md transition-colors flex items-center justify-center gap-2 ${colorVariant === 'school' ? 'bg-school hover:bg-school-dark dark:bg-school-light dark:text-school-dark dark:hover:bg-school-lighter' : 'bg-instructor hover:bg-instructor-dark dark:bg-instructor-light dark:text-instructor-dark dark:hover:bg-instructor-lighter'}`}
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {loading ? 'Yükleniyor...' : 'Yeni Öğrenci'}
            </button>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          isOpen={photoModalOpen}
          onClose={() => setPhotoModalOpen(false)}
          photoURL={selectedPhoto.url}
          studentName={selectedPhoto.name}
          defaultImagePath={DEFAULT_STUDENT_IMAGE}
        />
      )}

      {editMode ? (
        <div className={`p-4 sm:p-6 rounded-lg border ${colorVariant === 'school' ? 'bg-gray-50 dark:bg-[#231810] border-transparent dark:border-[#493322]' : 'bg-gray-50 dark:bg-slate-900 border-transparent dark:border-slate-800'}`}>
          <h3 className="text-lg font-semibold mb-4">
            {selectedStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Profil Fotoğrafı - Hide for new student in school mode */}
              {(!userRole.includes('school') || !!selectedStudent) && (
                <div className="md:col-span-2">
                  <ImageUploader
                    currentPhotoURL={formData.photoURL}
                    onImageChange={handlePhotoChange}
                    displayName={formData.displayName || '?'}
                    userType="student"
                    shape="circle"
                    width={96}
                    height={96}
                    maxSizeKB={5120}
                  />
                </div>
              )}

              <div>
                <CustomInput
                  name="displayName"
                  label="Ad Soyad"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <div>
                <CustomInput
                  type="email"
                  name="email"
                  label="E-posta"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  error={false}
                  fullWidth
                  helperText={selectedStudent ? "Mevcut öğrencilerin e-posta adresleri değiştirilemez." : ""}
                  disabled={!!selectedStudent}
                />
              </div>

              <div>
                <CustomPhoneInput
                  name="phone"
                  label="Telefon"
                  required
                  countryCode="+90"
                  phoneNumber={formData.phone}
                  onCountryCodeChange={() => { }}
                  onPhoneNumberChange={(value: string) => setFormData(prev => ({ ...prev, phone: value }))}
                  fullWidth
                />
              </div>

              {/* Password field - show only for new student in school mode */}
              {(userRole.includes('school') && !selectedStudent) && (
                <div>
                  <CustomInput
                    label="Şifre"
                    name="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    fullWidth
                    required
                    colorVariant="school"
                  />
                </div>
              )}
              {(!userRole.includes('school') || !!selectedStudent) && (
                <div>
                  <CustomSelect
                    name="level"
                    label="Dans Seviyesi"
                    value={formData.level}
                    onChange={(value: string | string[]) => {
                      if (typeof value === 'string') {
                        handleSelectChange(value, 'level');
                      }
                    }}
                    options={[
                      { value: 'beginner', label: 'Başlangıç' },
                      { value: 'intermediate', label: 'Orta' },
                      { value: 'advanced', label: 'İleri' },
                      { value: 'professional', label: 'Profesyonel' }
                    ]}
                    fullWidth
                    required
                  />
                </div>
              )}

              {isAdmin && (
                <div>
                  <CustomSelect
                    name="instructorId"
                    label="Eğitmen"
                    value={formData.instructorId}
                    onChange={(value: string | string[]) => {
                      if (typeof value === 'string') {
                        handleSelectChange(value, 'instructorId');
                      }
                    }}
                    options={[
                      { value: '', label: 'Eğitmen Seç...' },
                      ...instructors.map(instructor => ({
                        value: instructor.id,
                        label: instructor.displayName
                      }))
                    ]}
                    fullWidth
                    required
                  />
                </div>
              )}

              {/* School selection - Hide for new student in school mode */}
              {isAdmin && (
                <div>
                  <CustomSelect
                    name="schoolId"
                    label="Okul"
                    value={formData.schoolId}
                    onChange={(value: string | string[]) => {
                      if (typeof value === 'string') {
                        console.log('School selection changed to:', value);
                        handleSelectChange(value, 'schoolId');
                      }
                    }}
                    options={schools.map(school => ({
                      value: school.id,
                      label: school.displayName
                    }))}
                    fullWidth
                    required
                  />
                </div>
              )}
              {(!isAdmin && userRole.includes('school') && !!selectedStudent) && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Okul:</span>
                  <SchoolProfile
                    school={{
                      id: currentUser?.uid || '',
                      displayName: schools.find(s => s.id === currentUser?.uid)?.displayName || '',
                      email: schools.find(s => s.id === currentUser?.uid)?.email || ''
                    }}
                    variant="card"
                  />
                </div>
              )}

              {/* Course selection - Show for school admin adding or editing */}
              {(userRole.includes('school') || isAdmin) && (
                <div>
                  <CustomSelect
                    name="courseIds"
                    label="Kurslar"
                    value={formData.courseIds}
                    onChange={(value: string | string[]) => {
                      if (Array.isArray(value)) {
                        console.log('Course selection changed to:', value);
                        setFormData(prev => ({
                          ...prev,
                          courseIds: value
                        }));
                      }
                    }}
                    options={courses.map(course => ({
                      value: course.id,
                      label: course.name
                    }))}
                    fullWidth
                    multiple
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setEditMode(false)}
                disabled={loading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (selectedStudent ? 'Güncelle' : 'Ekle')}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {loading && (
            <div className="flex justify-center my-4">
              <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${colorVariant === 'school' ? 'border-school' : 'border-instructor'}`}></div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className={`min-w-full divide-y ${colorVariant === 'school' ? 'divide-gray-200 dark:divide-[#493322]' : 'divide-gray-200 dark:divide-gray-700'}`}>
              <thead className={colorVariant === 'school' ? 'bg-gray-50 dark:bg-[#231810]' : 'bg-gray-50 dark:bg-slate-900'}>
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
                    Öğrenci
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
                    E-posta
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
                    Dans Seviyesi
                  </th>
                  {userRole !== 'instructor' && (
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
                      Eğitmen
                    </th>
                  )}
                  {userRole !== 'school' && (
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
                      Okul
                    </th>
                  )}
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
                    Kurslar
                  </th>
                  <th scope="col" className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${colorVariant === 'school' ? 'bg-white dark:bg-[#1a120b] divide-gray-200 dark:divide-[#493322]' : 'bg-white dark:bg-slate-800 divide-gray-200 dark:divide-slate-700'}`}>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => renderStudent(student))
                ) : (
                  <tr>
                    <td colSpan={6} className={`px-6 py-4 text-center text-sm ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
                      {searchTerm ? 'Aramanıza uygun öğrenci bulunamadı.' : 'Henüz hiç öğrenci kaydı bulunmuyor.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div key={student.id} className={`rounded-lg shadow-sm border p-4 ${colorVariant === 'school' ? 'bg-white dark:bg-[#231810] border-gray-200 dark:border-[#493322]' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center max-w-[60%]">
                      <div className="flex-shrink-0 h-10 w-10 relative bg-green-100 rounded-full overflow-hidden">
                        <img
                          className="h-10 w-10 rounded-full object-cover absolute inset-0"
                          src={student.photoURL || generateInitialsAvatar(student.displayName, 'student')}
                          alt={student.displayName}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = generateInitialsAvatar(student.displayName, 'student');
                          }}
                        />
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{student.displayName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={student.email}>{student.email}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => editStudent(student)}
                        className={colorVariant === 'school' ? 'text-school hover:text-school-dark dark:text-school-light dark:hover:text-school-lighter' : 'text-instructor hover:text-instructor-dark dark:text-instructor-light dark:hover:text-instructor-lighter'}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteStudentHandler(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className={`text-sm ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>Dans Seviyesi:</span>
                      <p className="font-medium">
                        {student.level === 'beginner' && 'Başlangıç'}
                        {student.level === 'intermediate' && 'Orta'}
                        {student.level === 'advanced' && 'İleri'}
                        {student.level === 'professional' && 'Profesyonel'}
                        {!student.level && '-'}
                      </p>
                    </div>
                    {student.phoneNumber && (
                      <div>
                        <span className={`text-sm ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>Telefon:</span>
                        <p className="font-medium">{student.phoneNumber}</p>
                      </div>
                    )}
                    {userRole !== 'instructor' && (
                      <div>
                        <span className={`text-sm ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>Eğitmen:</span>
                        <p className="font-medium">{student.instructorName || '-'}</p>
                      </div>
                    )}
                    {userRole !== 'school' && (
                      <div>
                        <span className={`text-sm ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>Okul:</span>
                        <SchoolProfile
                          school={{
                            id: student.schoolId || '',
                            displayName: student.schoolName || '',
                            email: ''
                          }}
                          variant="card"
                        />
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className={`text-sm ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>Kurslar:</span>
                      {student.courseIds && student.courseIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {student.courseIds.map(courseId => {
                            const course = courses.find(c => c.id === courseId);
                            return course ? (
                              <span key={courseId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-indigo-800">
                                {course.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <p className="font-medium">-</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-4 text-sm ${colorVariant === 'school' ? 'text-gray-500 dark:text-[#cba990]' : 'text-gray-500 dark:text-gray-400'}`}>
                {searchTerm ? 'Aramanıza uygun öğrenci bulunamadı.' : 'Henüz hiç öğrenci kaydı bulunmuyor.'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 