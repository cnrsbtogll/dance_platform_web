import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
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
  className?: string;
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
  className = '',
}) => {
  const handleChange = (event: any) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      error={!!error}
      required={required}
      className={className}
      sx={{
        minWidth: 120,
        margin: 0,
        '& .MuiInputBase-root': {
          height: '45px'
        }
      }}
    >
      {label && (
        <InputLabel
          id={`${name}-label`}
          sx={{
            backgroundColor: 'white',
            px: 1,
            transform: 'translate(14px, -9px) scale(0.75)',
            color: '#64748B', // slate-500
            '&.Mui-focused': {
              color: '#005F73', // brand-secondary
            },
            '&.MuiInputLabel-shrink': {
              backgroundColor: 'white',
              transform: 'translate(14px, -9px) scale(0.75)'
            }
          }}
          shrink={true}
        >
          {label}
        </InputLabel>
      )}
      <Select
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={value}
        label={label}
        onChange={handleChange}
        multiple={multiple}
        displayEmpty={true}
        sx={{
          '& .MuiSelect-select': {
            padding: '10.5px 14px',
            minHeight: '21px !important',
            lineHeight: '1.5',
            color: '#0F172A', // brand-text
          },
          backgroundColor: 'white',
          borderRadius: '0.75rem', // rounded-xl matches design
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E2E8F0', // brand-border
            borderWidth: '1px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94A3B8', // slate-400
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#005F73', // brand-secondary
            borderWidth: '2px',
          }
        }}
      >
        {allowEmpty && (
          <MenuItem value="">
            <span className="text-gray-400">{placeholder || 'Seçiniz'}</span>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default CustomSelect; 