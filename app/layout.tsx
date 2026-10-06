import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';

export const metadata: Metadata = {
  title: 'REMINDLY — AI Commitment & Reminder Agent',
  description:
    'An AI agent that turns everyday conversations into reliable commitments and reminders for individuals and groups.',
  keywords: ['AI Agent', 'Telegram Bot', 'Reminders', 'Group Scheduling', 'VoiceBox Design'],
  authors: [{ name: 'Remindly' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAFA] text-[#0A0A0A] min-h-screen antialiased selection:bg-[#EF4444] selection:text-white font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
