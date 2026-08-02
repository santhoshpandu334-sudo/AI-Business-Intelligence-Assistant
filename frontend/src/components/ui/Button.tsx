import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base font-semibold"
  };

  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-glow shadow-indigo-500/25 border border-indigo-400/30",
    secondary: "bg-slate-800/80 hover:bg-slate-700 text-slate-100 border border-slate-700/60",
    outline: "border border-indigo-500/40 hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20",
    ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
