import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  name: string;
  value: string | string[];
  options: Option[];
  onChange: (value: string | string[]) => void;
  error?: string;
  multiple?: boolean;
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  allowEmpty?: boolean;
  colorVariant?: 'default' | 'school' | 'instructor';
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  name,
  value,
  options,
  onChange,
  error,
  multiple = false,
  required = false,
  placeholder,
  fullWidth = true,
  allowEmpty = true,
  colorVariant = 'default',
}) => {
  const { isDark } = useTheme();

  const isSchool = colorVariant === 'school';
  const bg = isDark ? (isSchool ? '#231810' : '#1e293b') : '#ffffff';
  const bgHover = isDark ? (isSchool ? '#493322' : '#334155') : '#f9fafb';
  const textColor = isDark ? (isSchool ? '#ffffff' : '#f1f5f9') : '#111827';
  const labelColor = isDark ? (isSchool ? '#cba990' : '#94a3b8') : '#6B7280';
  const borderColor = isDark ? (isSchool ? '#493322' : '#475569') : '#E5E7EB';
  const borderHover = isDark ? (isSchool ? '#cba990' : '#64748b') : '#9CA3AF';
  const borderFocus = isDark ? (isSchool ? '#b45309' : '#a78bfa') : (isSchool ? '#b45309' : '#7c3aed');
  const placeholderColor = isDark ? (isSchool ? '#8e715b' : '#64748b') : '#9CA3AF';
  const selectedBg = isDark ? (isSchool ? '#493322' : '#334155') : '#f5f3ff';
  const selectedHoverBg = isDark ? (isSchool ? '#493322' : '#475569') : '#ede9fe';

  const handleChange = (event: any) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      error={!!error}
      required={required}
      sx={{
        minWidth: 120,
        margin: 0,
        '& .MuiInputBase-root': {
          height: '45px'
        }
      }}
    >
      <InputLabel
        id={`${name}-label`}
        sx={{
          backgroundColor: bg,
          color: labelColor,
          px: 1,
          transform: 'translate(14px, -9px) scale(0.75)',
          '&.MuiInputLabel-shrink': {
            backgroundColor: bg,
            color: labelColor,
            transform: 'translate(14px, -9px) scale(0.75)'
          },
          '&.Mui-focused': {
            color: borderFocus,
          }
        }}
        shrink={true}
      >
        {label}
      </InputLabel>
      <Select
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={value}
        label={label}
        onChange={handleChange}
        multiple={multiple}
        displayEmpty={true}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: bg,
              border: `1px solid ${borderColor}`,
              boxShadow: isDark
                ? '0 4px 16px rgba(0,0,0,0.5)'
                : '0 4px 16px rgba(0,0,0,0.1)',
              '& .MuiMenuItem-root': {
                color: textColor,
                '&:hover': {
                  backgroundColor: bgHover,
                },
                '&.Mui-selected': {
                  backgroundColor: selectedBg,
                  '&:hover': {
                    backgroundColor: selectedHoverBg,
                  },
                },
              },
            },
          },
        }}
        sx={{
          '& .MuiSelect-select': {
            padding: '10.5px 14px',
            minHeight: '21px !important',
            lineHeight: '1.5',
            color: textColor,
          },
          '& .MuiSelect-icon': {
            color: labelColor,
          },
          backgroundColor: bg,
          borderRadius: '0.375rem',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: borderColor,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: borderHover,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: borderFocus,
          },
        }}
      >
        {allowEmpty && (
          <MenuItem value="">
            <span style={{ color: placeholderColor }}>{placeholder || 'Seçiniz'}</span>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText sx={{ color: '#f87171' }}>{error}</FormHelperText>}
    </FormControl>
  );
};

export default CustomSelect;