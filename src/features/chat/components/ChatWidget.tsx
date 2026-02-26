import React, { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { ChatList } from './ChatList';
import { ChatDialog } from './ChatDialog';
import { Link } from 'react-router-dom';
import { Transition } from '@headlessui/react';

// ChatPartner tipi, ChatDialog ile uyuşması için
interface ChatPartner {
    id: string;
    displayName: string;
    photoURL?: string;
    role?: 'student' | 'instructor' | 'school' | 'partner';
}

export const ChatWidget: React.FC = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState<ChatPartner | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Genel okunmamış mesajları dinle (widget kapalıyken bile rozet için)
    useEffect(() => {
        if (!currentUser) {
            setUnreadCount(0);
            return;
        }

        const unreadQuery = query(
            collection(db, 'messages'),
            where('receiverId', '==', currentUser.uid),
            where('viewed', '==', false)
        );

        const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
            setUnreadCount(snapshot.docs.length);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Yeni sohbet başlatmak için global event dinle (örneğin kurs detaydan tetiklenebilir)
    // Şimdilik sadece widget'ı yöneteceğiz

    return (
        <>
            {/* 1. Sağ Altta Sabit (Floating) Buton */}
            <div className="fixed bottom-6 right-6 z-[60]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 bg-brand-pink text-white rounded-full shadow-xl hover:bg-rose-700 transition-all transform hover:scale-105 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-rose-300"
                    aria-label="Sohbet"
                >
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    )}

                    {/* Badge: Okunmamış Mesaj */}
                    {!isOpen && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-bounce">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* 2. Chat Yan Paneli (Drawer) */}
            <Transition appear show={isOpen} as={Fragment}>
                <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10 pointer-events-none sm:pl-16">
                    <Transition.Child
                        as={Fragment}
                        enter="transform transition ease-in-out duration-300 sm:duration-400"
                        enterFrom="translate-x-full"
                        enterTo="translate-x-0"
                        leave="transform transition ease-in-out duration-300 sm:duration-400"
                        leaveFrom="translate-x-0"
                        leaveTo="translate-x-full"
                    >
                        <div className="w-screen max-w-sm pointer-events-auto h-full flex flex-col pt-4 pb-20 pr-4 drop-shadow-2xl">
                            <div className="flex h-full flex-col bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">

                                {/* Panel Başlığı */}
                                <div className="px-4 py-4 bg-rose-50 dark:bg-slate-800 border-b border-rose-100 dark:border-slate-700 flex items-center shadow-sm z-10">
                                    {activeChat && (
                                        <button
                                            onClick={() => setActiveChat(null)}
                                            className="mr-3 p-1.5 rounded-full hover:bg-rose-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                            aria-label="Geri"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    )}
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                        {activeChat ? activeChat.displayName : 'Sohbetlerim'}
                                    </h2>
                                </div>

                                {/* Panel İçeriği */}
                                <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-slate-900">
                                    {!currentUser ? (
                                        // Kullanıcı giriş yapmamışsa
                                        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                            <div className="w-16 h-16 bg-rose-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-8 h-8 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Giriş Yapmanız Kurallı</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                                Öğretmenler veya diğer dansçılar ile mesajlaşmak için platforma giriş yapmış olmalısınız.
                                            </p>
                                            <Link
                                                to="/signin"
                                                onClick={() => setIsOpen(false)}
                                                className="w-full bg-brand-pink text-white font-medium py-2.5 px-4 rounded-xl hover:bg-rose-700 transition-all text-sm text-center"
                                            >
                                                Giriş Yap
                                            </Link>
                                        </div>
                                    ) : (
                                        // Kullanıcı giriş yapmışsa
                                        <div className="h-full relative overflow-y-auto">
                                            {activeChat ? (
                                                <div className="absolute inset-0 h-full w-full">
                                                    {/* ChatDialog'un iç (inline) modunu kullan */}
                                                    <ChatDialog
                                                        open={true}
                                                        onClose={() => setActiveChat(null)}
                                                        partner={activeChat}
                                                        inline={true}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="p-2 h-full">
                                                    {/* ChatList komponentini liste modu için kullanıyoruz */}
                                                    <ChatList
                                                        onClose={() => setIsOpen(false)}
                                                        onChatSelect={(chat) => setActiveChat(chat as ChatPartner)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Transition>
        </>
    );
};
