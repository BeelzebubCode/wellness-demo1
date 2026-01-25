import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  // ✅ 1. เพิ่ม 'icon' เข้าไปใน Type นี้
  size?: 'sm' | 'md' | 'lg' | 'icon'; 
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  fullWidth?: boolean;
  minWidth?: string | number;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      minWidth,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-offset-2
      disabled:opacity-60 disabled:cursor-not-allowed
      active:scale-[0.98]
    `;

    const variantStyles = {
      primary:
        'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40',
      secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
      outline:
        'border-2 border-gray-300 bg-white text-gray-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md',
      success: 'bg-green-500 text-white hover:bg-green-600 shadow-md',
    };

    const sizeStyles = {
      sm: 'h-10 px-4 text-sm',
      md: 'h-12 lg:h-14 px-6 text-base lg:text-lg',
      lg: 'h-14 lg:h-16 px-8 text-lg lg:text-xl',
      // ✅ 2. เพิ่ม Style สำหรับ icon (บังคับความกว้าง=สูง และตัด padding)
      icon: 'h-10 w-10 p-0 text-base shrink-0', 
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size as keyof typeof sizeStyles], // Cast เพื่อแก้ Type Error ชั่วคราวถ้ามี
          fullWidth && 'w-full',
          className
        )}
        style={{
          ...style,
          ...(minWidth != null ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : {}),
        }}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {/* ✅ 3. ซ่อน Text ถ้าเป็นปุ่ม Icon */}
            {size !== 'icon' && <span>กำลังโหลด...</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className={size === 'icon' ? '' : 'text-xl lg:text-2xl'}>{leftIcon}</span>}
            {children}
            {rightIcon && <span className={size === 'icon' ? '' : 'text-xl lg:text-2xl'}>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };