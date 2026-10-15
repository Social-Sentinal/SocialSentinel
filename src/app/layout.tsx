import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SocialSentinel — AI-Powered Social Intelligence Network',
  description:
    'A production-grade AI social platform featuring explainable recommendations, live sentiment analysis, healthy-feed controls, and topic communities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
