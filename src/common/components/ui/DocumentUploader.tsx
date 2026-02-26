import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentUploaderProps {
    label: string;
    description?: string;
    icon?: React.ReactNode;
    value: DocumentFile | null;
    onChange: (file: DocumentFile | null) => void;
    accept?: string;
    maxSizeMB?: number;
    required?: boolean;
    error?: string;
}

export interface DocumentFile {
    name: string;
    type: string;
    base64: string;
    sizeKB: number;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
    label,
    description,
    icon,
    value,
    onChange,
    accept = 'image/*,application/pdf',
    maxSizeMB = 5,
    required = false,
    error,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
        setLocalError(null);

        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';

        if (!isImage && !isPDF) {
            setLocalError('Lütfen resim (JPG, PNG) veya PDF dosyası seçin.');
            return;
        }

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            setLocalError(`Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır. (${sizeMB.toFixed(2)}MB)`);
            return;
        }

        setIsLoading(true);

        const reader = new FileReader();
        reader.onload = () => {
            onChange({
                name: file.name,
                type: file.type,
                base64: reader.result as string,
                sizeKB: Math.round(file.size / 1024),
            });
            setIsLoading(false);
        };
        reader.onerror = () => {
            setLocalError('Dosya okunamadı. Lütfen tekrar deneyin.');
            setIsLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setLocalError(null);
    };

    const displayError = error || localError;
    const isImage = value?.type.startsWith('image/');

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <AnimatePresence mode="wait">
                {value ? (
                    /* ─── Yüklenmiş belge önizlemesi ─── */
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="relative rounded-xl border-2 border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20 overflow-hidden"
                    >
                        {isImage ? (
                            <div className="relative h-40 w-full">
                                <img
                                    src={value.base64}
                                    alt={value.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-white text-xs font-medium truncate">{value.name}</p>
                                    <p className="text-green-300 text-xs">{value.sizeKB} KB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4">
                                {/* PDF icon */}
                                <div className="flex-shrink-0 w-12 h-14 bg-red-100 dark:bg-red-900/40 rounded-lg flex flex-col items-center justify-center border border-red-200 dark:border-red-700">
                                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 15.5h1.25v-1.75H11a1.25 1.25 0 000-2.5H8.5v4.25zm1.25-3h1.25a.25.25 0 010 .5H9.75v-.5zm3.5 3h1.5a1.75 1.75 0 000-3.5H13.25v3.5zm1.25-2.5a.75.75 0 010 1.5H14.5v-1.5h.5zm2.25 2.5h1.25v-1.5H18v-.5h1.25v-.75H17.75v2.75z" />
                                    </svg>
                                    <span className="text-red-500 text-[9px] font-bold mt-0.5">PDF</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{value.sizeKB} KB · PDF Belgesi</p>
                                    <div className="flex items-center gap-1 mt-1.5">
                                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Yüklendi</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Değiştir / Kaldır butonları */}
                        <div className="absolute top-2 right-2 flex gap-1.5">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => inputRef.current?.click()}
                                className="bg-white/90 dark:bg-slate-700/90 text-gray-700 dark:text-gray-200 rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-white dark:hover:bg-slate-600 transition-colors"
                            >
                                Değiştir
                            </motion.button>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRemove}
                                className="bg-red-500/90 text-white rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-red-600 transition-colors"
                            >
                                Kaldır
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    /* ─── Yükleme alanı ─── */
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => inputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`
              relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-5
              flex flex-col items-center justify-center gap-2 min-h-[120px]
              ${isDragging
                                ? 'border-instructor bg-instructor/5 scale-[1.01]'
                                : displayError
                                    ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                                    : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50 hover:border-instructor hover:bg-instructor/5'
                            }
            `}
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-instructor" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">Yükleniyor...</span>
                            </div>
                        ) : (
                            <>
                                {/* İkon */}
                                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200
                  ${isDragging ? 'bg-instructor/20' : 'bg-gray-100 dark:bg-slate-700'}
                `}>
                                    {icon || (
                                        <svg className={`w-6 h-6 ${isDragging ? 'text-instructor' : 'text-gray-400 dark:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    )}
                                </div>

                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <span className="text-instructor">Dosya seçin</span> veya sürükleyip bırakın
                                    </p>
                                    {description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                                    )}
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        JPG, PNG, PDF · Maks. {maxSizeMB}MB
                                    </p>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hata mesajı */}
            <AnimatePresence>
                {displayError && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                    >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {displayError}
                    </motion.p>
                )}
            </AnimatePresence>

            <input
                ref={inputRef}
                type="file"
                hidden
                accept={accept}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default DocumentUploader;
