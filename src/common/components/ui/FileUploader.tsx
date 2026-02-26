import React, { useState, useRef } from 'react';
import { Box, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    Description as FileIcon,
    Delete as DeleteIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
    label: string;
    helperText?: string;
    onFileChange: (base64: string | null, fileName: string | null) => void;
    accept?: string;
    maxSizeMB?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({
    label,
    helperText,
    onFileChange,
    accept = "image/*,application/pdf",
    maxSizeMB = 5
}) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [base64, setBase64] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır.`);
            return;
        }

        try {
            setIsUploading(true);
            setError(null);

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setBase64(result);
                setFileName(file.name);
                onFileChange(result, file.name);
                setIsUploading(false);
            };
            reader.onerror = () => {
                setError("Dosya okunurken bir hata oluştu.");
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError("Dosya yüklenirken bir hata oluştu.");
            setIsUploading(false);
        }
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFileName(null);
        setBase64(null);
        setError(null);
        onFileChange(null, null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Box sx={{ width: '100%', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                {label}
            </Typography>

            <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    border: '2px dashed',
                    borderColor: error ? 'error.main' : (fileName ? 'success.main' : 'divider'),
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <input
                    type="file"
                    hidden
                    ref={fileInputRef}
                    accept={accept}
                    onChange={handleFileChange}
                />

                {isUploading ? (
                    <CircularProgress size={24} sx={{ color: 'primary.main' }} />
                ) : fileName ? (
                    <>
                        <SuccessIcon color="success" sx={{ fontSize: 40 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 500, maxWidth: 250 }}>
                                {fileName}
                            </Typography>
                            <IconButton size="small" onClick={removeFile} sx={{ color: 'error.main' }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </>
                ) : (
                    <>
                        <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                            Tıklayın veya dosyanızı buraya sürükleyin
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            {accept.includes('pdf') ? 'PDF veya Görsel (Max ' : 'Görsel (Max '}{maxSizeMB}MB)
                        </Typography>
                    </>
                )}
            </Box>

            {helperText && !error && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.disabled' }}>
                    {helperText}
                </Typography>
            )}

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Typography variant="caption" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
                            <ErrorIcon fontSize="inherit" /> {error}
                        </Typography>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default FileUploader;
