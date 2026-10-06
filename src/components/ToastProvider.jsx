'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#072A44',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '14px',
          borderRadius: '14px',
          border: '1px solid rgba(207, 224, 245, 0.25)',
          boxShadow: '0 12px 28px rgba(7, 42, 68, 0.25)',
          padding: '12px 18px',
        },
        success: {
          style: {
            background: '#072A44',
            color: '#ffffff',
            border: '1px solid #10B981',
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#072A44',
          },
        },
        error: {
          style: {
            background: '#072A44',
            color: '#ffffff',
            border: '1px solid #EF4444',
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}
