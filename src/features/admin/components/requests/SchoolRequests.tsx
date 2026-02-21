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
  // Gerçek Firestore alanları
  firstName?: string;
  lastName?: string;
  schoolName: string;
  schoolDescription?: string;
  schoolAddress?: string;  // Firestore'da schoolAddress olarak geçiyor
  address?: string;        // eski alan fallback
  city?: string;
  zipCode?: string;
  country?: string;
  contactNumber?: string;  // Firestore'da contactNumber
  contactPhone?: string;   // fallback
  contactPerson?: string;
  contactEmail?: string;
  instagramHandle?: string;
  website?: string;
  danceStyles?: string[];
  establishedYear?: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  documents?: string[];
  idDocumentUrl?: string;
  certDocumentUrl?: string;
}

function SchoolRequests(): JSX.Element {
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SchoolRequest | null>(null);
  const [contactRequest, setContactRequest] = useState<SchoolRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchRequests(statusFilter);
  }, [statusFilter]);

  const fetchRequests = async (status: 'all' | 'pending' | 'approved' | 'rejected' = 'pending') => {
    setLoading(true);
    setError(null);

    try {
      const col = collection(db, 'schoolRequests');
      const q = status === 'all'
        ? query(col)
        : query(col, where('status', '==', status));

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
        const dateA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        const dateB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        return dateB - dateA;
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
        <span className="ml-3 text-gray-700 dark:text-gray-300">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p>{error}</p>
        <button
          onClick={() => fetchRequests(statusFilter)}
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
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Okul Başvuruları</h2>
        <p className="text-gray-600 dark:text-gray-400">Şu anda bekleyen okul başvurusu bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Okul Başvuruları</h2>
        <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden text-sm">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => {
            const labels = { all: 'Tümü', pending: 'Bekleyen', approved: 'Onaylandı', rejected: 'Reddedildi' };
            const colors = {
              all: statusFilter === s ? 'bg-gray-700 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700',
              pending: statusFilter === s ? 'bg-yellow-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700',
              approved: statusFilter === s ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700',
              rejected: statusFilter === s ? 'bg-red-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700',
            };
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 font-medium transition-colors ${colors[s]}`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {requests.length === 0 && !loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Bu filtrede okul başvurusu bulunmamaktadır.</p>
        </div>
      ) : null}

      <div className="-mx-4 sm:mx-0 overflow-hidden">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 sm:rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Okul
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    İletişim Kişisi
                  </th>
                  <th scope="col" className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    E-posta
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Telefon
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Durum
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
                            src={null}
                            alt={request.schoolName}
                            className="h-10 w-10 rounded-full"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.schoolName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                            {request.contactPerson || `${request.firstName || ''} ${request.lastName || ''}`.trim() || '-'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 md:hidden">
                            {request.contactEmail || request.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {request.contactPerson || `${request.firstName || ''} ${request.lastName || ''}`.trim() || '-'}
                    </td>
                    <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {request.contactEmail || request.userEmail || '-'}
                    </td>
                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {request.contactNumber || request.contactPhone || '-'}
                    </td>
                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                      {request.status === 'approved' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Onaylandı</span>
                      )}
                      {request.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Reddedildi</span>
                      )}
                      {request.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Bekliyor</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-end items-center space-x-2">
                        {(request.idDocumentUrl || request.certDocumentUrl || (request.documents && request.documents.length > 0)) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" title="Yüklü belge var">
                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            📄
                          </span>
                        )}
                        <button
                          onClick={() => setContactRequest(request)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 dark:border-blue-700 text-xs font-medium rounded text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/60 focus:outline-none"
                        >
                          İletişim
                        </button>
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-slate-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none"
                        >
                          Detaylar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                      Henüz okul başvurusu bulunmamaktadır.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contact Popup */}
      {contactRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setContactRequest(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">İletişim Bilgileri</h3>
              <button onClick={() => setContactRequest(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <Avatar src={null} alt={contactRequest.schoolName} className="h-12 w-12 rounded-full" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{contactRequest.schoolName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{contactRequest.contactPerson} &bull; Okul Adayı</p>
              </div>
            </div>
            <div className="space-y-3">
              <a href={`mailto:${contactRequest.contactEmail || contactRequest.userEmail}`} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">E-posta ({contactRequest.contactPerson || `${contactRequest.firstName || ''} ${contactRequest.lastName || ''}`.trim() || 'Yetkili'})</p>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{contactRequest.contactEmail || contactRequest.userEmail}</p>
                </div>
              </a>
              <a href={`tel:${contactRequest.contactNumber || contactRequest.contactPhone}`} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Telefon</p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">{contactRequest.contactNumber || contactRequest.contactPhone || '-'}</p>
                </div>
              </a>
              {contactRequest.website && (
                <a href={contactRequest.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Web Sitesi</p>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400 truncate">{contactRequest.website}</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <SchoolDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          isProcessing={processingId === selectedRequest.id}
        />
      )}
    </div>
  );
}

interface ModalProps {
  request: SchoolRequest;
  onClose: () => void;
  onApprove: (id: string, userId: string) => void;
  onReject: (id: string) => void;
  isProcessing: boolean;
}

function SchoolDetailsModal({ request, onClose, onApprove, onReject, isProcessing }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-slate-900 dark:opacity-90"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar
                    src={null}
                    alt={request.schoolName}
                    className="h-16 w-16 rounded-full"
                  />
                  <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white">
                    {request.schoolName}
                  </h3>
                </div>

                <div className="mt-2 space-y-4">
                  <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-brand-pink uppercase tracking-wider">İletişim Bilgileri</h4>
                    {(request.contactPerson || request.firstName) && (
                      <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Yetkili Kişi</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.contactPerson || `${request.firstName || ''} ${request.lastName || ''}`.trim()}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">E-posta</span>
                      <a href={`mailto:${request.contactEmail || request.userEmail}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        {request.contactEmail || request.userEmail}
                      </a>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">Telefon</span>
                      <a href={`tel:${request.contactNumber || request.contactPhone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        {request.contactNumber || request.contactPhone || '-'}
                      </a>
                    </div>
                    {request.instagramHandle && (
                      <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Instagram</span>
                        <p className="text-sm text-gray-900 dark:text-white">@{request.instagramHandle}</p>
                      </div>
                    )}
                    {request.website && (
                      <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Web Sitesi</span>
                        <a href={request.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          {request.website}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider pt-2">Okul Detayları</h4>
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">Adres</span>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {[request.schoolAddress || request.address, request.city].filter(Boolean).join(', ') || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">Dans Stilleri</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(request.danceStyles || []).map((style, index) => (
                          <span key={index} className="px-2 py-0.5 bg-rose-100 text-brand-pink rounded text-xs">
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">Açıklama</span>
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{request.schoolDescription || 'Belirtilmemiş'}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Kuruluş Yılı</span>
                        <span className="text-gray-900 dark:text-white">{request.establishedYear}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Başvuru Tarihi</span>
                        <span className="text-gray-900 dark:text-white">
                          {request.createdAt ? (
                            (request.createdAt as any).toDate ? (
                              (request.createdAt as any).toDate().toLocaleDateString('tr-TR')
                            ) : (
                              new Date(request.createdAt as any).toLocaleDateString('tr-TR')
                            )
                          ) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Yüklü Dökümanlar */}
                  <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Yüklü Dökümanlar</h4>
                    {(request.idDocumentUrl || request.certDocumentUrl || (request.documents && request.documents.length > 0)) ? (
                      <div className="space-y-2">
                        {request.idDocumentUrl && (
                          <a
                            href={request.idDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                          >
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mr-3">
                              <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Kimlik Belgesi</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Görüntülemek için tıklayın</p>
                            </div>
                          </a>
                        )}
                        {request.certDocumentUrl && (
                          <a
                            href={request.certDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                          >
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Sertifika Belgesi</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Görüntülemek için tıklayın</p>
                            </div>
                          </a>
                        )}
                        {(request.documents || []).map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-2 rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                          >
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">Döküman {idx + 1}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">Yüklenmiş döküman bulunmamaktadır.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <button
              onClick={() => onApprove(request.id, request.userId)}
              disabled={isProcessing}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Onayla
            </button>
            <button
              onClick={() => onReject(request.id)}
              disabled={isProcessing}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Reddet
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchoolRequests;