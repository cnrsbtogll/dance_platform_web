import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDoc, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date | any;
  read?: boolean;
  viewed: boolean;
  participants: string[];
  metadata?: {
    senderName?: string;
    receiverName?: string;
    chatType?: 'student-instructor' | 'student-school' | 'instructor-school' | 'partner-partner';
  };
}

interface ChatPartner {
  id: string;
  displayName: string;
  photoURL?: string;
  role?: 'student' | 'instructor' | 'school' | 'partner';
  type?: 'student-instructor' | 'student-school' | 'instructor-school' | 'partner-partner';
}

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  partner: ChatPartner;
  chatType?: 'student-instructor' | 'student-school' | 'instructor-school' | 'partner-partner';
}

export const ChatDialog: React.FC<ChatDialogProps> = ({
  open,
  onClose,
  partner,
  chatType = 'student-instructor'
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Mesajları görüntülendi olarak işaretle
  const markMessagesAsViewed = async () => {
    if (!currentUser || !partner.id) return;

    try {
      const q = query(
        collection(db, 'messages'),
        where('receiverId', '==', currentUser.uid),
        where('senderId', '==', partner.id),
        where('viewed', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { viewed: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as viewed:', error);
    }
  };

  // Dialog açıldığında ve kapandığında mesajları görüntülendi olarak işaretle
  useEffect(() => {
    if (open) {
      markMessagesAsViewed();
    }
  }, [open, currentUser, partner.id]);

  // Dialog kapatılırken de mesajları görüntülendi olarak işaretle
  const handleClose = () => {
    markMessagesAsViewed().then(() => {
      onClose();
    });
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // Fetch current user's role
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      if (!currentUser?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = Array.isArray(userData.role) ? userData.role[0] : userData.role;
          setCurrentUserRole(role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchCurrentUserRole();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!open || !currentUser || !partner.id) return;

    // Tek bir sorgu ile tüm mesajları al
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const processedMessageIds = new Set<string>();
      const newMessages: Message[] = [];
      const messagesToUpdate: string[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Sadece bu sohbete ait mesajları filtrele
        if (!processedMessageIds.has(doc.id) &&
          ((data.senderId === currentUser.uid && data.receiverId === partner.id) ||
            (data.senderId === partner.id && data.receiverId === currentUser.uid))) {

          processedMessageIds.add(doc.id);

          // Eğer mesaj bize geldiyse ve görüntülenmemişse, güncelleme listesine ekle
          if (data.senderId === partner.id && data.receiverId === currentUser.uid && !data.viewed) {
            messagesToUpdate.push(doc.id);
          }

          const timestamp = data.timestamp?.toDate?.() ||
            (data.timestamp instanceof Date ? data.timestamp : new Date(data.timestamp)) ||
            new Date();

          newMessages.push({
            id: doc.id,
            ...data,
            timestamp
          } as Message);
        }
      });

      // Görüntülenmemiş mesajları batch update ile güncelle
      if (messagesToUpdate.length > 0) {
        console.log('Görüntülenecek mesajlar:', messagesToUpdate.length);
        const batch = writeBatch(db);
        messagesToUpdate.forEach((messageId) => {
          const messageRef = doc(db, 'messages', messageId);
          batch.update(messageRef, { viewed: true });
        });
        await batch.commit();
        console.log('Mesajlar görüntülendi olarak işaretlendi');
      }

      // Mesajları tarihe göre sırala
      const sortedMessages = newMessages.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || a.timestamp || new Date(0);
        const timeB = b.timestamp?.toDate?.() || b.timestamp || new Date(0);
        return (timeA instanceof Date ? timeA : new Date(timeA)).getTime() -
          (timeB instanceof Date ? timeB : new Date(timeB)).getTime();
      });

      setMessages(sortedMessages);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [open, currentUser, partner.id]);

  // Mesaj gönderildikten sonra input'a focus ol
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || loading) return;

    setLoading(true);
    try {
      const messageData = {
        content: newMessage.trim(),
        senderId: currentUser.uid,
        receiverId: partner.id,
        timestamp: serverTimestamp(),
        viewed: false,
        participants: [currentUser.uid, partner.id].sort(),
        metadata: {
          senderName: currentUser.displayName || undefined,
          receiverName: partner.displayName,
          chatType: chatType
        }
      };

      await addDoc(collection(db, 'messages'), messageData);
      setNewMessage('');
      inputRef.current?.focus();

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'student':
        return 'Öğrenci';
      case 'instructor':
        return 'Eğitmen';
      case 'school':
        return 'Dans Okulu';
      case 'partner':
        return 'Dans Partneri';
      default:
        return '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: 'dark:bg-slate-800 dark:ring-1 dark:ring-white/10'
      }}
    >
      <DialogTitle className="flex justify-between items-center bg-rose-50 dark:bg-slate-800 border-b border-rose-100 dark:border-slate-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
            <img
              src={partner.photoURL || '/assets/images/default-avatar.png'}
              alt={partner.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-semibold block text-slate-900 dark:text-white">{partner.displayName}</span>
            {partner.role && (
              <span className="text-xs text-gray-600 dark:text-gray-400">{getRoleLabel(partner.role)}</span>
            )}
          </div>
        </div>
        <IconButton onClick={handleClose} size="small" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </IconButton>
      </DialogTitle>

      <DialogContent className="flex flex-col h-[500px] p-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-3 flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
            >
              {message.senderId !== currentUser?.uid && (
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                  <img
                    src={partner.photoURL || '/assets/images/default-avatar.png'}
                    alt={partner.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div
                className={`relative max-w-[70%] rounded-2xl px-4 py-2 ${message.senderId === currentUser?.uid
                    ? 'bg-brand-pink text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                  }`}
              >
                <p className="text-sm break-words">{message.content}</p>
                <span
                  className={`text-[11px] block mt-1 ${message.senderId === currentUser?.uid
                      ? 'text-rose-100'
                      : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                  {message.timestamp instanceof Date
                    ? message.timestamp.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    : new Date().toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
          <div className="flex gap-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-pink text-sm"
              disabled={loading}
              ref={inputRef}
            />
            <button
              type="submit"
              className="min-w-[40px] h-[34px] whitespace-nowrap bg-brand-pink text-white px-2 sm:px-4 rounded-full hover:bg-rose-700 transition-colors disabled:opacity-50 text-sm flex items-center justify-center"
              disabled={loading || !newMessage.trim()}
            >
              <span className="hidden sm:inline">Gönder</span>
              <span className="sm:hidden">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 