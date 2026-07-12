'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/95 shadow-sm shadow-brand-primary/10 hover:shadow-brand-primary/20 hover:-translate-y-[1px]',
    secondary: 'bg-brand-bg-subtle text-brand-text border border-brand-border hover:bg-slate-100 hover:border-slate-300',
    accent: 'bg-brand-accent text-white hover:bg-brand-accent/95 shadow-sm shadow-brand-accent/10 hover:-translate-y-[1px]',
    ghost: 'text-brand-text hover:bg-slate-100',
    danger: 'bg-brand-danger text-white hover:bg-brand-danger/95 shadow-sm shadow-brand-danger/10 hover:-translate-y-[1px]',
    success: 'bg-brand-success text-white hover:bg-brand-success/95 shadow-sm shadow-brand-success/10 hover:-translate-y-[1px]'
  };

  const sizes = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-11 w-11 p-0'
  };

  const buttonClasses = twMerge(baseStyles, variants[variant], sizes[size], className);

  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.98 }}
      className={buttonClasses}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
