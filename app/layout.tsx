import './globals.css';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Динамически импортируем компоненты, которые используют клиентский код
const ClientProvider = dynamic(() => import('./providers/ClientProvider'), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'OnlyFans',
  description: 'OnlyFans application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
} 