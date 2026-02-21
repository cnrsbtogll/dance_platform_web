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
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Alert,
  CircularProgress,
  Rating,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { DanceLevel, DanceStyle } from '../../../../types';
import { SelectChangeEvent } from '@mui/material';
import CustomInput from '../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../../../common/components/ui/ImageUploader';

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
}

interface Option {
  value: string;
  label: string;
}

const defaultInstructorFormData: InstructorFormData = {
  id: '',
  displayName: '',
  email: '',
  phoneNumber: '',
  photoURL: '',
  danceStyles: [],
  biography: '',
  experience: 0
};

const InstructorManagement: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
  const { currentUser } = useAuth();
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
    fetchInstructors();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
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
      console.log('Fetching instructors for currentUser.uid:', currentUser.uid);

      const q = query(
        instructorsRef,
        where('role', '==', 'instructor'),
        where('schoolId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      console.log('Query snapshot size:', querySnapshot.size);
      console.log('Raw query results:');
      querySnapshot.forEach((doc) => {
        console.log('Document ID:', doc.id);
        console.log('Document data:', doc.data());
      });

      const instructorsData: Instructor[] = [];

      querySnapshot.forEach((doc) => {
        instructorsData.push({
          id: doc.id,
          ...doc.data()
        } as Instructor);
      });

      console.log('Processed instructors data:', instructorsData);

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
        experience: instructor.experience || 0
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
    if (base64Image) {
      setFormData(prev => ({ ...prev, photoURL: base64Image }));
    }
  };

  const handleSubmit = async () => {
    if (!currentUser?.uid) {
      setError('Oturum bilgisi bulunamadı.');
      return;
    }

    const currentUserId = currentUser.uid;

    try {
      setLoading(true);

      if (isEdit) {
        // Update existing instructor
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

        // Update the instructor in the local state
        setInstructors(instructors.map(instructor =>
          instructor.id === formData.id
            ? {
              ...instructor,
              displayName: formData.displayName,
              phoneNumber: formData.phoneNumber,
              danceStyles: formData.danceStyles,
              biography: formData.biography,
              experience: formData.experience,
              photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png',
            }
            : instructor
        ));

        setSuccessMessage('Eğitmen bilgileri başarıyla güncellendi.');
      } else {
        // Check if instructor with this email already exists
        const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', formData.email)));

        if (!userSnapshot.empty) {
          // Email already exists, check if user is an instructor
          const existingUser = userSnapshot.docs[0];
          const existingUserId = existingUser.id;
          const userData = existingUser.data();

          if (userData.role === 'instructor' || (Array.isArray(userData.role) && userData.role.includes('instructor'))) {
            // Already an instructor, just update the school association
            await updateDoc(doc(db, 'users', existingUserId), {
              schoolId: currentUserId,
              schoolName: schoolInfo.displayName,
              updatedAt: serverTimestamp()
            });

            // Add to the local state
            const existingInstructorData = existingUser.data() as Instructor;
            const updatedInstructor = {
              ...existingInstructorData,
              id: existingUserId,
              schoolId: currentUserId,
              schoolName: schoolInfo.displayName,
            };

            setInstructors([updatedInstructor, ...instructors]);
            setSuccessMessage('Mevcut eğitmen okulunuza bağlandı.');
          } else {
            // User exists but not an instructor - update role to include instructor
            const currentRole = userData.role;
            let newRole;

            if (Array.isArray(currentRole)) {
              if (!currentRole.includes('instructor')) {
                newRole = [...currentRole, 'instructor'];
              } else {
                newRole = currentRole;
              }
            } else if (typeof currentRole === 'string') {
              newRole = currentRole === 'instructor' ? currentRole : ['instructor', currentRole];
            } else {
              newRole = 'instructor';
            }

            await updateDoc(doc(db, 'users', existingUserId), {
              role: newRole,
              schoolId: currentUserId,
              schoolName: schoolInfo.displayName,
              danceStyles: formData.danceStyles,
              biography: formData.biography,
              experience: formData.experience,
              updatedAt: serverTimestamp()
            });

            // Add to the local state
            const existingUserData = existingUser.data() as Instructor;
            const updatedInstructor = {
              ...existingUserData,
              id: existingUserId,
              role: newRole,
              schoolId: currentUserId,
              schoolName: schoolInfo.displayName,
              danceStyles: formData.danceStyles,
              biography: formData.biography,
              experience: formData.experience,
            };

            setInstructors([updatedInstructor, ...instructors]);
            setSuccessMessage('Kullanıcı eğitmen rolüne yükseltildi ve okulunuza bağlandı.');
          }
        } else {
          // Create a new instructor
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
            updatedAt: serverTimestamp()
          };

          await setDoc(doc(db, 'users', newInstructorId), newInstructorData);

          // Add the new instructor to the local state
          const newInstructor = {
            ...newInstructorData,
            createdAt: Timestamp.now()
          } as Instructor;

          setInstructors([newInstructor, ...instructors]);
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

      // Remove the school association from the instructor
      const instructorRef = doc(db, 'users', selectedInstructorId);
      await updateDoc(instructorRef, {
        schoolId: null,
        schoolName: null,
        updatedAt: serverTimestamp()
      });

      // Remove from local state
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

  // Helper function to get a label for experience level
  const getExperienceText = (years: number) => {
    if (years < 1) return '1 yıldan az';
    if (years <= 3) return '1-3 yıl';
    if (years <= 5) return '3-5 yıl';
    if (years <= 10) return '5-10 yıl';
    return '10+ yıl';
  };

  return (
    <div>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold" className="text-gray-900 dark:text-white">
          Eğitmen Yönetimi
        </Typography>
        <Typography variant="body1" paragraph className="text-gray-600 dark:text-gray-400">
          Okulunuza kayıtlı eğitmenleri yönetin, yeni eğitmenler ekleyin ve mevcut eğitmenleri düzenleyin.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
      </Box>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 0 },
        mb: 3
      }}>
        <Box sx={{
          flex: { xs: '1', sm: '0 1 300px' },
          order: { xs: 2, sm: 1 },
          position: 'relative',
          '& .MuiInputBase-root': {
            paddingLeft: '40px'
          }
        }}>
          <SearchIcon
            sx={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'action.active',
              pointerEvents: 'none'
            }}
          />
          <CustomInput
            name="search"
            label=""
            placeholder="Eğitmen Ara..."
            value={searchTerm}
            onChange={(e: { target: { name: string; value: any } }) => setSearchTerm(e.target.value)}
            fullWidth
          />
        </Box>

        <Box sx={{
          order: { xs: 1, sm: 2 },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog(false)}
            fullWidth={false}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: '160px' },
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            Yeni Eğitmen
          </Button>
        </Box>
      </Box>

      {loading && instructors.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredInstructors.length > 0 ? (
            filteredInstructors.map((instructor) => (
              <Grid item xs={12} sm={6} md={4} key={instructor.id}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 8
                    }
                  }}
                >
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar
                      src={instructor.photoURL}
                      alt={instructor.displayName}
                      sx={{ width: 100, height: 100, mb: 2 }}
                    />
                    <Typography variant="h6" align="center" gutterBottom>
                      {instructor.displayName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating
                        value={instructor.rating || 0}
                        readOnly
                        precision={0.5}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {instructor.rating ? instructor.rating.toFixed(1) : 'Değerlendirilmemiş'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                      {instructor.danceStyles && instructor.danceStyles.map((style) => (
                        <Chip
                          key={style}
                          label={style.charAt(0).toUpperCase() + style.slice(1)}
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <Divider />
                  <CardContent sx={{ flexGrow: 1 }}>
                    {instructor.biography && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {instructor.biography.length > 100
                          ? `${instructor.biography.substring(0, 100)}...`
                          : instructor.biography}
                      </Typography>
                    )}

                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2">{instructor.email}</Typography>
                      </Box>
                      {instructor.phoneNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2">{instructor.phoneNumber}</Typography>
                        </Box>
                      )}
                      {instructor.experience && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2">
                            Deneyim: {getExperienceText(instructor.experience)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(true, instructor)}
                      startIcon={<EditIcon />}
                    >
                      Düzenle
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteConfirmOpen(instructor.id)}
                      startIcon={<DeleteIcon />}
                    >
                      Kaldır
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2
              }}>
                <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {searchTerm ? 'Arama kriterine uygun eğitmen bulunamadı.' : 'Henüz hiç eğitmen kaydı bulunmuyor.'}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {searchTerm
                    ? 'Farklı bir arama terimi deneyin veya yeni eğitmen ekleyin.'
                    : 'Yeni bir eğitmen eklemek için "Yeni Eğitmen" butonuna tıklayın.'}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Add/Edit Instructor Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            m: { xs: 2, sm: 4 },
            width: '100%',
            maxWidth: { xs: '100%', sm: '600px', md: '800px' }
          }
        }}
      >
        <DialogTitle sx={{
          pb: 1,
          fontSize: { xs: '1.25rem', sm: '1.5rem' }
        }}>
          {isEdit ? 'Eğitmen Düzenle' : 'Yeni Eğitmen Ekle'}
        </DialogTitle>
        <DialogContent sx={{
          p: { xs: 2, sm: 3 },
          '&:first-of-type': { pt: { xs: 2, sm: 3 } }
        }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Kişisel Bilgiler */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Kişisel Bilgiler
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomInput
                name="displayName"
                label="Ad Soyad"
                value={formData.displayName}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomInput
                name="email"
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isEdit}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomPhoneInput
                name="phoneNumber"
                label="Telefon"
                countryCode="+90"
                phoneNumber={formData.phoneNumber.replace('+90', '')}
                onCountryCodeChange={(code) => handlePhoneChange(code, formData.phoneNumber.replace('+90', ''))}
                onPhoneNumberChange={(number) => handlePhoneChange('+90', number)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ImageUploader
                currentPhotoURL={formData.photoURL}
                onImageChange={handleImageChange}
                displayName={formData.displayName}
                userType="instructor"
              />
            </Grid>

            {/* Dans Bilgileri */}
            <Grid item xs={12} sx={{ mt: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Dans Bilgileri
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomSelect
                name="experience"
                label="Deneyim"
                value={String(formData.experience)}
                onChange={(value) => handleSelectChange('experience', value)}
                options={experienceLevels.map(level => ({
                  value: String(level.value),
                  label: level.label
                }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomSelect
                name="danceStyles"
                label="Uzmanlık Alanları"
                value={formData.danceStyles}
                onChange={(value) => handleSelectChange('danceStyles', value)}
                options={danceStyles.map(style => ({
                  value: style,
                  label: style.charAt(0).toUpperCase() + style.slice(1)
                }))}
                multiple
                fullWidth
              />
            </Grid>

            {/* Biyografi */}
            <Grid item xs={12} sx={{ mt: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Biyografi
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <CustomInput
                name="biography"
                label="Biyografi"
                value={formData.biography}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder="Eğitmen hakkında kısa bir tanıtım yazısı..."
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{
          p: { xs: 2, sm: 3 },
          gap: 1
        }}>
          <Button
            onClick={handleCloseDialog}
            color="secondary"
            sx={{
              minWidth: { xs: '80px', sm: '100px' }
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!formData.displayName || !formData.email}
            sx={{
              minWidth: { xs: '80px', sm: '100px' }
            }}
          >
            {isEdit ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Eğitmeni Kaldır</DialogTitle>
        <DialogContent>
          <Typography>
            Bu eğitmeni okulunuzun listesinden kaldırmak istediğinize emin misiniz? Bu işlem, eğitmeni tamamen silmez, sadece okulunuzla olan bağlantısını kaldırır.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="secondary">
            İptal
          </Button>
          <Button onClick={handleDeleteInstructor} color="error" variant="contained">
            Kaldır
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InstructorManagement; 