import React, { useEffect } from 'react';

interface SimpleModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    bodyClassName?: string;
    colorVariant?: 'school' | 'instructor' | 'admin' | 'default';
}

const SimpleModal: React.FC<SimpleModalProps> = ({
    open,
    onClose,
    title,
    children,
    actions,
    bodyClassName,
    colorVariant = 'default'
}) => {
    const getVariantColors = () => {
        switch (colorVariant) {
            case 'school':
                return {
                    border: 'border-school/30 dark:border-school/50',
                    headerBorder: 'border-school/10 dark:border-school/20',
                    focus: 'ring-school',
                    bg: 'bg-white dark:bg-[#1a120b]'
                };
            case 'instructor':
                return {
                    border: 'border-instructor/30 dark:border-instructor/50',
                    headerBorder: 'border-instructor/10 dark:border-instructor/20',
                    focus: 'ring-instructor',
                    bg: 'bg-white dark:bg-[#1a0b0b]'
                };
            case 'admin':
                return {
                    border: 'border-indigo-500/30 dark:border-indigo-500/50',
                    headerBorder: 'border-indigo-500/10 dark:border-indigo-500/20',
                    focus: 'ring-indigo-500',
                    bg: 'bg-white dark:bg-slate-900'
                };
            default:
                return {
                    border: 'border-gray-200 dark:border-slate-700',
                    headerBorder: 'border-gray-100 dark:border-slate-800',
                    focus: 'ring-gray-500',
                    bg: 'bg-white dark:bg-slate-900'
                };
        }
    };

    const variantColors = getVariantColors();
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    if (!open) return null;

    const containerClass = `${bodyClassName || variantColors.bg} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border ${variantColors.border}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className={containerClass}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${variantColors.headerBorder}`}>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5">
                    {children}
                </div>

                {/* Footer */}
                {actions && (
                    <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${variantColors.headerBorder}`}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimpleModal;
