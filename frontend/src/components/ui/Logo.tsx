import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
  };

  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
        {/* Automotive Wrench + Gear + Shield Logo SVG */}
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto drop-shadow-sm"
        >
          {/* Outer Shield/Badge */}
          <path
            d="M22 2L4 9V20C4 31.1 11.7 41.2 22 44C32.3 41.2 40 31.1 40 20V9L22 2Z"
            fill="url(#logo-grad)"
          />
          {/* Vehicle Front Grid / Speed Lines */}
          <path
            d="M12 16H32M10 21H34M14 26H30"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.3"
          />
          {/* Central Wrench Motif */}
          <path
            d="M27.5 14.5C26.1 13.1 23.9 13.1 22.5 14.5L16 21L13.5 18.5C12.7 17.7 11.3 17.7 10.5 18.5C9.7 19.3 9.7 20.7 10.5 21.5L14 25L10.5 28.5C9.7 29.3 9.7 30.7 10.5 31.5C11.3 32.3 12.7 32.3 13.5 31.5L17 28L20.5 31.5C21.3 32.3 22.7 32.3 23.5 31.5C24.3 30.7 24.3 29.3 23.5 28.5L21 26L27.5 19.5C28.9 18.1 28.9 15.9 27.5 14.5Z"
            fill="white"
          />
          {/* Sparkle/Dot for Tech */}
          <circle cx="31" cy="13" r="2.5" fill="#38BDF8" />

          <defs>
            <linearGradient id="logo-grad" x1="4" y1="2" x2="40" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0000FF" />
              <stop offset="1" stopColor="#000080" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {variant !== 'icon' && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-extrabold tracking-wider font-sans ${textClasses[size]} ${
              variant === 'light' ? 'text-white' : 'text-slate-900'
            }`}
          >
            VSMS<span className="text-brand-500 font-normal">.LK</span>
          </span>
          <span
            className={`text-[9px] uppercase tracking-widest font-semibold ${
              variant === 'light' ? 'text-slate-300' : 'text-slate-400'
            }`}
          >
            Vehicle Service Pro
          </span>
        </div>
      )}
    </div>
  );
};
