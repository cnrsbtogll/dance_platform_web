import React, { useState, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { AddAPhoto, Edit, Check, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { generateInitialsAvatar } from '../../utils/imageUtils';
import { uploadToMinio as uploadToMinioService, generateObjectPath } from '../../../api/services/minioUploadService';

type UserType = 'school' | 'instructor' | 'student';

interface ImageUploaderProps {
  currentPhotoURL?: string;
  onImageChange: (imageUrl: string | null) => void;
  displayName?: string;
  userType?: UserType;
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  shape?: 'circle' | 'square';
  width?: number;
  height?: number;
  /** If true, upload image to MinIO S3 and pass the public URL to onImageChange */
  uploadToMinio?: boolean;
  /** MinIO object path prefix, e.g. "public/avatars/user123" */
  minioObjectPath?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentPhotoURL,
  onImageChange,
  displayName = '?',
  userType = 'student',
  maxSizeKB = 1024,
  maxWidth = 3840,
  maxHeight = 2160,
  shape = 'circle',
  width = 150,
  height = 150,
  uploadToMinio = false,
  minioObjectPath,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [resetState, setResetState] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when component unmounts or when reset is triggered
  React.useEffect(() => {
    if (resetState) {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
      setPreviewURL(null);
      setError(null);
      setUploadSuccess(false);
      setResetState(false);
    }
  }, [resetState, previewURL]);

  // Cleanup URLs on unmount
  React.useEffect(() => {
    return () => {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const validateImage = (file: File): { valid: boolean; error?: string } => {
    const FIRESTORE_DOC_SIZE_LIMIT = 1048487; // ~1MB Firestore document size limit

    // Convert size to MB for display
    const fileSizeMB = file.size / (1024 * 1024);
    const maxSizeMB = maxSizeKB / 1024;

    // Check file size for Firestore limit
    if (file.size > FIRESTORE_DOC_SIZE_LIMIT) {
      return {
        valid: false,
        error: `Fotoğraf boyutu Firestore limiti olan 1MB'ı aşıyor (Yüklenen: ${fileSizeMB.toFixed(2)}MB). Lütfen daha küçük bir fotoğraf seçin.`
      };
    }

    // Check file size for general limit
    if (file.size > maxSizeKB * 1024) {
      return {
        valid: false,
        error: `Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır. Yüklemeye çalıştığınız dosya: ${fileSizeMB.toFixed(2)}MB`
      };
    }

    return { valid: true };
  };

  const validateAndSetImage = (file: File) => {
    // First validate the image
    const validationResult = validateImage(file);
    if (!validationResult.valid) {
      setError(validationResult.error || 'Geçersiz dosya.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewURL(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const calculateBase64Size = (base64String: string): number => {
    // Remove data URI prefix and get only the base64 part
    const base64Data = base64String.split(',')[1] || base64String;
    return Math.ceil((base64Data.length * 3) / 4);
  };

  const compressImage = async (file: File): Promise<string> => {
    const FIRESTORE_LIMIT = 1000000; // Setting slightly below actual limit for safety
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = async () => {
          let currentWidth = img.width;
          let currentHeight = img.height;

          // Initial scaling based on max dimensions
          if (currentWidth > maxWidth || currentHeight > maxHeight) {
            const scale = Math.min(maxWidth / currentWidth, maxHeight / currentHeight);
            currentWidth = Math.floor(currentWidth * scale);
            currentHeight = Math.floor(currentHeight * scale);
          }

          const compress = async (width: number, height: number, quality: number): Promise<string> => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');
            
            ctx.drawImage(img, 0, 0, width, height);
            return canvas.toDataURL('image/jpeg', quality);
          };

          // Progressive compression strategy
          const compressionSteps = [
            { scale: 1, quality: 0.7 },
            { scale: 1, quality: 0.5 },
            { scale: 0.8, quality: 0.4 },
            { scale: 0.6, quality: 0.3 },
            { scale: 0.4, quality: 0.3 },
            { scale: 0.2, quality: 0.3 }
          ];

          for (const step of compressionSteps) {
            const stepWidth = Math.floor(currentWidth * step.scale);
            const stepHeight = Math.floor(currentHeight * step.scale);
            
            try {
              const base64 = await compress(stepWidth, stepHeight, step.quality);
              const size = calculateBase64Size(base64);
              
              if (size <= FIRESTORE_LIMIT) {
                resolve(base64);
                return;
              }
            } catch (err) {
              console.error('Compression step failed:', err);
            }
          }

          // If all steps fail, try one last time with minimum settings
          try {
            const finalWidth = Math.min(800, currentWidth);
            const finalHeight = Math.floor((finalWidth * currentHeight) / currentWidth);
            const base64 = await compress(finalWidth, finalHeight, 0.1);
            const size = calculateBase64Size(base64);
            
            if (size <= FIRESTORE_LIMIT) {
              resolve(base64);
              return;
            }
          } catch (err) {
            console.error('Final compression attempt failed:', err);
          }

          reject(new Error('Görüntü boyutu Firestore limitine uygun şekilde sıkıştırılamadı. Lütfen daha küçük bir görüntü seçin.'));
        };

        img.onerror = () => {
          reject(new Error('Görüntü yüklenirken hata oluştu'));
        };
      };

      reader.onerror = () => {
        reject(new Error('Dosya okunamadı'));
      };
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      if (!file.type.startsWith('image/')) {
        setError('Lütfen geçerli bir görüntü dosyası seçin.');
        return;
      }

      if (uploadToMinio) {
        // MinIO mode: just show a preview via object URL, don't compress to base64
        const objectUrl = URL.createObjectURL(file);
        setPreviewURL(objectUrl);
        setSelectedFile(file);
      } else {
        // Firestore/base64 mode (legacy)
        const compressedBase64 = await compressImage(file);
        const finalSize = calculateBase64Size(compressedBase64);

        if (finalSize > 1000000) {
          setError('Görüntü boyutu çok büyük. Lütfen daha küçük bir görüntü seçin.');
          return;
        }

        setPreviewURL(compressedBase64);
      }

      setError(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fotoğraf yüklenirken bir hata oluştu.';
      setError(errorMessage);
      console.error('Fotoğraf yükleme hatası:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetImage(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmUpload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!previewURL) return;

    if (uploadToMinio && selectedFile) {
      // Upload to MinIO S3
      try {
        setIsUploading(true);
        setError(null);

        const objectPath = minioObjectPath
          ? `${minioObjectPath}/${Date.now()}.jpg`
          : generateObjectPath('public/avatars', 'unknown');

        const { publicUrl } = await uploadToMinioService(selectedFile, objectPath);
        onImageChange(publicUrl);
        setUploadSuccess(true);
        setSelectedFile(null);
        setTimeout(() => {
          setUploadSuccess(false);
          setResetState(true);
        }, 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'MinIO yükleme hatası';
        setError(errorMessage);
        console.error('MinIO upload error:', err);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Legacy base64 mode
      onImageChange(previewURL);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setResetState(true);
      }, 2000);
    }
  };

  const cancelUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (previewURL && previewURL.startsWith('blob:')) {
      URL.revokeObjectURL(previewURL);
    }
    setPreviewURL(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveCurrentPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    onImageChange(null);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!previewURL) {
      triggerFileSelect();
    }
  };

  // Get the current display image
  const getDisplayImage = () => {
    if (previewURL) return previewURL;
    if (currentPhotoURL) return currentPhotoURL;
    return generateInitialsAvatar(displayName, userType);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
    >
      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <Box
        component={motion.div}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        sx={{ 
          position: 'relative',
          mb: 2
        }}
      >
        {/* Edit button overlay */}
        {!previewURL && currentPhotoURL && (
          <IconButton 
            size="small"
            onClick={triggerFileSelect}
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              position: 'absolute',
              right: -8,
              bottom: -8,
              backgroundColor: '#8B5CF6',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              border: '2px solid white',
              zIndex: 2,
              padding: '8px',
              '&:hover': {
                backgroundColor: '#7C3AED',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(139, 92, 246, 0.5)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <Edit sx={{ fontSize: 16 }} />
          </IconButton>
        )}

        <Box
          onClick={handleImageClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          sx={{
            position: 'relative',
            width: width,
            height: height,
            borderRadius: shape === 'circle' ? '50%' : '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '2px dashed #8B5CF6',
            background: 'linear-gradient(45deg, #F5F3FF 0%, #EEF2FF 100%)',
            boxShadow: '0 8px 24px rgba(149, 157, 165, 0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              borderColor: '#7C3AED',
              boxShadow: '0 12px 28px rgba(139, 92, 246, 0.15)',
              transform: 'translateY(-2px)',
              '& .overlay': {
                opacity: 1
              }
            },
            '&:active': {
              transform: 'translateY(0px)'
            }
          }}
        >
          {/* Background image */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#EEF2FF',
              backgroundImage: `url(${getDisplayImage()})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          />

          {/* Gradient overlay on hover */}
          {!previewURL && !currentPhotoURL && (
            <Box
              component={motion.div}
              className="overlay"
              initial={{ opacity: 0 }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.2) 100%)',
                backdropFilter: 'blur(4px)',
                opacity: 0,
                transition: 'all 0.3s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              <AddAPhoto sx={{ color: '#8B5CF6', fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
            </Box>
          )}

          {/* Upload success animation */}
          {uploadSuccess && (
            <Box
              component={motion.div}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: shape === 'circle' ? '50%' : '12px',
              }}
            >
              <Check sx={{ color: 'white', fontSize: 40, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
            </Box>
          )}
        </Box>

        {/* Action buttons for preview */}
        {previewURL && (
          <Box 
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5))',
              backdropFilter: 'blur(4px)',
              borderRadius: shape === 'circle' ? '50%' : '12px',
              padding: 2,
              zIndex: 1
            }}
          >
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <IconButton 
                size="small"
                onClick={handleConfirmUpload}
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                sx={{
                  backgroundColor: '#8B5CF6',
                  color: 'white',
                  padding: '8px',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Check sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton 
                size="small"
                onClick={cancelUpload}
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                sx={{
                  backgroundColor: '#EF4444',
                  color: 'white',
                  padding: '8px',
                  '&:hover': {
                    backgroundColor: '#DC2626',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Close sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Helper text */}
      {!previewURL && !currentPhotoURL && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: 1,
            textAlign: 'center',
            fontWeight: 500,
            color: '#6B7280',
            fontSize: '0.875rem',
            letterSpacing: '0.01em'
          }}
        >
          Fotoğraf yüklemek için tıklayın veya sürükleyip bırakın
        </Typography>
      )}

      {/* Loading indicator */}
      {isUploading && (
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 1,
            textAlign: 'center',
            color: '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            backgroundColor: '#F5F3FF',
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}
        >
          <Box
            component="span"
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              animation: 'pulse 1s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.4, transform: 'scale(0.8)' },
                '50%': { opacity: 1, transform: 'scale(1.2)' },
                '100%': { opacity: 0.4, transform: 'scale(0.8)' },
              }
            }}
          />
          Fotoğraf yükleniyor...
        </Typography>
      )}

      {/* Error message */}
      {error && (
        <Typography 
          component={motion.p}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          color="error" 
          variant="caption" 
          sx={{ 
            mt: 1, 
            textAlign: 'center', 
            maxWidth: 250,
            backgroundColor: '#FEF2F2',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '0.875rem',
            lineHeight: 1.4,
            color: '#DC2626',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader; 