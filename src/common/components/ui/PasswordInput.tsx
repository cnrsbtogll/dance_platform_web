import React, { useState } from 'react';
import { HiEye, HiEyeSlash } from 'react-icons/hi2';

interface PasswordInputProps {
    id: string;
    name?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    required?: boolean;
    placeholder?: string;
    autoComplete?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
    id,
    name,
    value,
    onChange,
    className = '',
    required = false,
    placeholder,
    autoComplete
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="relative">
            <input
                id={id}
                name={name || id}
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                className={`w-full p-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-pink ${className}`}
                required={required}
                placeholder={placeholder}
                autoComplete={autoComplete}
            />
            <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 group focus:outline-none"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
                {showPassword ? (
                    <HiEyeSlash className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
                ) : (
                    <HiEye className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
                )}
            </button>
        </div>
    );
};

export default PasswordInput;
