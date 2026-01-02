import { ChangeEvent } from 'react';
import { TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

// Özel stil tanımlaması
const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    minHeight: '45px',
    margin: 0,
    '&.MuiInputBase-multiline': {
      height: 'auto',
      minHeight: '45px'
    }
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
  '& .MuiInputLabel-outlined': {
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
    borderColor: '#6366F1'
  },
  '& .MuiFormControl-root': {
    marginTop: 0,
    marginBottom: 0
  },
  margin: 0,
  '& .MuiFormLabel-root': {
    lineHeight: '1',
    marginTop: '-3px'
  }
});

export interface CustomInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => void;
  type?: 'text' | 'email' | 'password' | 'checkbox';
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  name,
  label,
  value,
  onChange,
  type = 'text',
  error = false,
  helperText,
  fullWidth = true,
  multiline = false,
  rows,
  placeholder,
  className,
  required = false,
  disabled = false,
}) => {
  return (
    <StyledTextField
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      type={type}
      error={error}
      helperText={helperText}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      placeholder={placeholder}
      variant="outlined"
      size="small"
      className={className}
      required={required}
      disabled={disabled}
      margin="none"
    />
  );
};

export default CustomInput; 