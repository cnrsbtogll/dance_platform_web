import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import Avatar from '../../../../common/components/ui/Avatar';
import { getMinioUrl, getPresignedUrl } from '../../../../common/utils/imageUtils';

interface SchoolRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  schoolName: string;
  schoolDescription?: string;
  description?: string;          // alias
  schoolAddress?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  contactNumber?: string;
  contactPhone?: string;
  contactPerson?: string;
  contactEmail?: string;
  instagramHandle?: string;
  website?: string;
  danceStyles?: string[];
  establishedYear?: string;
  photoURL?: string;             // okul fotoğrafı
  document_url?: string;         // belge URL (activation akışı)
  document_name?: string;
  userId: string;
  userEmail: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  type?: 'activation' | 'new_school';
  schoolId?: string;
  schoolDocument?: string;
  schoolDocumentName?: string;
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
  const [editingRequest, setEditingRequest] = useState<SchoolRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Search, sort and bulk states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    fetchRequests(statusFilter);
    setSelectedIds([]); // Clear selection when filter changes
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

      const resolvedRequests = await Promise.all(
        requestsData.map(async (req) => {
          let userPhoto = null;
          try {
            const userSnap = await getDoc(doc(db, 'users', req.userId));
            if (userSnap.exists()) {
              const userData = userSnap.data();
              userPhoto = userData.photoURL || null;
            }
          } catch (e) {
            console.error('Error fetching user photo for school request:', req.id, e);
          }

          const targetPhoto = userPhoto || req.photoURL || null;
          const resolvedPhoto = await getPresignedUrl(targetPhoto);
          const resolvedIdDoc = await getPresignedUrl(req.idDocumentUrl);
          const resolvedCertDoc = await getPresignedUrl(req.certDocumentUrl);
          const resolvedSchoolDoc = await getPresignedUrl(req.schoolDocument);
          
          let resolvedDocs: string[] = [];
          if (req.documents && Array.isArray(req.documents)) {
            resolvedDocs = await Promise.all(
              req.documents.map(async (docPath) => {
                const url = await getPresignedUrl(docPath);
                return url || '';
              })
            );
          }

          return {
            ...req,
            photoURL: resolvedPhoto || undefined,
            idDocumentUrl: resolvedIdDoc || undefined,
            certDocumentUrl: resolvedCertDoc || undefined,
            schoolDocument: resolvedSchoolDoc || undefined,
            documents: resolvedDocs.length > 0 ? resolvedDocs : undefined
          };
        })
      );

      setRequests(resolvedRequests);

    } catch (err) {
      console.error('Okul talepleri getirilirken hata oluştu:', err);
      setError('Okul talepleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // Core approval logic reused by single and bulk approve
  const approveRequestSilent = async (requestId: string, userId: string) => {
    const requestDocRef = doc(db, 'schoolRequests', requestId);
    const requestDoc = await getDoc(requestDocRef);

    if (!requestDoc.exists()) throw new Error('Talep bulunamadı');

    const requestData = requestDoc.data() as SchoolRequest;

    // ── Aktivasyon talebi (yeni akış): schoolRequests → schools ──
    if (requestData.type === 'activation') {
      // 1. schoolRequests verisinden yeni aktif okul oluştur
      const newSchoolData = {
        name: requestData.schoolName,
        displayName: requestData.schoolName,
        description: requestData.schoolDescription || requestData.description || '',
        contactPerson: requestData.contactPerson,
        contactEmail: requestData.contactEmail,
        contactPhone: requestData.contactPhone || '',
        address: requestData.address || '',
        photoURL: requestData.photoURL || null,
        document_url: requestData.schoolDocument || requestData.document_url || null,
        document_name: requestData.schoolDocumentName || requestData.document_name || null,
        userId: userId,
        status: 'active',
        documentStatus: 'approved',
        approvedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const newSchoolDoc = await addDoc(collection(db, 'schools'), newSchoolData);

      // 2. Kullanıcıyı güncelle: schoolId ekle, schoolRequestId'yi temizle
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        schoolId: newSchoolDoc.id,
        schoolRequestId: null,
        is_school_pending: false,
        role: 'school',
        isSchool: true,
        schoolApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. schoolRequests kaydını approved yap
      await updateDoc(requestDocRef, {
        status: 'approved',
        approvedBy: 'admin',
        schoolId: newSchoolDoc.id,
        updatedAt: serverTimestamp()
      });
      return;
    }

    // ── Eski akış: Yeni okul oluştur ──
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) throw new Error('Kullanıcı bulunamadı');

    await updateDoc(userDocRef, {
      role: 'school',
      isSchool: true,
      is_school_pending: false,
      schoolApprovedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const schoolData = {
      name: requestData.schoolName,
      displayName: requestData.schoolName,
      description: requestData.schoolDescription || requestData.description || '',
      address: requestData.address || requestData.schoolAddress || '',
      city: requestData.city || '',
      zipCode: requestData.zipCode || '',
      country: requestData.country || '',
      website: requestData.website || '',
      danceStyles: requestData.danceStyles || [],
      establishedYear: requestData.establishedYear || '',
      contactPerson: requestData.contactPerson || '',
      contactEmail: requestData.contactEmail || '',
      contactPhone: requestData.contactPhone || requestData.contactNumber || '',
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    };

    const schoolsCollectionRef = collection(db, 'schools');
    const newSchoolDoc = await addDoc(schoolsCollectionRef, schoolData);

    await updateDoc(userDocRef, { schoolId: newSchoolDoc.id });

    await updateDoc(requestDocRef, {
      status: 'approved',
      updatedAt: serverTimestamp(),
      approvedBy: 'admin',
      schoolId: newSchoolDoc.id
    });
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    setProcessingId(requestId);

    try {
      await approveRequestSilent(requestId, userId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
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
      const requestDocRef = doc(db, 'schoolRequests', requestId);
      await updateDoc(requestDocRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        rejectedBy: 'admin'
      });

      setRequests(prev => prev.filter(req => req.id !== requestId));
      alert('Okul talebi reddedildi.');
    } catch (err) {
      console.error('Okul talebi reddedilirken hata oluştu:', err);
      alert('Talebiniz reddedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteRequest = async (requestId: string, userId: string) => {
    if (!window.confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
    setProcessingId(requestId);

    try {
      await deleteDoc(doc(db, 'schoolRequests', requestId));
      
      // Clear user's school-related pending flags
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        await updateDoc(userDocRef, {
          schoolRequestId: null,
          is_school_pending: false,
          updatedAt: serverTimestamp()
        });
      }

      setRequests(prev => prev.filter(req => req.id !== requestId));
      alert('Okul talebi başarıyla silindi ve kullanıcının bekleyen durumları temizlendi.');
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error('Okul talebi silinirken hata oluştu:', err);
      alert('Talep silinirken bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveRequest = async (updatedData: Partial<SchoolRequest>) => {
    if (!editingRequest) return;
    setProcessingId(editingRequest.id);

    try {
      const requestDocRef = doc(db, 'schoolRequests', editingRequest.id);
      await updateDoc(requestDocRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });

      setRequests(prev =>
        prev.map(req =>
          req.id === editingRequest.id ? { ...req, ...updatedData } : req
        )
      );

      // If details modal is open for the same request, update it
      if (selectedRequest?.id === editingRequest.id) {
        setSelectedRequest(prev => prev ? { ...prev, ...updatedData } : null);
      }

      setEditingRequest(null);
      alert('Talep başarıyla güncellendi.');
    } catch (err) {
      console.error('Talep güncellenirken hata:', err);
      alert('Talep güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk operation handlers
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length} adet talebi onaylamak istediğinize emin misiniz?`)) return;

    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      const req = requests.find(r => r.id === id);
      if (req) {
        try {
          await approveRequestSilent(req.id, req.userId);
          successCount++;
        } catch (err) {
          console.error(`Talep onaylanırken hata (ID: ${id}):`, err);
          failCount++;
        }
      }
    }

    setRequests(prev => prev.filter(req => !selectedIds.includes(req.id)));
    setSelectedIds([]);
    setIsBulkProcessing(false);
    alert(`${successCount} talep başarıyla onaylandı.${failCount > 0 ? ` ${failCount} talep onaylanamadı.` : ''}`);
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length} adet talebi reddetmek istediğinize emin misiniz?`)) return;

    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const requestDocRef = doc(db, 'schoolRequests', id);
        await updateDoc(requestDocRef, {
          status: 'rejected',
          updatedAt: serverTimestamp(),
          rejectedBy: 'admin'
        });
        successCount++;
      } catch (err) {
        console.error(`Talep reddedilirken hata (ID: ${id}):`, err);
        failCount++;
      }
    }

    setRequests(prev => prev.filter(req => !selectedIds.includes(req.id)));
    setSelectedIds([]);
    setIsBulkProcessing(false);
    alert(`${successCount} talep başarıyla reddedildi.${failCount > 0 ? ` ${failCount} talep reddedilemedi.` : ''}`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length} adet talebi kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      const req = requests.find(r => r.id === id);
      if (req) {
        try {
          await deleteDoc(doc(db, 'schoolRequests', id));
          
          const userDocRef = doc(db, 'users', req.userId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            await updateDoc(userDocRef, {
              schoolRequestId: null,
              is_school_pending: false,
              updatedAt: serverTimestamp()
            });
          }
          successCount++;
        } catch (err) {
          console.error(`Talep silinirken hata (ID: ${id}):`, err);
          failCount++;
        }
      }
    }

    setRequests(prev => prev.filter(req => !selectedIds.includes(req.id)));
    setSelectedIds([]);
    setIsBulkProcessing(false);
    alert(`${successCount} talep silindi ve kullanıcı bekleyen durumları temizlendi.${failCount > 0 ? ` ${failCount} talep silinemedi.` : ''}`);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (visibleRequests: SchoolRequest[]) => {
    if (selectedIds.length === visibleRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleRequests.map(r => r.id));
    }
  };

  // Filter and sort requests
  const filteredRequests = requests.filter(req => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const schoolName = (req.schoolName || '').toLowerCase();
    const contactPerson = (req.contactPerson || `${req.firstName || ''} ${req.lastName || ''}`).toLowerCase();
    const email = (req.contactEmail || req.userEmail || '').toLowerCase();
    const phone = (req.contactNumber || req.contactPhone || '').toLowerCase();
    const address = (req.address || req.schoolAddress || '').toLowerCase();

    return schoolName.includes(query) || contactPerson.includes(query) || email.includes(query) || phone.includes(query) || address.includes(query);
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      const dateA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : 0) || 0;
      const dateB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : 0) || 0;
      return dateB - dateA;
    } else if (sortBy === 'oldest') {
      const dateA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : 0) || 0;
      const dateB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : 0) || 0;
      return dateA - dateB;
    } else if (sortBy === 'name-asc') {
      const nameA = (a.schoolName || '').toLowerCase();
      const nameB = (b.schoolName || '').toLowerCase();
      return nameA.localeCompare(nameB, 'tr');
    } else if (sortBy === 'name-desc') {
      const nameA = (a.schoolName || '').toLowerCase();
      const nameB = (b.schoolName || '').toLowerCase();
      return nameB.localeCompare(nameA, 'tr');
    }
    return 0;
  });

  if (loading || isBulkProcessing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-700 dark:text-gray-300">
          {isBulkProcessing ? 'Toplu işlemler gerçekleştiriliyor...' : 'Yükleniyor...'}
        </span>
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Okul Başvuruları</h2>
          
          {/* Search and Sort Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Okul adı, yetkili, e-posta veya telefon ile ara..."
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-64"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="newest">En Yeni (Varsayılan)</option>
              <option value="oldest">En Eski</option>
              <option value="name-asc">Okul Adı (A-Z)</option>
              <option value="name-desc">Okul Adı (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Scrollable filter bar */}
        <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-hide">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => {
            const labels: Record<string, string> = {
              all: 'Tümü',
              pending: 'Bekleyen',
              approved: 'Onaylandı',
              rejected: 'Reddedildi'
            };
            const colors: Record<string, string> = {
              all: statusFilter === s ? 'bg-gray-700 text-white border-gray-700' : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700',
              pending: statusFilter === s ? 'bg-yellow-500 text-white border-yellow-500' : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
              approved: statusFilter === s ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-green-50 dark:hover:bg-green-900/20',
              rejected: statusFilter === s ? 'bg-red-600 text-white border-red-600' : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20',
            };
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${colors[s]}`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between gap-3 animate-fadeIn">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {selectedIds.length} adet talep seçildi
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkApprove}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition"
            >
              Toplu Onayla
            </button>
            <button
              onClick={handleBulkReject}
              className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-semibold rounded hover:bg-yellow-700 transition"
            >
              Toplu Reddet
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition"
            >
              Toplu Sil
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {sortedRequests.length === 0 && !loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Aradığınız kriterlerde okul başvurusu bulunmamaktadır.</p>
        </div>
      ) : null}

      <div className="-mx-4 sm:mx-0 overflow-hidden">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 sm:rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={sortedRequests.length > 0 && selectedIds.length === sortedRequests.length}
                      onChange={() => handleToggleSelectAll(sortedRequests)}
                      className="rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </th>
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
                {Array.isArray(sortedRequests) && sortedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(request.id)}
                        onChange={() => handleToggleSelect(request.id)}
                        className="rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Avatar
                            src={getMinioUrl(request.photoURL)}
                            alt={request.schoolName}
                            className="h-10 w-10 rounded-full"
                            userType="school"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.schoolName}
                            </span>
                            {request.type === 'activation' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                Aktivasyon
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                            {request.contactPerson || `${request.firstName || ''} ${request.lastName || ''}`.trim() || '-'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 md:hidden">
                            {request.contactEmail || request.userEmail}
                          </div>
                          {request.createdAt && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {(() => {
                                const d = (request.createdAt as any).toDate
                                  ? (request.createdAt as any).toDate()
                                  : new Date(request.createdAt as any);
                                return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                              })()}
                            </div>
                          )}
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-green-300">Reddedildi</span>
                      )}
                      {request.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Bekliyor</span>
                      )}
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium">
                        Belge ile
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-end items-center space-x-2">
                        {(request.idDocumentUrl || request.certDocumentUrl || request.schoolDocument || (request.documents && request.documents.length > 0)) && (
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
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(request.id, request.userId)}
                              disabled={processingId === request.id}
                              className="inline-flex items-center px-2.5 py-1.5 border border-green-300 dark:border-green-700 text-xs font-medium rounded text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/60 focus:outline-none disabled:opacity-50"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={processingId === request.id}
                              className="inline-flex items-center px-2.5 py-1.5 border border-red-300 dark:border-red-700 text-xs font-medium rounded text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/60 focus:outline-none disabled:opacity-50"
                            >
                              Reddet
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-slate-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none"
                        >
                          Detaylar
                        </button>
                        <button
                          onClick={() => setEditingRequest(request)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-yellow-300 dark:border-yellow-700 text-xs font-medium rounded text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/60 focus:outline-none"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request.id, request.userId)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-red-300 dark:border-red-700 text-xs font-medium rounded text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/60 focus:outline-none"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <Avatar src={getMinioUrl(contactRequest.photoURL)} alt={contactRequest.schoolName} className="h-12 w-12 rounded-full" userType="school" />
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
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Web Sitesi</p>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{contactRequest.website}</p>
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
          onEdit={() => setEditingRequest(selectedRequest)}
          onDelete={() => handleDeleteRequest(selectedRequest.id, selectedRequest.userId)}
          isProcessing={processingId === selectedRequest.id}
        />
      )}

      {/* Edit Modal */}
      {editingRequest && (
        <SchoolEditModal
          request={editingRequest}
          onClose={() => setEditingRequest(null)}
          onSave={handleSaveRequest}
          isProcessing={processingId === editingRequest.id}
        />
      )}
    </div>
  );
}

// School Details Modal
interface DetailsModalProps {
  request: SchoolRequest;
  onClose: () => void;
  onApprove: (id: string, userId: string) => void;
  onReject: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  isProcessing: boolean;
}

function SchoolDetailsModal({ request, onClose, onApprove, onReject, onEdit, onDelete, isProcessing }: DetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-slate-900 dark:opacity-90"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
            title="Kapat"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar
                    src={getMinioUrl(request.photoURL)}
                    alt={request.schoolName}
                    className="h-16 w-16 rounded-full"
                    userType="school"
                  />
                  <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white">
                    {request.schoolName}
                  </h3>
                </div>

                <div className="mt-2 space-y-4">
                  <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">İletişim Bilgileri</h4>
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
                          <span key={index} className="px-2 py-0.5 bg-rose-100 text-indigo-600 rounded text-xs">
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">Açıklama</span>
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{request.schoolDescription || request.description || 'Belirtilmemiş'}</p>
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
                    {(request.idDocumentUrl || request.certDocumentUrl || request.schoolDocument || (request.documents && request.documents.length > 0)) ? (
                      <div className="space-y-2">
                        {request.idDocumentUrl && (
                          <a
                            href={getMinioUrl(request.idDocumentUrl) || ''}
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
                            href={getMinioUrl(request.certDocumentUrl) || ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                          >
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 00.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Sertifika Belgesi</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Görüntülemek için tıklayın</p>
                            </div>
                          </a>
                        )}
                        {request.schoolDocument && (
                          <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-purple-50 dark:bg-purple-900/20">
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                              <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Okul Resmi Belgesi</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{request.schoolDocumentName || 'Belge yüklendi'}</p>
                            </div>
                            <a
                              href={getMinioUrl(request.schoolDocument) || ''}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-purple-600 dark:text-purple-400 hover:underline whitespace-nowrap"
                            >
                              Görüntüle →
                            </a>
                          </div>
                        )}
                        {(request.documents || []).map((docPath, idx) => (
                          <a
                            key={idx}
                            href={getMinioUrl(docPath) || ''}
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
              onClick={() => { onClose(); onEdit(); }}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-base font-medium focus:outline-none sm:w-auto sm:text-sm"
            >
              Düzenle
            </button>
            <button
              onClick={() => { onDelete(); }}
              className="w-full inline-flex justify-center rounded-md border border-red-300 dark:border-red-700 shadow-sm px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-base font-medium focus:outline-none sm:w-auto sm:text-sm"
            >
              Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// School Edit Modal
interface EditModalProps {
  request: SchoolRequest;
  onClose: () => void;
  onSave: (updatedData: Partial<SchoolRequest>) => void;
  isProcessing: boolean;
}

function SchoolEditModal({ request, onClose, onSave, isProcessing }: EditModalProps) {
  const [schoolName, setSchoolName] = useState(request.schoolName || '');
  const [schoolDescription, setSchoolDescription] = useState(request.schoolDescription || request.description || '');
  const [address, setAddress] = useState(request.address || request.schoolAddress || '');
  const [city, setCity] = useState(request.city || '');
  const [contactPerson, setContactPerson] = useState(request.contactPerson || '');
  const [contactEmail, setContactEmail] = useState(request.contactEmail || request.userEmail || '');
  const [contactPhone, setContactPhone] = useState(request.contactPhone || request.contactNumber || '');
  const [instagramHandle, setInstagramHandle] = useState(request.instagramHandle || '');
  const [website, setWebsite] = useState(request.website || '');
  const [establishedYear, setEstablishedYear] = useState(request.establishedYear || '');
  const [danceStylesInput, setDanceStylesInput] = useState((request.danceStyles || []).join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const danceStyles = danceStylesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onSave({
      schoolName,
      schoolDescription,
      description: schoolDescription, // Update alias too
      address,
      schoolAddress: address, // Update alias too
      city,
      contactPerson,
      contactEmail,
      contactPhone,
      contactNumber: contactPhone, // Update alias too
      instagramHandle,
      website,
      establishedYear,
      danceStyles
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-slate-900 dark:opacity-90"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white mb-4">
                Başvuruyu Düzenle
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Okul Adı</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Yetkili Kişi</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">E-posta</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Telefon</label>
                    <input
                      type="text"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Adres</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Şehir</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Instagram (@)</label>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="okulkullaniciadi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Kuruluş Yılı</label>
                    <input
                      type="text"
                      value={establishedYear}
                      onChange={(e) => setEstablishedYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Web Sitesi</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Dans Stilleri (Virgülle ayırın)</label>
                  <input
                    type="text"
                    value={danceStylesInput}
                    onChange={(e) => setDanceStylesInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Salsa, Bachata, Kizomba"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Okul Açıklaması</label>
                  <textarea
                    rows={4}
                    value={schoolDescription}
                    onChange={(e) => setSchoolDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SchoolRequests;