"use client";

import React from 'react';
import { NotificationProvider } from '../components/NotificationSystem';
import { SecurityProvider } from '../context/SecurityContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function ClientProviders({ children }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <SecurityProvider>
          {children}
        </SecurityProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
