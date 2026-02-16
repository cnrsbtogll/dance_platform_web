import React, { useState, useEffect } from 'react';
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
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import Avatar from '../../../../common/components/ui/Avatar';

interface SchoolRequest {
  id: string;
  schoolName: string;
  schoolDescription: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  website?: string;
  danceStyles: string[];
  establishedYear: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

function SchoolRequests(): JSX.Element {
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SchoolRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, 'schoolRequests'),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const requestsData: SchoolRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data()
        } as SchoolRequest);
      });
      
      // Sort by creation date (newest first)
      requestsData.sort((a, b) => {
        return b.createdAt?.toMillis() - a.createdAt?.toMillis();
      });
      
      setRequests(requestsData);
      
    } catch (err) {
      console.error('Okul talepleri getirilirken hata oluştu:', err);
      setError('Okul talepleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    setProcessingId(requestId);
    
    try {
      // 1. Get the request document
      const requestDocRef = doc(db, 'schoolRequests', requestId);
      const requestDoc = await getDoc(requestDocRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Talep bulunamadı');
      }
      
      const requestData = requestDoc.data() as SchoolRequest;
      
      // 2. Get the user document
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('Kullanıcı bulunamadı');
      }
      
      // 3. Update the user document to add the school role
      const userData = userDoc.data();
      
      // Add school-specific data to the user document
      await updateDoc(userDocRef, {
        role: 'school', // Artık array değil, string
        isSchool: true,
        schoolApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 4. Add school to the schools collection
      const schoolData = {
        name: requestData.schoolName,
        description: requestData.schoolDescription,
        address: requestData.address,
        city: requestData.city,
        zipCode: requestData.zipCode,
        country: requestData.country,
        website: requestData.website || '',
        danceStyles: requestData.danceStyles,
        establishedYear: requestData.establishedYear,
        contactPerson: requestData.contactPerson,
        contactEmail: requestData.contactEmail,
        contactPhone: requestData.contactPhone,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };
      
      const schoolsCollectionRef = collection(db, 'schools');
      const newSchoolDoc = await addDoc(schoolsCollectionRef, schoolData);
      
      // 5. Update the request status
      await updateDoc(requestDocRef, {
        status: 'approved',
        updatedAt: serverTimestamp(),
        approvedBy: 'admin', // Ideally, this would be the admin user ID
        schoolId: newSchoolDoc.id
      });
      
      // 6. Update the local state
      setRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      alert('Okul talebi başarıyla onaylandı. Okul, okullar listesine eklendi ve kullanıcı bilgileri güncellendi.');
      
    } catch (err) {
      console.error('Okul talebi onaylanırken hata oluştu:', err);
      alert(`Hata: ${err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingId(requestId);
    
    try {
      // Update the request status
      const requestDocRef = doc(db, 'schoolRequests', requestId);
      await updateDoc(requestDocRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        rejectedBy: 'admin' // Ideally, this would be the admin user ID
      });
      
      // Update the local state
      setRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      alert('Okul talebi reddedildi.');
      
    } catch (err) {
      console.error('Okul talebi reddedilirken hata oluştu:', err);
      alert('Talebiniz reddedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (request: SchoolRequest) => {
    setSelectedRequest(request);
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
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Okul Başvuruları</h2>
        <p className="text-gray-600">Şu anda bekleyen okul başvurusu bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">Okul Başvuruları</h2>
      
      <div className="-mx-4 sm:mx-0 overflow-hidden">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-x-auto border border-gray-200 sm:rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Okul
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    İletişim Kişisi
                  </th>
                  <th scope="col" className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    E-posta
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Telefon
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Dans Stilleri
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
                            src={null}
                            alt={request.schoolName}
                            className="h-10 w-10 rounded-full"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.schoolName}
                          </div>
                          <div className="text-sm text-gray-500 sm:hidden">
                            {request.contactPerson}
                          </div>
                          <div className="text-sm text-gray-500 md:hidden">
                            {request.contactEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                      {request.contactPerson}
                    </td>
                    <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                      {request.contactEmail}
                    </td>
                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                      {request.contactPhone}
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
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink"
                        >
                          Detaylar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-4 text-sm text-center text-gray-500">
                      Henüz okul başvurusu bulunmamaktadır.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex items-center space-x-4 mb-6">
                      <Avatar
                        src={null}
                        alt={selectedRequest.schoolName}
                        className="h-16 w-16 rounded-full"
                      />
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedRequest.schoolName}
                      </h3>
                    </div>
                    <div className="mt-2 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">İletişim Kişisi</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.contactPerson}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">E-posta</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.contactEmail}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefon</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.contactPhone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Adres</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.address}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Şehir</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.city}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Dans Stilleri</label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedRequest.danceStyles.map((style, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-indigo-800"
                            >
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.schoolDescription}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kuruluş Yılı</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.establishedYear}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Başvuru Tarihi</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedRequest.createdAt.toDate()).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-pink text-base font-medium text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolRequests; 