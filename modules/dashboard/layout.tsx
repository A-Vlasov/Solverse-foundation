'use client';

import React from 'react';

import { RequireAuth } from '@/modules/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      {children}
    </RequireAuth>
  );
} 