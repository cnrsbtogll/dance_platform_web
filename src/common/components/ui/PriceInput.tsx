import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    minHeight: '45px',
    margin: 0,
  },
  '& .MuiOutlinedInput-input': {
    padding: '10.5px 14px',
    height: 'auto',
    minHeight: '21px',
    boxSizing: 'border-box',
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    }
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 16px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)'
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#E5E7EB'
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#9CA3AF'
  },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#111827'
  }
});

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder = '0.00',
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Sadece sayılar ve nokta karakterine izin ver
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      onChange(value);
    }
  };

  const formatPrice = (value: string) => {
    if (!value) return '';
    const number = parseFloat(value);
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(number);
  };

  return (
    <div className="flex flex-col gap-2">
      <StyledTextField
        label={label}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        error={!!error}
        helperText={error || (value && formatPrice(value))}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">₺</InputAdornment>
          ),
        }}
        size="small"
      />
    </div>
  );
}; 