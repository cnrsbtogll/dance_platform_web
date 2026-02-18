import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverEffect?: boolean;
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    hoverEffect = false,
    noPadding = false,
}) => {
    return (
        <div
            onClick={onClick}
            className={`
        bg-brand-card rounded-2xl border border-gray-100 shadow-premium
        ${hoverEffect ? 'hover:shadow-premium-hover hover:-translate-y-1 cursor-pointer transition-all duration-300' : ''}
        ${!noPadding ? 'p-6' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default Card;
