import { ChangeEvent } from 'react';
import { TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '../../../contexts/ThemeContext';

export interface CustomInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => void;
  type?: 'text' | 'email' | 'password' | 'checkbox' | 'number' | 'time';
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  colorVariant?: 'default' | 'school' | 'instructor';
  startIcon?: React.ReactNode;
  autoComplete?: string;
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
  colorVariant = 'default',
  startIcon,
  autoComplete,
}) => {
  const { isDark } = useTheme();

  const isSchool = colorVariant === 'school';
  const bg = isDark ? (isSchool ? '#231810' : '#1e293b') : '#ffffff';
  const textColor = isDark ? (isSchool ? '#ffffff' : '#f1f5f9') : '#111827';
  const labelColor = isDark ? (isSchool ? '#cba990' : '#94a3b8') : '#6B7280';
  const borderColor = isDark ? (isSchool ? '#493322' : '#475569') : '#E5E7EB';
  const borderHover = isDark ? (isSchool ? '#cba990' : '#64748b') : '#9CA3AF';
  const borderFocus = isDark ? (isSchool ? '#b45309' : '#a78bfa') : (isSchool ? '#b45309' : '#7c3aed');
  const disabledBg = isDark ? (isSchool ? '#1a120b' : '#0f172a') : '#f9fafb';
  const disabledText = isDark ? (isSchool ? '#8e715b' : '#64748b') : '#9CA3AF';

  return (
    <TextField
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
      autoComplete={autoComplete}
      sx={{
        margin: 0,
        '& .MuiOutlinedInput-root': {
          minHeight: '45px',
          margin: 0,
          backgroundColor: disabled ? disabledBg : bg,
          borderRadius: '0.375rem',
          '&.MuiInputBase-multiline': {
            height: 'auto',
            minHeight: '45px',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: borderHover,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: borderFocus,
          },
          '&.Mui-disabled': {
            backgroundColor: disabledBg,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? (isSchool ? '#2a1d13' : '#334155') : '#E5E7EB',
            },
          },
        },
        '& .MuiOutlinedInput-input': {
          padding: startIcon ? '10.5px 14px 10.5px 4px' : '10.5px 14px',
          height: 'auto',
          minHeight: '21px',
          boxSizing: 'border-box',
          color: disabled ? disabledText : textColor,
          '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
          '&.Mui-disabled': {
            WebkitTextFillColor: disabledText,
          },
        },
        '& .MuiInputAdornment-root': {
          color: labelColor,
          marginRight: 0,
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem',
          }
        },
        '& .MuiInputLabel-root': {
          color: labelColor,
          transform: 'translate(14px, 16px) scale(1)',
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
            backgroundColor: disabled ? disabledBg : bg,
            paddingX: '4px',
          },
          '&.Mui-focused': {
            color: borderFocus,
          },
          '&.Mui-disabled': {
            color: disabledText,
          },
        },
        '& .MuiInputLabel-outlined': {
          transform: startIcon ? 'translate(40px, 16px) scale(1)' : 'translate(14px, 16px) scale(1)',
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
          },
        },
        '& .MuiFormControl-root': {
          marginTop: 0,
          marginBottom: 0,
        },
        '& .MuiFormLabel-root': {
          lineHeight: '1',
          marginTop: '-3px',
        },
        '& .MuiFormHelperText-root': {
          color: error ? '#f87171' : (isDark ? (isSchool ? '#cba990' : '#94a3b8') : '#6B7280'),
        },
      }}
      InputProps={{
        startAdornment: startIcon ? (
          <div className="flex items-center pl-3 pr-1 text-gray-400">
            {startIcon}
          </div>
        ) : null,
      }}
    />
  );
};

export default CustomInput;