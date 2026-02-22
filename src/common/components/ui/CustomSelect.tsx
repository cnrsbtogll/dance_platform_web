import React, { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, Checkbox, ListItemText, Box } from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import Button from './Button';

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
  const [open, setOpen] = useState(false);

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

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
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
        renderValue={(selected: any) => {
          if (multiple) {
            if (!selected || selected.length === 0) {
              return <span style={{ color: placeholderColor }}>{placeholder || 'Seçiniz'}</span>;
            }
            if (Array.isArray(selected)) {
              return options
                .filter(opt => selected.includes(opt.value))
                .map(opt => opt.label)
                .join(', ');
            }
          }
          if (!selected) {
            return <span style={{ color: placeholderColor }}>{placeholder || 'Seçiniz'}</span>;
          }
          const option = options.find(opt => opt.value === selected);
          return option ? option.label : selected;
        }}
      >
        {!multiple && allowEmpty && (
          <MenuItem value="">
            <span style={{ color: placeholderColor }}>{placeholder || 'Seçiniz'}</span>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {multiple && (
              <Checkbox
                checked={Array.isArray(value) && value.indexOf(option.value) > -1}
                size="small"
                sx={{
                  padding: '0 8px 0 0',
                  color: labelColor,
                  '&.Mui-checked': {
                    color: borderFocus,
                  },
                }}
              />
            )}
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
        {multiple && (
          <Box
            sx={{
              p: 1.5,
              borderTop: `1px solid ${borderColor}`,
              backgroundColor: bg,
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'auto'
            }}
            onMouseDown={(e) => {
              // Prevent losing focus from the select
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Button
              variant={isSchool ? 'school' : colorVariant === 'instructor' ? 'instructor' : 'primary'}
              fullWidth
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="py-1.5 text-sm"
            >
              Tamam
            </Button>
          </Box>
        )}
      </Select>
      {error && <FormHelperText sx={{ color: '#f87171' }}>{error}</FormHelperText>}
    </FormControl>
  );
};

export default CustomSelect;