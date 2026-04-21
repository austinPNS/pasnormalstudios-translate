import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PNS Translate',
  description: 'Sanity document translation editor for Pas Normal Studios',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
