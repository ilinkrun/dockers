import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'work-web',
  description: 'work-web application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
