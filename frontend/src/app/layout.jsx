import '../index.css';
import React from 'react';
import ClientProviders from './ClientProviders';
import AppLayout from '../components/AppLayout';

export const metadata = {
  title: 'HexaShield Platform',
  description: 'Advanced Threat Intelligence & Assessment Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-cyber-black font-sans text-white">
        <ClientProviders>
          <AppLayout>
            {children}
          </AppLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
