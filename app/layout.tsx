// app/layout.tsx

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReplyFast — WhatsApp AI for Indian Businesses',
  description: 'AI-powered WhatsApp automation for restaurants, salons, clinics and more. Queue management, delivery coordination, bookings — all on WhatsApp.',
  keywords: 'whatsapp ai, indian business, queue management, delivery coordination, appointment booking',
  openGraph: {
    title: 'ReplyFast — WhatsApp AI for Indian Businesses',
    description: 'Let AI handle your WhatsApp 24/7. Focus on your business.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
