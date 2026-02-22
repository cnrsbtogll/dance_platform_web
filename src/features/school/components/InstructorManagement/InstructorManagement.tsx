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
  orderBy
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
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
      const q = query(
        instructorsRef,
        where('role', '==', 'instructor'),
        where('schoolId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const instructorsData: Instructor[] = [];
      querySnapshot.forEach((doc) => {
        instructorsData.push({ id: doc.id, ...doc.data() } as Instructor);
      });
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
    const currentUserId = currentUser.uid;
    try {
      setLoading(true);
      if (isEdit) {
        const instructorRef = doc(db, 'users', formData.id);
        await updateDoc(instructorRef, {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          danceStyles: formData.danceStyles,
          biography: formData.biography,
          experience: formData.experience,
          photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png',
          updatedAt: serverTimestamp()
        });
        setInstructors(instructors.map(instructor =>
          instructor.id === formData.id
            ? { ...instructor, displayName: formData.displayName, phoneNumber: formData.phoneNumber, danceStyles: formData.danceStyles, biography: formData.biography, experience: formData.experience, photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png' }
            : instructor
        ));
        setSuccessMessage('Eğitmen bilgileri başarıyla güncellendi.');
      } else {
        const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', formData.email)));
        if (!userSnapshot.empty) {
          const existingUser = userSnapshot.docs[0];
          const existingUserId = existingUser.id;
          const userData = existingUser.data();
          if (userData.role === 'instructor' || (Array.isArray(userData.role) && userData.role.includes('instructor'))) {
            await updateDoc(doc(db, 'users', existingUserId), { schoolId: currentUserId, schoolName: schoolInfo.displayName, updatedAt: serverTimestamp() });
            setInstructors([{ ...userData as Instructor, id: existingUserId, schoolId: currentUserId, schoolName: schoolInfo.displayName } as any, ...instructors]);
            setSuccessMessage('Mevcut eğitmen okulunuza bağlandı.');
          } else {
            const currentRole = userData.role;
            let newRole = Array.isArray(currentRole)
              ? (!currentRole.includes('instructor') ? [...currentRole, 'instructor'] : currentRole)
              : (typeof currentRole === 'string' ? (currentRole === 'instructor' ? currentRole : ['instructor', currentRole]) : 'instructor');
            await updateDoc(doc(db, 'users', existingUserId), { role: newRole, schoolId: currentUserId, schoolName: schoolInfo.displayName, danceStyles: formData.danceStyles, biography: formData.biography, experience: formData.experience, updatedAt: serverTimestamp() });
            setInstructors([{ ...userData as Instructor, id: existingUserId, role: newRole, schoolId: currentUserId, schoolName: schoolInfo.displayName, danceStyles: formData.danceStyles, biography: formData.biography, experience: formData.experience } as any, ...instructors]);
            setSuccessMessage('Kullanıcı eğitmen rolüne yükseltildi ve okulunuza bağlandı.');
          }
        } else {
          const newInstructorId = `instructor_${Date.now()}`;
          const newInstructorData = {
            id: newInstructorId,
            displayName: formData.displayName,
            email: formData.email,
            phoneNumber: formData.phoneNumber || '',
            role: 'instructor',
            danceStyles: formData.danceStyles,
            biography: formData.biography,
            experience: formData.experience,
            schoolId: currentUserId,
            schoolName: schoolInfo.displayName,
            photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            password: formData.password || null
          };
          await setDoc(doc(db, 'users', newInstructorId), newInstructorData);
          setInstructors([{ ...newInstructorData, createdAt: Timestamp.now() } as Instructor, ...instructors]);
          setSuccessMessage('Yeni eğitmen başarıyla eklendi.');
        }
      }
      setLoading(false);
      handleCloseDialog();
    } catch (err) {
      console.error('Eğitmen kaydedilirken bir hata oluştu:', err);
      setError('Eğitmen kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
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
      await updateDoc(instructorRef, { schoolId: null, schoolName: null, updatedAt: serverTimestamp() });
      setInstructors(instructors.filter(instructor => instructor.id !== selectedInstructorId));
      setSuccessMessage('Eğitmen okul listenizden kaldırıldı.');
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
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#493322]">
              <thead className="bg-gray-50 dark:bg-[#231810]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#cba990]">
                    Eğitmen
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#cba990]">
                    E-posta
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#cba990]">
                    Dans Alanları
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#cba990]">
                    Değerlendirme
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#cba990]">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1a120b] divide-y divide-gray-200 dark:divide-[#493322]">
                {filteredInstructors.map((instructor) => (
                  <tr key={instructor.id} className="hover:bg-gray-50 dark:hover:bg-[#231810] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Avatar
                            src={instructor.photoURL}
                            alt={instructor.displayName}
                            className="h-10 w-10 ring-1 ring-school/20"
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">{instructor.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {instructor.danceStyles && instructor.danceStyles.length > 0 ? (
                          instructor.danceStyles.map(style => (
                            <span key={style} className="px-2 py-0.5 rounded-full bg-school/10 dark:bg-school/20 text-xs font-medium text-school-dark dark:text-school-light capitalize">
                              {style}
                            </span>
                          ))
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <StarIcon filled={true} />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {instructor.rating ? instructor.rating.toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDialog(true, instructor)}
                          className="text-school hover:text-school-dark dark:text-school-light dark:hover:text-school-lighter transition-colors"
                          title="Düzenle"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirmOpen(instructor.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Kaldır"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                      onClick={() => handleOpenDialog(true, instructor)}
                      className="text-school hover:text-school-dark dark:text-school-light dark:hover:text-school-lighter p-1"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirmOpen(instructor.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2">
                    <span className="text-sm text-gray-500 dark:text-[#cba990]">Dans Alanları:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {instructor.danceStyles && instructor.danceStyles.length > 0 ? (
                        instructor.danceStyles.map(style => (
                          <span key={style} className="px-2 py-0.5 rounded-full bg-school/10 dark:bg-school/20 text-xs font-medium text-school-dark dark:text-school-light capitalize">
                            {style}
                          </span>
                        ))
                      ) : (
                        <p className="font-medium">-</p>
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
              {!isEdit && (
                <CustomInput
                  name="password"
                  label="Şifre"
                  type="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  colorVariant="school"
                  placeholder="Giriş şifresi oluşturun"
                  autoComplete="new-password"
                />
              )}
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