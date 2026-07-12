'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
  glow?: boolean;
  glowColor?: 'primary' | 'accent' | 'success';
}

export function Card({
  children,
  className,
  hoverEffect = true,
  glow = false,
  glowColor = 'primary',
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={twMerge(
        'bg-white border border-brand-border rounded-[16px] p-6 shadow-sm transition-all duration-300',
        glow && glowColor === 'primary' && 'glow-primary border-brand-primary/20',
        glow && glowColor === 'accent' && 'glow-accent border-brand-accent/20',
        glow && glowColor === 'success' && 'glow-success border-brand-secondary/20',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge('flex flex-col space-y-1.5 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={twMerge('text-lg font-semibold tracking-tight text-brand-text', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={twMerge('text-sm text-brand-muted', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge('pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge('flex items-center pt-4 border-t border-brand-border/60 mt-4', className)} {...props}>
      {children}
    </div>
  );
}
