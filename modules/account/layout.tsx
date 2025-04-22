'use client';

import React from 'react';

import { RequireAuth } from '@/modules/auth'; 

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    
    <RequireAuth>
      {children}
    </RequireAuth>
  );
} 