import React, { ChangeEvent } from 'react';
import { TextField } from '@mui/material';
import { IMaskInput } from 'react-imask';

interface CustomMaskProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const CountryCodeMask = React.forwardRef<HTMLInputElement, CustomMaskProps>(
  function CountryCodeMask(props, ref) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask={"+00[0][0]"}
        definitions={{
          '0': /[0-9]/
        }}
        inputRef={ref}
        onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
      />
    );
  }
);

const PhoneNumberMask = React.forwardRef<HTMLInputElement, CustomMaskProps>(
  function PhoneNumberMask(props, ref) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask={"000 000 0000"}
        definitions={{
          '0': /[0-9]/
        }}
        inputRef={ref}
        onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
      />
    );
  }
);

export interface CustomPhoneInputProps {
  name: string;
  label: string;
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
}

export const CustomPhoneInput: React.FC<CustomPhoneInputProps> = ({
  name,
  label,
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  error = false,
  helperText,
  fullWidth = true,
  disabled = false,
  required = false,
  autoComplete,
}) => {
  return (
    <div className="flex gap-2 items-start">
      <TextField
        name={`${name}-country-code`}
        label="Ülke Kodu"
        value={countryCode}
        onChange={(e) => onCountryCodeChange(e.target.value)}
        error={error}
        required={required}
        disabled={disabled}
        variant="outlined"
        size="small"
        sx={{ width: '120px' }}
        autoComplete={autoComplete}
        InputProps={{
          inputComponent: CountryCodeMask as any,
          inputProps: {
            placeholder: '+XX'
          }
        }}
      />
      <TextField
        name={`${name}-phone-number`}
        label={label}
        value={phoneNumber}
        onChange={(e) => onPhoneNumberChange(e.target.value)}
        error={error}
        helperText={helperText || "Örnek: 532 123 4567"}
        fullWidth={fullWidth}
        required={required}
        disabled={disabled}
        variant="outlined"
        size="small"
        autoComplete={autoComplete}
        InputProps={{
          inputComponent: PhoneNumberMask as any,
          inputProps: {
            placeholder: 'XXX XXX XXXX'
          }
        }}
      />
    </div>
  );
};

export default CustomPhoneInput; 