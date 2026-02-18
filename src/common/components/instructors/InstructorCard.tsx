import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instructor, UserWithProfile } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { ChatDialog } from '../../../features/chat/components/ChatDialog';
import LoginRequiredModal from '../modals/LoginRequiredModal';
import { generateInitialsAvatar } from '../../utils/imageUtils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

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
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    setIsChatOpen(true);
  };

  const CardContent = (
    <>
      <div className="h-64 relative overflow-hidden bg-gray-100 group">
        <img
          src={instructor.user.photoURL || generateInitialsAvatar(instructor.user.displayName || 'Eğitmen', 'instructor')}
          alt={instructor.user.displayName || "Eğitmen"}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = generateInitialsAvatar(instructor.user.displayName || 'Eğitmen', 'instructor');
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <span className="text-white font-medium text-sm">Profili Görüntüle</span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
              {instructor.user.displayName || "Eğitmen"}
            </h3>
            <p className="text-brand-primary font-medium text-sm">
              Dans Eğitmeni
            </p>
          </div>
          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-gray-700 font-bold text-sm">{(instructor.rating || 0).toFixed(1)}</span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap gap-1">
            {instructor.specialties && instructor.specialties.length > 0 ? (
              instructor.specialties.slice(0, 3).map((spec, i) => (
                <Badge key={i} variant="neutral" size="sm">{spec}</Badge>
              ))
            ) : (
              <Badge variant="neutral" size="sm">Çeşitli Stiller</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{instructor.experience || 0} Yıl</span> Deneyim
          </p>
        </div>

        <Button
          fullWidth
          size="sm"
          variant="primary"
          onClick={handleContactClick}
        >
          İletişime Geç
        </Button>
      </div>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Eğitmen ile iletişime geçmek için giriş yapmanız gerekmektedir."
      />

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

  if (showDetailLink) {
    return (
      <Link to={`/instructors/${instructor.id}`} className="block h-full">
        <Card noPadding hoverEffect className="h-full overflow-hidden flex flex-col justify-between">
          {CardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card noPadding className="h-full overflow-hidden flex flex-col justify-between">
      {CardContent}
    </Card>
  );
};

export default InstructorCard;