import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'HealthSync | AI-Powered Enterprise Healthcare Operating System',
  description: 'A modern, premium enterprise healthcare operating system for medical logistics, clinic scheduling, and real-time patient orchestration.',
  keywords: 'healthcare saas, patient flow, clinic operating system, EMR orchestration, AI clinical copilot',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased bg-brand-bg text-brand-text">
        {children}
      </body>
    </html>
  );
}
