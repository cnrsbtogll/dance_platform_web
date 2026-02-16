import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import { Instructor as InstructorType, UserRole } from '../../../../types';
import Avatar from '../../../../common/components/ui/Avatar';

interface InstructorRequest {
  id: string;
  firstName: string;
  lastName: string;
  experience: string;
  danceStyles: string[];
  contactNumber: string;
  bio: string;
  userId: string;
  userEmail: string;
  photoURL?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

function InstructorRequests() {
  const [requests, setRequests] = useState<InstructorRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, 'instructorRequests'),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const requestsData: InstructorRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data()
        } as InstructorRequest);
      });
      
      // Sort by creation date (newest first)
      requestsData.sort((a, b) => {
        return b.createdAt?.toMillis() - a.createdAt?.toMillis();
      });
      
      setRequests(requestsData);
      
    } catch (err) {
      console.error('Eğitmen talepleri getirilirken hata oluştu:', err);
      setError('Eğitmen talepleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    setProcessingId(requestId);
    
    try {
      console.log('🔵 Onaylama işlemi başlatıldı:', { requestId, userId });
      
      // 1. Get the request document
      const requestDocRef = doc(db, 'instructorRequests', requestId);
      const requestDoc = await getDoc(requestDocRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Talep bulunamadı');
      }
      
      const requestData = requestDoc.data() as InstructorRequest;
      console.log('✅ Talep verileri alındı:', requestData);
      
      // 2. Get the user document
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('⚠️ Kullanıcı bulunamadı, yeni kullanıcı oluşturuluyor. User ID:', userId);
        
        // Kullanıcı yoksa, önce users koleksiyonunda yeni kullanıcı oluştur
        try {
          const newUserData = {
            email: requestData.userEmail,
            displayName: `${requestData.firstName} ${requestData.lastName}`.trim(),
            phoneNumber: requestData.contactNumber,
            role: 'instructor',
            isInstructor: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'active',
            // Varsayılan değerler ekle
            gender: 'Belirtilmemiş',
            age: 0,
            city: 'Belirtilmemiş',
            level: 'beginner',
            danceStyles: requestData.danceStyles,
            photoURL: requestData.photoURL || "/assets/images/dance/egitmen_default.jpg"
          };
          
          await setDoc(userDocRef, newUserData);
          console.log('✅ Yeni kullanıcı oluşturuldu:', newUserData);
        } catch (createError) {
          console.error('❌ Kullanıcı oluşturma hatası:', createError);
          throw new Error('Kullanıcı oluşturulamadı. Lütfen tekrar deneyin.');
        }
      }
      
      // 3. Get fresh user data after potential creation
      const freshUserDoc = await getDoc(userDocRef);
      const userData = freshUserDoc.data();
      
      if (!userData) {
        console.error('❌ Kullanıcı verileri alınamadı');
        throw new Error('Kullanıcı verilerine erişilemedi');
      }
      
      console.log('✅ Güncel kullanıcı verileri:', userData);
      
      // 4. Add instructor to the instructors collection
      const instructorData: Partial<InstructorType> = {
        userId: userId,
        displayName: `${requestData.firstName} ${requestData.lastName}`.trim(),
        email: userData.email || requestData.userEmail,
        photoURL: requestData.photoURL || userData.photoURL || "/assets/images/dance/egitmen_default.jpg",
        phoneNumber: userData.phoneNumber || requestData.contactNumber,
        role: 'instructor' as UserRole,
        specialties: requestData.danceStyles,
        experience: parseInt(requestData.experience) || 0,
        bio: requestData.bio || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('📝 Eğitmen verileri:', instructorData);
      const instructorsCollectionRef = collection(db, 'instructors');
      const instructorDoc = await addDoc(instructorsCollectionRef, instructorData);
      console.log('✅ Eğitmen dokümanı oluşturuldu. ID:', instructorDoc.id);
      
      // 5. Update user document with instructor data
      const userUpdates = {
        role: 'instructor',
        isInstructor: true,
        displayName: instructorData.displayName,
        photoURL: instructorData.photoURL,
        phoneNumber: instructorData.phoneNumber,
        instructorSpecialization: requestData.danceStyles,
        instructorExperience: requestData.experience,
        instructorBio: requestData.bio,
        instructorApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('📝 Kullanıcı güncellemeleri:', userUpdates);
      await updateDoc(userDocRef, userUpdates);
      console.log('✅ Kullanıcı dokümanı güncellendi');
      
      // 6. Update the request status
      const requestUpdates = {
        status: 'approved',
        updatedAt: serverTimestamp(),
        approvedBy: 'admin',
        instructorDocId: instructorDoc.id
      };
      
      console.log('📝 Talep güncellemeleri:', requestUpdates);
      await updateDoc(requestDocRef, requestUpdates);
      console.log('✅ Talep dokümanı güncellendi');
      
      // 7. Update the local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      alert('Eğitmen talebi başarıyla onaylandı. Eğitmen, eğitmenler listesine eklendi ve kullanıcı bilgileri güncellendi.');
      
    } catch (error: any) {
      console.error('❌ Eğitmen talebi onaylanırken hata oluştu:', error);
      console.error('Hata detayları:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      alert(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingId(requestId);
    
    try {
      // Update the request status
      const requestDocRef = doc(db, 'instructorRequests', requestId);
      await updateDoc(requestDocRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        rejectedBy: 'admin' // Ideally, this would be the admin user ID
      });
      
      // Update the local state
      setRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      alert('Eğitmen talebi reddedildi.');
      
    } catch (err) {
      console.error('Eğitmen talebi reddedilirken hata oluştu:', err);
      alert('Talebiniz reddedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pink"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p>{error}</p>
        <button 
          onClick={fetchRequests} 
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Eğitmen Başvuruları</h2>
        <p className="text-gray-600">Şu anda bekleyen eğitmen başvurusu bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">Eğitmen Başvuruları</h2>
      
      <div className="-mx-4 sm:mx-0 overflow-hidden">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-x-auto border border-gray-200 sm:rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Eğitmen
                  </th>
                  <th scope="col" className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    E-posta
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Deneyim
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Dans Stilleri
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Başvuru Tarihi
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Avatar
                            src={request.photoURL || ''}
                            alt={`${request.firstName} ${request.lastName}`}
                            className="h-10 w-10 rounded-full"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {`${request.firstName} ${request.lastName}`.trim()}
                          </div>
                          <div className="text-sm text-gray-500 md:hidden">
                            {request.userEmail}
                          </div>
                          <div className="text-sm text-gray-500 lg:hidden">
                            {request.experience}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                      {request.userEmail}
                    </td>
                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                      {request.experience}
                    </td>
                    <td className="hidden xl:table-cell px-4 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {request.danceStyles.map((style, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-indigo-800"
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {request.createdAt ? request.createdAt.toDate().toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApproveRequest(request.id, request.userId)}
                          disabled={processingId === request.id}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {processingId === request.id ? 'İşleniyor...' : 'Onayla'}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingId === request.id}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {processingId === request.id ? 'İşleniyor...' : 'Reddet'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-4 text-sm text-center text-gray-500">
                      Henüz eğitmen başvurusu bulunmamaktadır.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstructorRequests; 