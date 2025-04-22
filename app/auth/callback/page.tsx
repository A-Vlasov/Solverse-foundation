'use client';

import React from 'react';
import { AuthRedirect } from '@/modules/auth';

export default function TelegramCallbackPage() {
  const handleComplete = (success: boolean) => {
    console.log('Auth process completed with status:', success ? 'success' : 'failure');
  };

  return (
    <div className="min-h-screen bg-dark-1 flex flex-col items-center justify-center p-4">
      <AuthRedirect 
        onComplete={handleComplete}
        redirectPath="/dashboard"
      />
    </div>
  );
} 