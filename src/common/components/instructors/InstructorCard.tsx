import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instructor, UserWithProfile } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { ChatDialog } from '../../../features/chat/components/ChatDialog';
import LoginRequiredModal from '../modals/LoginRequiredModal';
import { generateInitialsAvatar } from '../../utils/imageUtils';

interface InstructorWithUser extends Instructor {
  user: UserWithProfile;
}

interface InstructorCardProps {
  instructor: InstructorWithUser;
  index?: number;
  showDetailLink?: boolean;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ 
  instructor, 
  index = 0,
  showDetailLink = true 
}) => {
  const { currentUser } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card link click
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    setIsChatOpen(true);
  };

  // Kart içeriği
  const cardContent = (
    <>
      <div className="h-64 bg-gray-200 relative overflow-hidden">
        <img
          src={instructor.user.photoURL || generateInitialsAvatar(instructor.user.displayName || 'Eğitmen', 'instructor')}
          alt={instructor.user.displayName || "Eğitmen"}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          style={{ objectPosition: 'center top' }}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = generateInitialsAvatar(instructor.user.displayName || 'Eğitmen', 'instructor');
          }}
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-800">
          {instructor.user.displayName || "Eğitmen"}
        </h3>
        <p className="text-brand-pink font-medium mb-1">
          Dans Eğitmeni
        </p>
        <div className="flex items-center mb-2">
          <span className="text-yellow-400 mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          <span className="text-gray-600">{(instructor.rating || 0).toFixed(1)}</span>
          <span className="text-gray-400 text-sm ml-1">({instructor.reviewCount || 0} değerlendirme)</span>
        </div>
        <div className="text-sm text-gray-500">
          <p><span className="font-medium">Tecrübe:</span> {instructor.experience || 0} yıl</p>
          <p><span className="font-medium">Uzmanlık:</span> {
            instructor.specialties && instructor.specialties.length > 0 
              ? instructor.specialties.join(', ') 
              : "Çeşitli Dans Stilleri"
          }</p>
        </div>
        <div className="mt-4">
          <button
            onClick={handleContactClick}
            className="w-full bg-brand-pink text-white py-2 px-4 rounded-md hover:bg-rose-700 transition"
          >
            İletişime Geç
          </button>
        </div>
      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Eğitmen ile iletişime geçmek için giriş yapmanız gerekmektedir."
      />

      {/* Chat Dialog */}
      <ChatDialog
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        partner={{
          id: instructor.id,
          displayName: instructor.user.displayName,
          photoURL: instructor.user.photoURL,
          role: 'instructor'
        }}
        chatType="student-instructor"
      />
    </>
  );

  // Eğer showDetailLink true ise, kartı link olarak göster
  if (showDetailLink) {
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        <Link
          to={`/instructors/${instructor.id}`}
          className="block"
        >
          {cardContent}
        </Link>
      </div>
    );
  }

  // Link olmayan versiyon
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {cardContent}
    </div>
  );
};

export default InstructorCard; 