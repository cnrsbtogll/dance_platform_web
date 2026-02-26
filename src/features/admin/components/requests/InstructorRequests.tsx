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

interface DocumentFile {
  name: string;
  type: string;
  base64: string;
  sizeKB: number;
}

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
  idDocument?: DocumentFile | null;
  certificate?: DocumentFile | null;
}

function InstructorRequests() {
  const [requests, setRequests] = useState<InstructorRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<{ doc: DocumentFile; title: string } | null>(null);

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
        const dateA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        const dateB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        return dateB - dateA;
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
            danceStyles: requestData.danceStyles || [],
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
        specialties: requestData.danceStyles || [],
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
        instructorSpecialization: requestData.danceStyles || [],
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

  const handleRejectRequest = async (requestId: string, userId: string) => {
    setProcessingId(requestId);

    try {
      // 1. Update the request status
      const requestDocRef = doc(db, 'instructorRequests', requestId);
      await updateDoc(requestDocRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        rejectedBy: 'admin'
      });

      // 2. Reset user role back to 'student'
      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          await updateDoc(userDocRef, {
            role: 'student',
            isInstructor: false,
            updatedAt: serverTimestamp()
          });
          console.log('✅ Kullanıcı rolü student olarak sıfırlandı:', userId);
        }
      }

      // 3. Update the local state
      setRequests(prev =>
        prev.filter(req => req.id !== requestId)
      );

      alert('Eğitmen talebi reddedildi. Kullanıcı rolü öğrenciye geri döndürüldü.');

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
        <span className="ml-3 text-gray-700 dark:text-gray-300">Yükleniyor...</span>
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
      <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Eğitmen Başvuruları</h2>
        <p className="text-gray-600 dark:text-gray-400">Şu anda bekleyen eğitmen başvurusu bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Eğitmen Başvuruları</h2>

      <div className="-mx-4 sm:mx-0 overflow-hidden">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 sm:rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Eğitmen
                  </th>
                  <th scope="col" className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    E-posta
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Deneyim
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Dans Stilleri
                  </th>
                  <th scope="col" className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Belgeler
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Başvuru Tarihi
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200">
                {Array.isArray(requests) && requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
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
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {`${request.firstName} ${request.lastName}`.trim()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 md:hidden">
                            {request.userEmail}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 lg:hidden">
                            {request.experience}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {request.userEmail}
                    </td>
                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {request.experience}
                    </td>
                    <td className="hidden xl:table-cell px-4 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {request.danceStyles && Array.isArray(request.danceStyles) ? (
                          request.danceStyles.map((style, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-indigo-800"
                            >
                              {style}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Belirtilmemiş</span>
                        )}
                      </div>
                    </td>

                    {/* ─── Belgeler Sütunu ─── */}
                    <td className="hidden md:table-cell px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Kimlik */}
                        {request.idDocument ? (
                          <button
                            onClick={() => setDocPreview({ doc: request.idDocument!, title: 'Kimlik Belgesi' })}
                            title="Kimlik Belgesini Görüntüle"
                            className="group relative flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                          >
                            {request.idDocument.type.startsWith('image/') ? (
                              <img
                                src={request.idDocument.base64}
                                alt="Kimlik"
                                className="w-6 h-6 rounded object-cover"
                              />
                            ) : (
                              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z" />
                              </svg>
                            )}
                            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Kimlik</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Yok</span>
                        )}

                        {/* Sertifika */}
                        {request.certificate && (
                          <button
                            onClick={() => setDocPreview({ doc: request.certificate!, title: 'Eğitmenlik Sertifikası' })}
                            title="Sertifikayı Görüntüle"
                            className="group relative flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800/40 transition-colors"
                          >
                            {request.certificate.type.startsWith('image/') ? (
                              <img
                                src={request.certificate.base64}
                                alt="Sertifika"
                                className="w-6 h-6 rounded object-cover"
                              />
                            ) : (
                              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z" />
                              </svg>
                            )}
                            <span className="text-xs text-green-700 dark:text-green-300 font-medium">Sertifika</span>
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {request.createdAt ? (
                        (request.createdAt as any).toDate ? (
                          (request.createdAt as any).toDate().toLocaleDateString('tr-TR')
                        ) : (
                          new Date(request.createdAt as any).toLocaleDateString('tr-TR')
                        )
                      ) : '-'}
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
                          onClick={() => handleRejectRequest(request.id, request.userId)}
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
                    <td colSpan={7} className="px-4 sm:px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                      Henüz eğitmen başvurusu bulunmamaktadır.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Belge Önizleme Modalı ─── */}
      {docPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDocPreview(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal başlık */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-instructor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{docPreview.title}</h3>
              </div>
              <button
                onClick={() => setDocPreview(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal içerik */}
            <div className="p-6">
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">{docPreview.doc.name}</span>
                <span>·</span>
                <span>{docPreview.doc.sizeKB} KB</span>
              </div>

              {docPreview.doc.type.startsWith('image/') ? (
                <img
                  src={docPreview.doc.base64}
                  alt={docPreview.title}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 object-contain max-h-[60vh]"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-20 h-24 bg-red-50 dark:bg-red-900/20 rounded-xl flex flex-col items-center justify-center border border-red-200 dark:border-red-700">
                    <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 15.5h1.25v-1.75H11a1.25 1.25 0 000-2.5H8.5v4.25zm1.25-3h1.25a.25.25 0 010 .5H9.75v-.5zm3.5 3h1.5a1.75 1.75 0 000-3.5H13.25v3.5zm1.25-2.5a.75.75 0 010 1.5H14.5v-1.5h.5zm2.25 2.5h1.25v-1.5H18v-.5h1.25v-.75H17.75v2.75z" />
                    </svg>
                    <span className="text-red-500 text-xs font-bold mt-1">PDF</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{docPreview.doc.name}</p>
                  <a
                    href={docPreview.doc.base64}
                    download={docPreview.doc.name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-instructor text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF'i İndir
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorRequests;
