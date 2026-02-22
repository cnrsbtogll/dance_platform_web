import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, secondaryAuth } from '../../../../api/firebase/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { DanceLevel, DanceStyle } from '../../../../types';
import CustomInput from '../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../../../common/components/ui/ImageUploader';
import Button from '../../../../common/components/ui/Button';
import Avatar from '../../../../common/components/ui/Avatar';

interface Instructor {
  id: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  danceStyles?: DanceStyle[];
  biography?: string;
  experience?: number;
  rating?: number;
  courseIds?: string[];
  createdAt: Timestamp;
}

interface SchoolInfo {
  id: string;
  displayName: string;
  [key: string]: any;
}

interface InstructorFormData {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL: string;
  danceStyles: DanceStyle[];
  biography: string;
  experience: number;
  password?: string;
}

const defaultInstructorFormData: InstructorFormData = {
  id: '',
  displayName: '',
  email: '',
  phoneNumber: '',
  photoURL: '',
  danceStyles: [],
  biography: '',
  experience: 0,
  password: ''
};

// SVG icons (no MUI dependency)
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const StarIcon = ({ filled = true }: { filled?: boolean }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-school-yellow fill-school-yellow' : 'text-gray-300 fill-gray-300'}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

import SimpleModal from '../../../../common/components/ui/SimpleModal';

const InstructorManagement: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState<string[]>([]);
  const isAdmin = userRole.includes('admin');
  const isSchool = userRole.includes('school');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<InstructorFormData>(defaultInstructorFormData);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dance styles and experience options
  const danceStyles: DanceStyle[] = ['salsa', 'bachata', 'kizomba', 'other'];
  const experienceLevels = [
    { value: 1, label: '1 yıldan az' },
    { value: 2, label: '1-3 yıl' },
    { value: 5, label: '3-5 yıl' },
    { value: 8, label: '5-10 yıl' },
    { value: 10, label: '10+ yıl' }
  ];

  // --- NEW Quick Assign State ---
  const [quickAssignModalOpen, setQuickAssignModalOpen] = useState(false);
  const [instructorToAssign, setInstructorToAssign] = useState<Instructor | null>(null);
  const [quickAssignCourseIds, setQuickAssignCourseIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [courses, setCourses] = useState<{ id: string, name: string }[]>([]);

  // Existing user warning state
  const [existingUserModalOpen, setExistingUserModalOpen] = useState(false);
  const [existingUserToLink, setExistingUserToLink] = useState<any>(null);
  // ------------------------------

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const roles = userDoc.data().role || [];
          setUserRole(Array.isArray(roles) ? roles : [roles]);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
      }
    };
    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    fetchInstructors();
  }, [currentUser?.uid, userRole]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    // Fetch courses for the current school
    const fetchCourses = async () => {
      try {
        const coursesRef = collection(db, 'courses');
        const q = query(
          coursesRef,
          where('schoolId', '==', schoolInfo.id)
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'İsimsiz Kurs'
        }));
        setCourses(docs);
      } catch (err) {
        console.error('Kurslar yüklenirken hata:', err);
      }
    };

    if (schoolInfo.id) {
      fetchCourses();
    }
  }, [schoolInfo.id]);

  useEffect(() => {
    const filtered = instructors.filter(instructor =>
      instructor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInstructors(filtered);
  }, [searchTerm, instructors]);

  const fetchInstructors = async () => {
    try {
      if (!currentUser?.uid) return;
      setLoading(true);
      const instructorsRef = collection(db, 'users');

      // Since Firestore doesn't support multiple array-contains or complex OR queries easily,
      // and a user's role might be an array (e.g., ['student', 'instructor']) and schoolIds might be an array,
      // we query by the legacy schoolId or array-contains schoolIds, and filter in memory.
      // For now, we fetch ALL users of this school and filter the 'instructor' role in memory.

      // Query users mapping to this school (using the legacy field for compatibility, 
      // but ideally we'd use schoolIds array-contains, or just filter everything if small enough)
      const q = query(
        instructorsRef,
        // Fallback to fetching all and filtering in memory or using where('schoolId', '==', schoolInfo.id)
        // If we want to support M:N schoolIds we should use:
        // where('schoolIds', 'array-contains', schoolInfo.id)
        // But for backward compatibility with older data:
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const instructorsData: Instructor[] = [];

      console.log('[DEBUG-INSTRUCTOR-PAGE] Fetched total user docs:', querySnapshot.docs.length);
      console.log('[DEBUG-INSTRUCTOR-PAGE] Target schoolId:', schoolInfo.id);

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // 1. Check if user belongs to this school
        const belongsToSchool =
          data.schoolId === schoolInfo.id ||
          (Array.isArray(data.schoolIds) && data.schoolIds.includes(schoolInfo.id));

        if (!belongsToSchool) return;

        // 2. Check if user is an instructor
        const isInstructor =
          data.role === 'instructor' ||
          data.role === 'draft-instructor' ||
          (Array.isArray(data.role) && (data.role.includes('instructor') || data.role.includes('draft-instructor')));

        if (isInstructor) {
          console.log(`[DEBUG-INSTRUCTOR-PAGE] Found match for school:`, data.displayName, data.email, data.schoolId, data.schoolIds);
          instructorsData.push({ id: doc.id, ...data } as Instructor);
        }
      });

      console.log('[DEBUG-INSTRUCTOR-PAGE] Final Valid Instructors Array:', instructorsData);

      setInstructors(instructorsData);
      setFilteredInstructors(instructorsData);
      setLoading(false);
    } catch (err) {
      console.error('Eğitmenler yüklenirken bir hata oluştu:', err);
      setError('Eğitmenler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setLoading(false);
    }
  };

  const handleOpenDialog = (isEditMode: boolean, instructor?: Instructor) => {
    setIsEdit(isEditMode);
    if (isEditMode && instructor) {
      setFormData({
        id: instructor.id,
        displayName: instructor.displayName,
        email: instructor.email,
        phoneNumber: instructor.phoneNumber || '',
        photoURL: instructor.photoURL || '',
        danceStyles: instructor.danceStyles || [],
        biography: instructor.biography || '',
        experience: instructor.experience || 0,
        password: ''
      });
    } else {
      setFormData(defaultInstructorFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(defaultInstructorFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (countryCode: string, phoneNumber: string) => {
    setFormData(prev => ({ ...prev, phoneNumber: `${countryCode}${phoneNumber}` }));
  };

  const handleImageChange = (base64Image: string | null) => {
    if (base64Image) setFormData(prev => ({ ...prev, photoURL: base64Image }));
  };

  const handleSubmit = async () => {
    if (!currentUser?.uid) { setError('Oturum bilgisi bulunamadı.'); return; }
    const managedSchoolId = schoolInfo.id;
    try {
      setLoading(true);
      if (isEdit) {
        const instructorRef = doc(db, 'users', formData.id);
        const updatePayload: any = {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          danceStyles: formData.danceStyles,
          biography: formData.biography,
          experience: formData.experience,
          photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png',
          updatedAt: serverTimestamp()
        };

        if (formData.password) {
          updatePayload.password = formData.password;
        }

        await updateDoc(instructorRef, updatePayload);
        setInstructors(instructors.map(instructor =>
          instructor.id === formData.id
            ? { ...instructor, displayName: formData.displayName, phoneNumber: formData.phoneNumber, danceStyles: formData.danceStyles, biography: formData.biography, experience: formData.experience, photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png' }
            : instructor
        ));
        setSuccessMessage('Eğitmen bilgileri başarıyla güncellendi.');
        handleCloseDialog();
      } else {
        // Check if user already exists
        const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', formData.email)));

        if (!userSnapshot.empty) {
          const existingUser = userSnapshot.docs[0];
          const userData = { id: existingUser.id, ...existingUser.data() };

          setExistingUserToLink(userData);
          setExistingUserModalOpen(true);
          setLoading(false);
          return;
        }

        // Create new instructor if doesn't exist
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          formData.email,
          formData.password!
        );

        await updateProfile(userCredential.user, {
          displayName: formData.displayName
        });

        const newInstructorId = userCredential.user.uid;
        const newInstructorData = {
          id: newInstructorId,
          displayName: formData.displayName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || '',
          role: 'instructor',
          danceStyles: formData.danceStyles,
          biography: formData.biography,
          experience: formData.experience,
          schoolId: managedSchoolId,
          schoolIds: [managedSchoolId],
          schoolName: schoolInfo.displayName,
          photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', newInstructorId), newInstructorData);
        setInstructors([{ ...newInstructorData, createdAt: Timestamp.now() } as Instructor, ...instructors]);
        setSuccessMessage('Yeni eğitmen başarıyla oluşturuldu ve eklendi.');
        handleCloseDialog();
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Eğitmen kaydedilirken bir hata oluştu:', err);
      setError('Eğitmen kaydedilirken bir hata oluştu: ' + (err.message || 'Lütfen tekrar deneyin.'));
      setLoading(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!existingUserToLink) return;
    const managedSchoolId = schoolInfo.id;

    try {
      setLoading(true);
      const existingUserId = existingUserToLink.id;
      const userData = existingUserToLink;

      // Check if already assigned to this school
      const schoolIds = Array.isArray(userData.schoolIds) ? userData.schoolIds : (userData.schoolId ? [userData.schoolId] : []);
      if (schoolIds.includes(managedSchoolId)) {
        setError('Bu eğitmen zaten okulunuza kayıtlı.');
        setLoading(false);
        setExistingUserModalOpen(false);
        return;
      }

      const currentRole = userData.role;
      let newRole = Array.isArray(currentRole)
        ? (!currentRole.includes('instructor') ? [...currentRole, 'instructor'] : currentRole)
        : (typeof currentRole === 'string' ? (currentRole === 'instructor' ? currentRole : ['instructor', currentRole]) : 'instructor');

      await updateDoc(doc(db, 'users', existingUserId), {
        role: newRole,
        schoolId: managedSchoolId, // Legacy
        schoolIds: arrayUnion(managedSchoolId), // M:N
        schoolName: schoolInfo.displayName,
        updatedAt: serverTimestamp()
      });

      setInstructors([{ ...userData, id: existingUserId, role: newRole, schoolId: managedSchoolId, schoolName: schoolInfo.displayName } as any, ...instructors]);
      setSuccessMessage('Mevcut kullanıcı eğitmen olarak okulunuza bağlandı.');

      setExistingUserModalOpen(false);
      setExistingUserToLink(null);
      handleCloseDialog();
      setLoading(false);
    } catch (err: any) {
      console.error('Kullanıcı bağlanırken hata:', err);
      setError('Kullanıcı bağlanırken bir hata oluştu.');
      setLoading(false);
    }
  };

  const handleDeleteConfirmOpen = (instructorId: string) => {
    setSelectedInstructorId(instructorId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteInstructor = async () => {
    if (!selectedInstructorId) return;
    try {
      setLoading(true);
      const instructorRef = doc(db, 'users', selectedInstructorId);
      const instructorSnap = await getDoc(instructorRef);

      if (instructorSnap.exists()) {
        const instData = instructorSnap.data();
        const courseIds = instData.courseIds || [];
        const displayName = instData.displayName || '';

        // Eğer eğitmenin kayıtlı olduğu kurslar varsa, o kurslardan da temizle
        if (courseIds.length > 0) {
          const updatePromises = courseIds.map(async (courseId: string) => {
            const courseRef = doc(db, 'courses', courseId);
            const courseSnap = await getDoc(courseRef);
            if (courseSnap.exists()) {
              const courseData = courseSnap.data();
              // Sadece bu okula ait kursları temizle (isteğe bağlı ama daha güvenli)
              if (courseData.schoolId === schoolInfo.id) {
                await updateDoc(courseRef, {
                  instructorIds: arrayRemove(selectedInstructorId),
                  instructorNames: arrayRemove(displayName),
                  updatedAt: serverTimestamp()
                });
              }
            }
          });
          await Promise.all(updatePromises);
        }
      }

      // Hem schoolId (legacy) hem de schoolIds (array) alanlarından temizle, courseIds'i de sıfırla
      await updateDoc(instructorRef, {
        schoolId: null,
        schoolName: null,
        schoolIds: arrayRemove(schoolInfo.id),
        courseIds: [], // Okuldan ayrıldığı için kurs bağlarını da koparalım
        updatedAt: serverTimestamp()
      });

      setInstructors(instructors.filter(instructor => instructor.id !== selectedInstructorId));
      setSuccessMessage('Eğitmen okul listenizden kaldırıldı ve tüm kurs kayıtları temizlendi.');
      setLoading(false);
      setDeleteConfirmOpen(false);
      setSelectedInstructorId(null);
    } catch (err) {
      console.error('Eğitmen silinirken bir hata oluştu:', err);
      setError('Eğitmen silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  // --- NEW Quick Assign Handlers ---
  const handleOpenQuickAssign = (instructor: Instructor) => {
    setInstructorToAssign(instructor);
    // As instructors don't currently have "courseIds" displayed in their grid by default, 
    // let's assume they have it in their user document if assigned previously
    setQuickAssignCourseIds((instructor as any).courseIds || []);
    setQuickAssignModalOpen(true);
  };

  const handleCloseQuickAssign = () => {
    setQuickAssignModalOpen(false);
    setInstructorToAssign(null);
    setQuickAssignCourseIds([]);
  };

  const handleSaveQuickAssign = async () => {
    if (!instructorToAssign) return;
    setIsAssigning(true);
    let errorMessage = '';

    try {
      const instructorRef = doc(db, 'users', instructorToAssign.id);
      const oldCourseIds = (instructorToAssign as any).courseIds || [];
      const newCourseIds = quickAssignCourseIds;

      const addedCourseIds = newCourseIds.filter((id: string) => !oldCourseIds.includes(id));
      const removedCourseIds = oldCourseIds.filter((id: string) => !newCourseIds.includes(id));

      const payload: any = {
        courseIds: newCourseIds,
        updatedAt: serverTimestamp()
      };

      await updateDoc(instructorRef, payload);

      // EKLENEN KURSLAR: courses tablosunda instructorIds ve instructorNames güncellemesi
      for (const courseId of addedCourseIds) {
        const courseRef = doc(db, 'courses', courseId);
        await updateDoc(courseRef, {
          instructorIds: arrayUnion(instructorToAssign.id),
          instructorNames: arrayUnion(instructorToAssign.displayName || instructorToAssign.email)
        });
      }

      // ÇIKARILAN KURSLAR: courses tablosundan bu eğitmeni düşür
      for (const courseId of removedCourseIds) {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          const cData = courseSnap.data();
          const currInstIds = cData.instructorIds || [];
          const currInstNames = cData.instructorNames || [];
          const newInstIds = currInstIds.filter((id: string) => id !== instructorToAssign.id);
          const newInstNames = currInstNames.filter((name: string) => name !== instructorToAssign.displayName && name !== instructorToAssign.email);
          await updateDoc(courseRef, {
            instructorIds: newInstIds,
            instructorNames: newInstNames
          });
        }
      }

      setInstructors(prev =>
        prev.map(i => i.id === instructorToAssign.id ? { ...i, courseIds: newCourseIds } : i)
      );

      setSuccessMessage('Eğitmenin kursları başarıyla güncellendi.');
      handleCloseQuickAssign();
    } catch (err) {
      console.error('Hızlı atama sırasında hata:', err);
      errorMessage = 'Kurs atama işlemi başarısız oldu.';
      setError(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };
  // ----------------------------------

  const getExperienceText = (years: number) => {
    if (years < 1) return '1 yıldan az';
    if (years <= 3) return '1-3 yıl';
    if (years <= 5) return '3-5 yıl';
    if (years <= 10) return '5-10 yıl';
    return '10+ yıl';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Eğitmen Yönetimi</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Okulunuza kayıtlı eğitmenleri yönetin, yeni eğitmenler ekleyin ve düzenleyin.
          </p>
        </div>

        {/* Toolbar: search + add button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:max-w-xs">
            <CustomInput
              name="search"
              label=""
              placeholder="Eğitmen Ara..."
              value={searchTerm}
              onChange={(e: { target: { name: string; value: any } }) => setSearchTerm(e.target.value)}
              fullWidth
              colorVariant="school"
              startIcon={<SearchIcon />}
            />
          </div>
          <Button
            variant="school"
            onClick={() => handleOpenDialog(false)}
            className="flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <PlusIcon />
            <span>Yeni Eğitmen</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm">
          {successMessage}
        </div>
      )}

      {/* Instructor Grid */}
      {loading && instructors.length === 0 ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-school" />
        </div>
      ) : filteredInstructors.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className={`rounded-lg shadow overflow-hidden border ${isAdmin
            ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
            : 'bg-school-bg border-school/40 dark:border-school/30 dark:bg-[#1a120b]'
            }`}>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={isAdmin
                  ? 'bg-gray-50 dark:bg-slate-900'
                  : 'bg-school-bg dark:bg-school/20'
                }>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Eğitmen
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      E-posta
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kurslar
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Değerlendirme
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isAdmin
                  ? 'bg-white dark:bg-slate-800 divide-gray-200 dark:divide-slate-700'
                  : 'bg-school-bg dark:bg-[#1a120b] divide-school/20 dark:divide-[#493322]'
                  }`}>
                  {filteredInstructors.map((instructor) => (
                    <tr key={instructor.id} className={`transition-colors ${isAdmin
                      ? 'hover:bg-gray-50 dark:hover:bg-slate-800'
                      : 'hover:bg-school/5 dark:hover:bg-school/10'
                      }`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <Avatar
                              src={instructor.photoURL}
                              alt={instructor.displayName}
                              className="h-10 w-10 ring-1 ring-school/20"
                              userType="instructor"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-school transition-colors">
                              {instructor.displayName}
                            </div>
                            {instructor.phoneNumber && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {instructor.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">{instructor.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {instructor.courseIds && instructor.courseIds.length > 0 ? (
                            instructor.courseIds.map(courseId => {
                              const course = courses.find(c => c.id === courseId);
                              return course ? (
                                <span key={courseId} className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                  {course.name}
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <StarIcon filled={true} />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {instructor.rating ? instructor.rating.toFixed(1) : '0.0'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenQuickAssign(instructor)}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 rounded-md text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-all shadow-sm active:scale-95"
                          >
                            Kursa Ata
                          </button>
                          <button
                            onClick={() => handleOpenDialog(true, instructor)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm active:scale-95 ${isAdmin
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                              : 'bg-school/10 dark:bg-school/20 text-school dark:text-school-light border border-school/20 dark:border-school/30 hover:bg-school/20 dark:hover:bg-school/30'
                              }`}
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteConfirmOpen(instructor.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 rounded-md text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-all shadow-sm active:scale-95"
                          >
                            Kaldır
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="bg-white dark:bg-[#231810] rounded-lg border border-gray-200 dark:border-[#493322] shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center max-w-[70%]">
                    <div className="flex-shrink-0 h-10 w-10">
                      <Avatar
                        src={instructor.photoURL}
                        alt={instructor.displayName}
                        className="h-10 w-10 ring-1 ring-school/20"
                        userType="instructor"
                      />
                    </div>
                    <div className="ml-3 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {instructor.displayName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={instructor.email}>
                        {instructor.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleOpenQuickAssign(instructor)}
                      className="inline-flex items-center px-2 py-1 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 rounded-md text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-all active:scale-95"
                    >
                      Kursa Ata
                    </button>
                    <button
                      onClick={() => handleOpenDialog(true, instructor)}
                      className={`inline-flex items-center p-1.5 rounded-md text-xs font-medium transition-all active:scale-95 ${isAdmin
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800'
                        : 'bg-school/10 dark:bg-school/20 text-school dark:text-school-light border border-school/20 dark:border-school/30'
                        }`}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirmOpen(instructor.id)}
                      className="inline-flex items-center p-1.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 rounded-md text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-95"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2">
                    <span className="text-sm text-gray-500 dark:text-[#cba990]">Atanmış Kurslar:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {instructor.courseIds && instructor.courseIds.length > 0 ? (
                        instructor.courseIds.map(courseId => {
                          const course = courses.find(c => c.id === courseId);
                          return course ? (
                            <span key={courseId} className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                              {course.name}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <p className="font-medium text-gray-400 text-xs">-</p>
                      )}
                    </div>
                  </div>
                  {instructor.phoneNumber && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-[#cba990]">Telefon:</span>
                      <p className="font-medium">{instructor.phoneNumber}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-500 dark:text-[#cba990]">Değerlendirme:</span>
                    <div className="flex items-center gap-1 font-medium mt-0.5">
                      <StarIcon filled={true} />
                      <span>{instructor.rating ? instructor.rating.toFixed(1) : '0.0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-16 text-center">
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-10 max-w-md mx-auto border border-dashed border-gray-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-school/10 dark:bg-school/20 rounded-full flex items-center justify-center mx-auto mb-4 text-school">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Eğitmen Bulunamadı' : 'Henüz Eğitmen Yok'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? 'Arama kriterlerinize uygun eğitmen bulunamadı. Farklı bir terim deneyin.'
                : 'Yeni bir eğitmen eklemek için aşağıdaki butona tıklayın.'}
            </p>
            {!searchTerm && (
              <Button variant="school" onClick={() => handleOpenDialog(false)} className="flex items-center gap-2 mx-auto">
                <PlusIcon />
                <span>Yeni Eğitmen Ekle</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quick Assign Modal */}
      <SimpleModal
        open={quickAssignModalOpen}
        onClose={handleCloseQuickAssign}
        title="Kursa Ata"
        colorVariant="school"
      >
        <div className="p-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <strong className="text-gray-900 dark:text-white">{instructorToAssign?.displayName}</strong> adlı eğitmeni aşağıdaki kurslara atayabilirsiniz:
          </p>
          <div className="mt-4">
            <CustomSelect
              name="quickCourseIds"
              label="Kurslar"
              value={quickAssignCourseIds}
              onChange={(value: string | string[]) => {
                if (Array.isArray(value)) {
                  setQuickAssignCourseIds(value);
                }
              }}
              options={courses.map(course => ({
                value: course.id,
                label: course.name
              }))}
              fullWidth
              multiple
              required
              colorVariant="school"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100 dark:border-slate-800">
            <Button
              variant="outlined"
              onClick={handleCloseQuickAssign}
              disabled={isAssigning}
            >
              İptal
            </Button>
            <Button
              onClick={handleSaveQuickAssign}
              variant="school"
              disabled={isAssigning}
            >
              {isAssigning ? 'Kaydediliyor...' : 'Atamayı Kaydet'}
            </Button>
          </div>
        </div>
      </SimpleModal>

      {/* Add/Edit Modal */}
      <SimpleModal
        open={openDialog}
        onClose={handleCloseDialog}
        title={isEdit ? 'Eğitmen Düzenle' : 'Yeni Eğitmen Ekle'}
        colorVariant={isAdmin ? 'admin' : 'school'}
        bodyClassName={
          isAdmin
            ? 'bg-indigo-50/50 dark:bg-slate-900/80'
            : 'bg-orange-50/30 dark:bg-[#1a120b]' /* Only School or Admin manages instructors directly */
        }
        actions={
          <>
            <Button variant="outlined" onClick={handleCloseDialog}>İptal</Button>
            <Button
              variant="school"
              onClick={handleSubmit}
              disabled={!formData.displayName || !formData.email || (!isEdit && !formData.password)}
            >
              {isEdit ? 'Güncelle' : 'Ekle'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Profile Picture at Top */}
          <div className="flex flex-col items-center justify-center pb-4 border-b border-gray-100 dark:border-slate-800">
            <ImageUploader
              currentPhotoURL={formData.photoURL}
              onImageChange={handleImageChange}
              displayName={formData.displayName}
              userType="instructor"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Eğitmen Profil Fotoğrafı
            </p>
          </div>

          {/* Personal info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Kişisel Bilgiler
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomInput
                name="displayName"
                label="Ad Soyad"
                value={formData.displayName}
                onChange={handleInputChange}
                required
                fullWidth
                colorVariant="school"
              />
              <CustomInput
                name="email"
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isEdit}
                fullWidth
                colorVariant="school"
                autoComplete="new-password"
              />
              <CustomPhoneInput
                name="phoneNumber"
                label="Telefon"
                countryCode="+90"
                phoneNumber={formData.phoneNumber.replace('+90', '')}
                onCountryCodeChange={(code) => handlePhoneChange(code, formData.phoneNumber.replace('+90', ''))}
                onPhoneNumberChange={(number) => handlePhoneChange('+90', number)}
                autoComplete="new-password"
              />
              <div className="flex flex-col gap-1">
                <CustomInput
                  name="password"
                  label={isEdit ? "Yeni Şifre (Opsiyonel)" : "Şifre"}
                  type="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  required={!isEdit}
                  fullWidth
                  colorVariant="school"
                  placeholder={isEdit ? "Değiştirmek için girin" : "Giriş şifresi oluşturun"}
                  autoComplete="new-password"
                />
                {isEdit && (
                  <span className="text-[10px] text-gray-500 italic">
                    * Yeni bir şifre girerseniz kullanıcının giriş şifresi güncellenir.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dance info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Dans Bilgileri
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomSelect
                name="experience"
                label="Deneyim"
                value={String(formData.experience)}
                onChange={(value) => handleSelectChange('experience', value)}
                options={experienceLevels.map(level => ({ value: String(level.value), label: level.label }))}
                fullWidth
                colorVariant="school"
              />
              <CustomSelect
                name="danceStyles"
                label="Uzmanlık Alanları"
                value={formData.danceStyles}
                onChange={(value) => handleSelectChange('danceStyles', value)}
                options={danceStyles.map(style => ({ value: style, label: style.charAt(0).toUpperCase() + style.slice(1) }))}
                multiple
                fullWidth
                colorVariant="school"
              />
            </div>
          </div>

          {/* Biography */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Biyografi
            </p>
            <CustomInput
              name="biography"
              label="Biyografi"
              value={formData.biography}
              onChange={handleInputChange}
              multiline
              rows={4}
              placeholder="Eğitmen hakkında kısa bir tanıtım yazısı..."
              fullWidth
              colorVariant="school"
            />
          </div>
        </div>
      </SimpleModal>

      {/* Existing User Warning Modal */}
      <SimpleModal
        open={existingUserModalOpen}
        onClose={() => setExistingUserModalOpen(false)}
        title="Kullanıcı Zaten Mevcut"
        colorVariant="school"
      >
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-800/50 flex items-center justify-center flex-shrink-0 text-orange-600 dark:text-orange-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Bu e-posta adresiyle bir kullanıcı zaten kayıtlı.</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>{existingUserToLink?.displayName}</strong> ({existingUserToLink?.email})
                {existingUserToLink?.role?.includes('instructor')
                  ? ' zaten bir eğitmen.'
                  : ' şu an bir ' + existingUserToLink?.role + '.'}
              </p>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Bu kullanıcıyı okulunuza eğitmen olarak bağlamak istiyor musunuz?
            {existingUserToLink?.role !== 'instructor' && ' Kullanıcının rolü otomatik olarak eğitmen olarak güncellenecektir.'}
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outlined" onClick={() => setExistingUserModalOpen(false)}>Vazgeç</Button>
            <Button variant="school" onClick={handleConfirmLink}>Evet, Bağla</Button>
          </div>
        </div>
      </SimpleModal>

      {/* Delete Confirmation Modal */}
      <SimpleModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Eğitmeni Kaldır"
        colorVariant={isAdmin ? 'admin' : 'school'}
        bodyClassName={
          isAdmin
            ? 'bg-indigo-50/50 dark:bg-slate-900/80'
            : 'bg-orange-50/30 dark:bg-[#1a120b]'
        }
        actions={
          <>
            <Button variant="outlined" onClick={() => setDeleteConfirmOpen(false)}>İptal</Button>
            <Button variant="danger" onClick={handleDeleteInstructor}>Kaldır</Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          Bu eğitmeni okulunuzun listesinden kaldırmak istediğinize emin misiniz?
          Bu işlem eğitmeni tamamen silmez, yalnızca okulunuzla bağlantısını kaldırır.
        </p>
      </SimpleModal>
    </div>
  );
};

export default InstructorManagement;