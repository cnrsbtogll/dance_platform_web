import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy, 
  Timestamp, 
  deleteDoc, 
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from "../../../../api/firebase/firebase";
import { motion } from 'framer-motion';

interface ContactRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function ContactRequestsManagement(): JSX.Element {
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // İletişim taleplerini yükle
  useEffect(() => {
    fetchContactRequests();
  }, [selectedStatus]);

  // Firebase'den iletişim taleplerini çek
  const fetchContactRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const contactRequestsRef = collection(db, 'contactRequests');
      let q;
      
      if (selectedStatus === 'all') {
        q = query(contactRequestsRef, orderBy('createdAt', 'desc'));
      } else {
        q = query(
          contactRequestsRef, 
          where('status', '==', selectedStatus),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      const requests: ContactRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhoto: data.senderPhoto,
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          receiverPhoto: data.receiverPhoto,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      setContactRequests(requests);
    } catch (err) {
      console.error('İletişim talepleri yüklenirken hata oluştu:', err);
      setError('İletişim talepleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // İletişim talebinin durumunu güncelle
  const updateRequestStatus = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    setProcessingId(requestId);
    
    try {
      const requestRef = doc(db, 'contactRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (requestSnap.exists()) {
        // Talebin durumunu güncelle
        await updateDoc(requestRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
        
        // UI'ı güncelle
        setContactRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: newStatus } 
              : req
          )
        );
      } else {
        throw new Error('İletişim talebi bulunamadı');
      }
    } catch (err) {
      console.error('İletişim talebi güncellenirken hata:', err);
      setError('İletişim talebi güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setProcessingId(null);
    }
  };

  // İletişim talebini sil
  const deleteRequest = async (requestId: string) => {
    if (!window.confirm('Bu iletişim talebini silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setProcessingId(requestId);
    
    try {
      await deleteDoc(doc(db, 'contactRequests', requestId));
      
      // UI'dan kaldır
      setContactRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err) {
      console.error('İletişim talebi silinirken hata:', err);
      setError('İletişim talebi silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setProcessingId(null);
    }
  };

  // Duruma göre renk sınıfları
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Durumu Türkçe olarak göster
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'accepted':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  // Tarih formatı
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Bilinmiyor';
    
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">İletişim Talepleri</h2>
          <div className="flex items-center">
            <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
              Durum:
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink text-sm"
            >
              <option value="all">Tümü</option>
              <option value="pending">Beklemede</option>
              <option value="accepted">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
            <button 
              onClick={() => fetchContactRequests()}
              className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-brand-pink hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yenile
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-pink"></div>
            <span className="ml-3 text-lg text-gray-600">İletişim talepleri yükleniyor...</span>
          </div>
        ) : contactRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">İletişim talebi bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              Seçili durumda iletişim talebi bulunmuyor veya henüz hiç iletişim talebi gönderilmemiş.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gönderen
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alıcı
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contactRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={request.senderPhoto || "/assets/images/profile-placeholder.jpg"} 
                            alt={request.senderName} 
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/assets/images/profile-placeholder.jpg";
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.senderName}</div>
                          <div className="text-sm text-gray-500">ID: {request.senderId.substring(0, 6)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={request.receiverPhoto || "/assets/images/profile-placeholder.jpg"} 
                            alt={request.receiverName} 
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/assets/images/profile-placeholder.jpg";
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.receiverName}</div>
                          <div className="text-sm text-gray-500">ID: {request.receiverId.substring(0, 6)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateRequestStatus(request.id, 'accepted')}
                            disabled={processingId === request.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {processingId === request.id ? 'İşleniyor...' : 'Onayla'}
                          </button>
                          <button
                            onClick={() => updateRequestStatus(request.id, 'rejected')}
                            disabled={processingId === request.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {processingId === request.id ? 'İşleniyor...' : 'Reddet'}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => deleteRequest(request.id)}
                        disabled={processingId === request.id}
                        className="text-gray-600 hover:text-gray-900 ml-2 disabled:opacity-50"
                      >
                        {processingId === request.id ? 'İşleniyor...' : 'Sil'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default ContactRequestsManagement; 