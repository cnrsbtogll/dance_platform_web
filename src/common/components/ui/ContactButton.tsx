import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DanceClass } from '../../../types';

interface ContactButtonProps {
  course: DanceClass;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ContactModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  course: DanceClass;
}> = ({ isOpen, onClose, course }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-25" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900 mb-4"
              >
                {course.name} - İletişim Bilgileri
              </Dialog.Title>
              
              <div className="mt-2 space-y-4">
                {course.schoolName && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Dans Okulu</h4>
                    <p className="text-base text-gray-900">{course.schoolName}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Eğitmen</h4>
                  <p className="text-base text-gray-900">{course.instructorName}</p>
                </div>

                {course.phoneNumber && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Telefon</h4>
                    <a 
                      href={`tel:${course.phoneNumber}`}
                      className="text-base text-brand-pink hover:text-indigo-800"
                    >
                      {course.phoneNumber}
                    </a>
                  </div>
                )}

                {course.email && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">E-posta</h4>
                    <a 
                      href={`mailto:${course.email}?subject=${encodeURIComponent(`${course.name} Kursu Hakkında`)}`}
                      className="text-base text-brand-pink hover:text-indigo-800"
                    >
                      {course.email}
                    </a>
                  </div>
                )}

                {course.address && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Adres</h4>
                    <p className="text-base text-gray-900">{course.address}</p>
                  </div>
                )}

                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    * Lütfen iletişime geçerken bu kursun adını belirtmeyi unutmayın.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-rose-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2"
                  onClick={onClose}
                >
                  Kapat
                </button>
                {course.phoneNumber && (
                  <a
                    href={`tel:${course.phoneNumber}`}
                    className="inline-flex justify-center rounded-md border border-transparent bg-brand-pink px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2"
                  >
                    Hemen Ara
                  </a>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

const ContactButton: React.FC<ContactButtonProps> = ({
  course,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const baseStyles = "py-2 px-4 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink transition-colors duration-200";
  const variantStyles = {
    primary: "bg-brand-pink text-white hover:bg-rose-700 disabled:bg-gray-300 disabled:text-gray-500",
    secondary: "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
  };
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${className}`}
      >
        İletişime Geç
      </button>
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={course}
      />
    </>
  );
};

export default ContactButton; 